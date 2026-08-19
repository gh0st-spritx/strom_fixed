import { NextRequest, NextResponse } from 'next/server';

const enc = new TextEncoder();

async function bufToHex(buf: ArrayBuffer): Promise<string> {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const rawKey: ArrayBuffer = key instanceof Uint8Array ? key.buffer as ArrayBuffer : key as ArrayBuffer;
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw', rawKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return globalThis.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
}

async function sha256Hex(data: string): Promise<string> {
  return bufToHex(await globalThis.crypto.subtle.digest('SHA-256', enc.encode(data)));
}

async function getSigningKey(secret: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(enc.encode(`AWS4${secret}`), date);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

async function signBedrockGetRequest(
  url: string,
  creds: { accessKeyId: string; secretAccessKey: string; sessionToken?: string; region: string }
): Promise<Record<string, string>> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const urlObj = new URL(url);
  const host = urlObj.host;
  const canonicalUri = urlObj.pathname;
  const payloadHash = await sha256Hex('');

  let canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`;
  let signedHeaders = 'host;x-amz-date';
  if (creds.sessionToken) {
    canonicalHeaders += `x-amz-security-token:${creds.sessionToken}\n`;
    signedHeaders += ';x-amz-security-token';
  }

  const canonicalRequest = ['GET', canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credScope = `${dateStamp}/${creds.region}/bedrock/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credScope, await sha256Hex(canonicalRequest)].join('\n');

  const signingKey = await getSigningKey(creds.secretAccessKey, dateStamp, creds.region, 'bedrock');
  const sig = await bufToHex(await hmacSha256(signingKey, stringToSign));

  const headers: Record<string, string> = {
    'X-Amz-Date': amzDate,
    'Authorization': `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`,
  };
  if (creds.sessionToken) headers['X-Amz-Security-Token'] = creds.sessionToken;
  return headers;
}

interface SyncedModel { id: string; name: string }

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { provider, config } = await req.json() as { provider: string; config: Record<string, string> };

    if (provider === 'bedrock') {
      const endpoint = `https://bedrock.${config.region}.amazonaws.com/foundation-models`;
      const headers = await signBedrockGetRequest(endpoint, {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        sessionToken: config.sessionToken,
        region: config.region,
      });
      const res = await fetch(endpoint, { headers });
      if (!res.ok) {
        return NextResponse.json({ error: await res.text() }, { status: res.status });
      }
      const data = await res.json();
      const models: SyncedModel[] = (data.modelSummaries ?? [])
        .filter((m: Record<string, unknown>) => {
          const modalities = m.outputModalities as string[] | undefined;
          return modalities?.includes('TEXT') || m.responseStreamingSupported;
        })
        .map((m: Record<string, unknown>) => ({ id: m.modelId as string, name: m.modelName as string }));
      return NextResponse.json({ models });
    }

    if (provider === 'azure-openai') {
      const endpoint = `${config.endpoint}/openai/deployments?api-version=${config.apiVersion}`;
      const res = await fetch(endpoint, { headers: { 'api-key': config.apiKey } });
      if (!res.ok) {
        return NextResponse.json({ error: await res.text() }, { status: res.status });
      }
      const data = await res.json();
      const models: SyncedModel[] = (data.data ?? []).map((d: Record<string, string>) => ({
        id: d.id,
        name: d.model ?? d.id,
      }));
      return NextResponse.json({ models });
    }

    if (provider === 'openai') {
      const endpoint = `${config.baseUrl}/models`;
      const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${config.apiKey}` } });
      if (!res.ok) {
        return NextResponse.json({ error: await res.text() }, { status: res.status });
      }
      const data = await res.json();
      const INCLUDE_PATTERNS = ['gpt', 'o1', 'o3', 'claude', 'mistral', 'llama'];
      const models: SyncedModel[] = (data.data ?? [])
        .filter((m: Record<string, string>) => INCLUDE_PATTERNS.some(p => m.id.toLowerCase().includes(p)))
        .map((m: Record<string, string>) => ({ id: m.id, name: m.id }));
      return NextResponse.json({ models });
    }

    if (provider === 'gemini') {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        return NextResponse.json({ error: await res.text() }, { status: res.status });
      }
      const data = await res.json();
      const models: SyncedModel[] = (data.models ?? [])
        .filter((m: Record<string, unknown>) => {
          const methods = m.supportedGenerationMethods as string[] | undefined;
          return methods?.includes('generateContent');
        })
        .map((m: Record<string, string>) => ({
          id: m.name.replace('models/', ''),
          name: m.displayName ?? m.name.replace('models/', ''),
        }));
      return NextResponse.json({ models });
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
