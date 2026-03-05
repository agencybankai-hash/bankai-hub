// ═══════════════════════════════════════════════════
// SERP Provider Factory
// ═══════════════════════════════════════════════════

import { SerpProvider } from "./types";
import { XmlriverProvider } from "./xmlriver";
import { SerpApiProvider } from "./serpapi";

export type { SerpProvider, SerpQuery } from "./types";

const providers: Record<string, () => SerpProvider> = {
  xmlriver: () => new XmlriverProvider(),
  serpapi: () => new SerpApiProvider(),
};

const instances = new Map<string, SerpProvider>();

export function getSerpProvider(id: string = "xmlriver"): SerpProvider {
  if (!instances.has(id)) {
    const factory = providers[id];
    if (!factory) {
      throw new Error(`Unknown SERP provider: "${id}". Available: ${Object.keys(providers).join(", ")}`);
    }
    instances.set(id, factory());
  }
  return instances.get(id)!;
}

export function getDefaultSerpProvider(): SerpProvider {
  for (const id of ["xmlriver", "serpapi"]) {
    const provider = getSerpProvider(id);
    if (provider.isConfigured()) return provider;
  }
  throw new Error("No SERP provider configured. Set XMLRIVER_USER/KEY or SERPAPI_KEY.");
}

export function listSerpProviders(): { id: string; name: string; configured: boolean }[] {
  return Object.keys(providers).map((id) => {
    const provider = getSerpProvider(id);
    return { id: provider.id, name: provider.name, configured: provider.isConfigured() };
  });
}

export function registerSerpProvider(id: string, factory: () => SerpProvider): void {
  providers[id] = factory;
  instances.delete(id);
}
