export type UserRole = 'admin' | 'user';
export type ProviderType = 'bedrock' | 'azure-openai' | 'openai' | 'gemini';
export type AccessType = 'all' | 'specific';

export interface NerdUser {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  assignedModels: string[];
  createdAt: number;
  active: boolean;
}

export interface BedrockConfig {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
}

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
}

export interface OpenAICompatibleConfig {
  apiKey: string;
  baseUrl: string;
}

export interface GeminiConfig {
  apiKey: string;
}

export type ProviderConfig = BedrockConfig | AzureOpenAIConfig | OpenAICompatibleConfig | GeminiConfig;

export interface NerdModel {
  id: string;
  displayName: string;
  provider: ProviderType;
  modelId: string;
  config: ProviderConfig;
  accessType: AccessType;
  allowedUsers: string[];
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  active: boolean;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelId?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuthSession {
  userId: string;
  username: string;
  role: UserRole;
  token: string;
  expiresAt: number;
}

export interface NerdAISettings {
  systemName: string;
  welcomeMessage: string;
  allowRegistration: boolean;
  defaultSystemPrompt: string;
}
