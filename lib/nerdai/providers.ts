'use client';
import { signRequest } from './sigv4';
import type { NerdModel, BedrockConfig, AzureOpenAIConfig, OpenAICompatibleConfig, GeminiConfig } from './types';

// Reads SSE stream and yields raw data payloads
async function* parseSSE(response: Response): AsyncGenerator<string> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith('data:')) yield t.slice(5).trim();
    }
  }
  if (buf.trim().startsWith('data:')) yield buf.trim().slice(5).trim();
}

async function streamOpenAI(
  config: OpenAICompatibleConfig,
  messages: { role: string; content: string }[],
  modelId: string,
  maxTokens: number,
  temperature: number,
  systemPrompt: string,
  onChunk: (acc: string) => void,
): Promise<string> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
    body: JSON.stringify({ model: modelId, messages: allMessages, max_tokens: maxTokens, temperature, stream: true }),
  });
  if (!res.ok) throw new Error(`OpenAI error (${res.status}): ${await res.text()}`);

  let acc = '';
  for await (const data of parseSSE(res)) {
    if (data === '[DONE]') break;
    try {
      const json = JSON.parse(data);
      const chunk: string = json.choices?.[0]?.delta?.content ?? '';
      if (chunk) { acc += chunk; onChunk(acc); }
    } catch { /* skip malformed */ }
  }
  return acc;
}

async function streamAzure(
  config: AzureOpenAIConfig,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature: number,
  systemPrompt: string,
  onChunk: (acc: string) => void,
): Promise<string> {
  const allMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];
  const apiVersion = config.apiVersion || '2024-02-01';
  const url = `${config.endpoint}/openai/deployments/${config.deploymentName}/chat/completions?api-version=${apiVersion}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': config.apiKey },
    body: JSON.stringify({ messages: allMessages, max_tokens: maxTokens, temperature, stream: true }),
  });
  if (!res.ok) throw new Error(`Azure error (${res.status}): ${await res.text()}`);

  let acc = '';
  for await (const data of parseSSE(res)) {
    if (data === '[DONE]') break;
    try {
      const json = JSON.parse(data);
      const chunk: string = json.choices?.[0]?.delta?.content ?? '';
      if (chunk) { acc += chunk; onChunk(acc); }
    } catch { /* skip malformed */ }
  }
  return acc;
}

async function streamGemini(
  config: GeminiConfig,
  messages: { role: string; content: string }[],
  modelId: string,
  maxTokens: number,
  temperature: number,
  systemPrompt: string,
  onChunk: (acc: string) => void,
): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const body: Record<string, unknown> = {
    contents,
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  };
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${config.apiKey}&alt=sse`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`Gemini error (${res.status}): ${await res.text()}`);

  let acc = '';
  for await (const data of parseSSE(res)) {
    if (!data) continue;
    try {
      const json = JSON.parse(data);
      const chunk: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (chunk) { acc += chunk; onChunk(acc); }
    } catch { /* skip malformed */ }
  }
  return acc;
}

async function callBedrock(
  config: BedrockConfig,
  messages: { role: string; content: string }[],
  modelId: string,
  maxTokens: number,
  temperature: number,
  systemPrompt: string,
): Promise<string> {
  // Note: Bedrock does not enable CORS for browser requests.
  // This will succeed only when the app is deployed on a server (not GitHub Pages).
  const endpoint = `https://bedrock-runtime.${config.region}.amazonaws.com/model/${encodeURIComponent(modelId)}/converse`;
  const bodyObj: Record<string, unknown> = {
    messages: messages.map(m => ({ role: m.role, content: [{ type: 'text', text: m.content }] })),
    inferenceConfig: { maxTokens, temperature },
  };
  if (systemPrompt) bodyObj.system = [{ text: systemPrompt }];
  const bodyStr = JSON.stringify(bodyObj);

  const headers = await signRequest('POST', endpoint, bodyStr, config, 'bedrock');
  const res = await fetch(endpoint, { method: 'POST', headers, body: bodyStr });
  if (!res.ok) throw new Error(`Bedrock error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.output?.message?.content?.[0]?.text ?? '') as string;
}

export async function callAI(
  model: NerdModel,
  messages: { role: string; content: string }[],
  systemPrompt: string,
  onChunk: (accumulated: string) => void,
): Promise<string> {
  switch (model.provider) {
    case 'openai':
      return streamOpenAI(model.config as OpenAICompatibleConfig, messages, model.modelId, model.maxTokens, model.temperature, systemPrompt, onChunk);
    case 'azure-openai':
      return streamAzure(model.config as AzureOpenAIConfig, messages, model.maxTokens, model.temperature, systemPrompt, onChunk);
    case 'gemini':
      return streamGemini(model.config as GeminiConfig, messages, model.modelId, model.maxTokens, model.temperature, systemPrompt, onChunk);
    case 'bedrock':
      return callBedrock(model.config as BedrockConfig, messages, model.modelId, model.maxTokens, model.temperature, systemPrompt);
    default:
      throw new Error('Unknown provider');
  }
}
