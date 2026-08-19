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

async function signBedrockRequest(
  method: string,
  url: string,
  body: string,
  creds: { accessKeyId: string; secretAccessKey: string; sessionToken?: string; region: string }
): Promise<Record<string, string>> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const urlObj = new URL(url);
  const host = urlObj.host;
  const canonicalUri = urlObj.pathname;
  const payloadHash = await sha256Hex(body);

  let canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  let signedHeaders = 'content-type;host;x-amz-date';
  if (creds.sessionToken) {
    canonicalHeaders += `x-amz-security-token:${creds.sessionToken}\n`;
    signedHeaders += ';x-amz-security-token';
  }

  const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credScope = `${dateStamp}/${creds.region}/bedrock/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credScope, await sha256Hex(canonicalRequest)].join('\n');

  const signingKey = await getSigningKey(creds.secretAccessKey, dateStamp, creds.region, 'bedrock');
  const sig = await bufToHex(await hmacSha256(signingKey, stringToSign));

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Amz-Date': amzDate,
    'Authorization': `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`,
  };
  if (creds.sessionToken) headers['X-Amz-Security-Token'] = creds.sessionToken;
  return headers;
}

interface ChatMsg { role: string; content: string }

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const {
      provider,
      config,
      messages,
      modelId,
      maxTokens = 2048,
      temperature = 0.7,
      systemPrompt,
      stream: wantStream = true,
    } = body as {
      provider: string;
      config: Record<string, string>;
      messages: ChatMsg[];
      modelId: string;
      maxTokens: number;
      temperature: number;
      systemPrompt?: string;
      stream?: boolean;
    };

    if (provider === 'bedrock') {
      const endpoint = `https://bedrock-runtime.${config.region}.amazonaws.com/model/${encodeURIComponent(modelId)}/converse`;
      const bedrockMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: [{ type: 'text', text: m.content }] }));

      const bedrockBody = JSON.stringify({
        messages: bedrockMessages,
        ...(systemPrompt ? { system: [{ text: systemPrompt }] } : {}),
        inferenceConfig: { maxTokens, temperature },
      });

      const headers = await signBedrockRequest('POST', endpoint, bedrockBody, {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        sessionToken: config.sessionToken,
        region: config.region,
      });

      const res = await fetch(endpoint, { method: 'POST', headers, body: bedrockBody });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      const data = await res.json();
      const content: string = data?.output?.message?.content?.[0]?.text ?? '';
      return NextResponse.json({ content });
    }

    if (provider === 'openai' || provider === 'azure-openai') {
      let endpoint: string;
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };

      if (provider === 'azure-openai') {
        endpoint = `${config.endpoint}/openai/deployments/${config.deploymentName}/chat/completions?api-version=${config.apiVersion}`;
        reqHeaders['api-key'] = config.apiKey;
      } else {
        endpoint = `${config.baseUrl}/chat/completions`;
        reqHeaders['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const chatMessages: ChatMsg[] = [];
      if (systemPrompt) chatMessages.push({ role: 'system', content: systemPrompt });
      chatMessages.push(...messages.filter(m => m.role !== 'system'));

      const openAIBody = JSON.stringify({
        model: provider === 'azure-openai' ? undefined : modelId,
        messages: chatMessages,
        max_tokens: maxTokens,
        temperature,
        stream: wantStream,
      });

      const upstreamRes = await fetch(endpoint, { method: 'POST', headers: reqHeaders, body: openAIBody });
      if (!upstreamRes.ok) {
        const err = await upstreamRes.text();
        return NextResponse.json({ error: err }, { status: upstreamRes.status });
      }

      if (!wantStream) {
        const data = await upstreamRes.json();
        const content: string = data?.choices?.[0]?.message?.content ?? '';
        return NextResponse.json({ content });
      }

      const readable = new ReadableStream({
        async start(controller) {
          const reader = upstreamRes.body?.getReader();
          if (!reader) { controller.close(); return; }
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(enc.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const jsonStr = trimmed.slice(5).trim();
              if (jsonStr === '[DONE]') {
                controller.enqueue(enc.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const chunk = JSON.parse(jsonStr);
                const delta = chunk?.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(enc.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
                }
              } catch { /* skip malformed */ }
            }
          }
        },
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
      });
    }

    if (provider === 'gemini') {
      const geminiMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

      const geminiBody = JSON.stringify({
        contents: geminiMessages,
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      });

      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${config.apiKey}&alt=sse`;
      const upstreamRes = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: geminiBody,
      });

      if (!upstreamRes.ok) {
        const err = await upstreamRes.text();
        return NextResponse.json({ error: err }, { status: upstreamRes.status });
      }

      const readable = new ReadableStream({
        async start(controller) {
          const reader = upstreamRes.body?.getReader();
          if (!reader) { controller.close(); return; }
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(enc.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const jsonStr = trimmed.slice(5).trim();
              try {
                const chunk = JSON.parse(jsonStr);
                const text: string = chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                if (text) {
                  controller.enqueue(enc.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
        },
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
      });
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
