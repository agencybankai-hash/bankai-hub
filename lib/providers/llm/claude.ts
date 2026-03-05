// ═══════════════════════════════════════════════════
// Claude LLM Provider
// ═══════════════════════════════════════════════════

import { LLMProvider, LLMRequestOptions, LLMResponse } from "./types";

export class ClaudeProvider implements LLMProvider {
  id = "claude";
  name = "Anthropic Claude";

  private get apiKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY;
  }

  private get defaultModel(): string {
    return process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
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
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required");

    const model = options?.model || this.defaultModel;
    const maxTokens = options?.maxTokens || 4096;
    const timeout = options?.timeout || 120000;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(timeout),
    });

    const data = await resp.json();

    if (data.error) {
      throw new Error(`Claude API: ${JSON.stringify(data.error)}`);
    }

    return {
      text: data.content?.[0]?.text || "",
      model,
      usage: data.usage
        ? {
            inputTokens: data.usage.input_tokens || 0,
            outputTokens: data.usage.output_tokens || 0,
          }
        : undefined,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { healthy: false, message: "ANTHROPIC_API_KEY not set" };
    }
    return { healthy: true, message: `Claude configured (model: ${this.defaultModel})` };
  }
}
