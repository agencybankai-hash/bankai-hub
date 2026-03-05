// ═══════════════════════════════════════════════════
// LLM Provider Factory
// ═══════════════════════════════════════════════════

import { LLMProvider } from "./types";
import { ClaudeProvider } from "./claude";
import { DeepSeekProvider } from "./deepseek";

export type { LLMProvider, LLMRequestOptions, LLMResponse } from "./types";

const providers: Record<string, () => LLMProvider> = {
  claude: () => new ClaudeProvider(),
  deepseek: () => new DeepSeekProvider(),
};

// Singleton instances
const instances = new Map<string, LLMProvider>();

/**
 * Get an LLM provider by ID.
 * Returns a singleton instance.
 */
export function getLLMProvider(id: string = "claude"): LLMProvider {
  if (!instances.has(id)) {
    const factory = providers[id];
    if (!factory) {
      throw new Error(`Unknown LLM provider: "${id}". Available: ${Object.keys(providers).join(", ")}`);
    }
    instances.set(id, factory());
  }
  return instances.get(id)!;
}

/**
 * Get the best available LLM provider.
 * Prefers Claude, falls back to DeepSeek.
 */
export function getDefaultLLMProvider(): LLMProvider {
  const claude = getLLMProvider("claude");
  if (claude.isConfigured()) return claude;

  const deepseek = getLLMProvider("deepseek");
  if (deepseek.isConfigured()) return deepseek;

  throw new Error("No LLM provider configured. Set ANTHROPIC_API_KEY or DEEPSEEK_API_KEY.");
}

/**
 * Get a lightweight LLM provider for simple tasks.
 * Uses DeepSeek if available (cheaper), otherwise Claude.
 */
export function getLightLLMProvider(): LLMProvider {
  const deepseek = getLLMProvider("deepseek");
  if (deepseek.isConfigured()) return deepseek;

  return getLLMProvider("claude");
}

/**
 * List all registered LLM providers with their status.
 */
export function listLLMProviders(): { id: string; name: string; configured: boolean }[] {
  return Object.keys(providers).map((id) => {
    const provider = getLLMProvider(id);
    return {
      id: provider.id,
      name: provider.name,
      configured: provider.isConfigured(),
    };
  });
}

/**
 * Register a custom LLM provider.
 */
export function registerLLMProvider(id: string, factory: () => LLMProvider): void {
  providers[id] = factory;
  instances.delete(id); // Clear cached instance
}
