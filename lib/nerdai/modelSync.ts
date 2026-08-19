'use client';
import { signRequest } from './sigv4';
import type { ProviderType, BedrockConfig, AzureOpenAIConfig, OpenAICompatibleConfig, GeminiConfig } from './types';

export interface ModelOption {
  id: string;
  name: string;
}

async function syncBedrock(config: BedrockConfig): Promise<ModelOption[]> {
  const url = `https://bedrock.${config.region}.amazonaws.com/foundation-models`;
  const headers = await signRequest('GET', url, '', config, 'bedrock');
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) throw new Error(`Bedrock (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return ((data.modelSummaries ?? []) as { modelId: string; modelName: string; outputModalities?: string[] }[])
    .filter(m => m.outputModalities?.includes('TEXT'))
    .map(m => ({ id: m.modelId, name: m.modelName || m.modelId }));
}

async function syncAzure(config: AzureOpenAIConfig): Promise<ModelOption[]> {
  const apiVersion = config.apiVersion || '2024-02-01';
  const res = await fetch(`${config.endpoint}/openai/deployments?api-version=${apiVersion}`, {
    headers: { 'api-key': config.apiKey },
  });
  if (!res.ok) throw new Error(`Azure (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return ((data.data ?? []) as { id: string; model: string }[]).map(d => ({ id: d.id, name: `${d.id} (${d.model})` }));
}

async function syncOpenAI(config: OpenAICompatibleConfig): Promise<ModelOption[]> {
  const res = await fetch(`${config.baseUrl}/models`, {
    headers: { 'Authorization': `Bearer ${config.apiKey}` },
  });
  if (!res.ok) throw new Error(`OpenAI (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return ((data.data ?? []) as { id: string }[])
    .filter(m => /gpt|claude|llama|mistral|deepseek|o1|o3|qwen/i.test(m.id))
    .map(m => ({ id: m.id, name: m.id }));
}

async function syncGemini(config: GeminiConfig): Promise<ModelOption[]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
  if (!res.ok) throw new Error(`Gemini (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return ((data.models ?? []) as { name: string; displayName: string; supportedGenerationMethods?: string[] }[])
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => ({ id: m.name.replace('models/', ''), name: m.displayName || m.name }));
}

export async function syncModels(
  provider: ProviderType,
  config: BedrockConfig | AzureOpenAIConfig | OpenAICompatibleConfig | GeminiConfig,
): Promise<ModelOption[]> {
  switch (provider) {
    case 'bedrock': return syncBedrock(config as BedrockConfig);
    case 'azure-openai': return syncAzure(config as AzureOpenAIConfig);
    case 'openai': return syncOpenAI(config as OpenAICompatibleConfig);
    case 'gemini': return syncGemini(config as GeminiConfig);
    default: throw new Error('Unknown provider');
  }
}
