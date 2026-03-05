// ═══════════════════════════════════════════════════
// LLM Provider Types
// ═══════════════════════════════════════════════════

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequestOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface LLMResponse {
  text: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMProvider {
  id: string;
  name: string;

  /** Check if provider is configured */
  isConfigured(): boolean;

  /** Send a completion request */
  complete(
    system: string,
    prompt: string,
    options?: LLMRequestOptions
  ): Promise<LLMResponse>;

  /** Health check */
  healthCheck(): Promise<{ healthy: boolean; message: string }>;
}
