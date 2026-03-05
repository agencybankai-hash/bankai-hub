// ═══════════════════════════════════════════════════
// DeepSeek LLM Provider
// ═══════════════════════════════════════════════════

import { LLMProvider, LLMRequestOptions, LLMResponse } from "./types";

export class DeepSeekProvider implements LLMProvider {
  id = "deepseek";
  name = "DeepSeek";

  private get apiKey(): string | undefined {
    return process.env.DEEPSEEK_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async complete(
    system: string,
    prompt: string,
    options?: LLMRequestOptions
  ): Promise<LLMResponse> {
    const apiKey = this.apiKey;
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY is required");

    const model = options?.model || "deepseek-chat";
    const maxTokens = options?.maxTokens || 4096;
    const temperature = options?.temperature || 0.3;
    const timeout = options?.timeout || 120000;

    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
      signal: AbortSignal.timeout(timeout),
    });

    const data = await resp.json();

    return {
      text: data.choices?.[0]?.message?.content || "",
      model,
      usage: data.usage
        ? {
            inputTokens: data.usage.prompt_tokens || 0,
            outputTokens: data.usage.completion_tokens || 0,
          }
        : undefined,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { healthy: false, message: "DEEPSEEK_API_KEY not set" };
    }
    return { healthy: true, message: "DeepSeek configured" };
  }
}
