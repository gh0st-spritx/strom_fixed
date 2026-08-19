// Browser-compatible AWS SigV4 signing using Web Crypto API
const enc = new TextEncoder();

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const rawKey: ArrayBuffer = key instanceof Uint8Array ? key.buffer as ArrayBuffer : key as ArrayBuffer;
  const k = await crypto.subtle.importKey('raw', rawKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, enc.encode(data));
}

async function sha256(data: string): Promise<string> {
  return bufToHex(await crypto.subtle.digest('SHA-256', enc.encode(data)));
}

async function signingKey(secret: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmac(enc.encode(`AWS4${secret}`), date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

export interface AWSCreds {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
}

export async function signRequest(
  method: string,
  url: string,
  body: string,
  creds: AWSCreds,
  service: string,
): Promise<Record<string, string>> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const urlObj = new URL(url);
  const host = urlObj.host;
  const payloadHash = await sha256(body);

  let canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  let signedHeaders = 'content-type;host;x-amz-date';
  if (creds.sessionToken) {
    canonicalHeaders += `x-amz-security-token:${creds.sessionToken}\n`;
    signedHeaders += ';x-amz-security-token';
  }

  const canonicalReq = [method, urlObj.pathname, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const credScope = `${dateStamp}/${creds.region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credScope, await sha256(canonicalReq)].join('\n');
  const key = await signingKey(creds.secretAccessKey, dateStamp, creds.region, service);
  const sig = bufToHex(await hmac(key, stringToSign));

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Amz-Date': amzDate,
    'Authorization': `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`,
  };
  if (creds.sessionToken) headers['X-Amz-Security-Token'] = creds.sessionToken;
  return headers;
}
