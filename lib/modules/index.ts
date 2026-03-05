// ═══════════════════════════════════════════════════
// Module System — Main Entry Point
// ═══════════════════════════════════════════════════

import { registry } from "./registry";

// Import all built-in modules
import { SerpCollectorModule } from "./serp-collector";
import { PageParserModule } from "./page-parser";
import { RelevanceCloudModule } from "./relevance-cloud";
import { PageAuditModule } from "./page-audit";

let initialized = false;

/**
 * Initialize the module system with all built-in modules.
 * Safe to call multiple times — only runs once.
 */
export function initializeModules(): void {
  if (initialized) return;

  // Register core modules
  registry.register(new SerpCollectorModule());
  registry.register(new PageParserModule());
  registry.register(new RelevanceCloudModule());
  registry.register(new PageAuditModule());

  // Register the default analysis pipeline
  registry.registerPipeline({
    id: "full-analysis",
    name: "Full SEO Analysis Pipeline",
    steps: [
      { moduleId: "serp-collector" },
      { moduleId: "page-parser" },
      { moduleId: "relevance-cloud" },
      {
        moduleId: "page-audit",
        condition: (output: any) => !!output.projectUrl,
      },
    ],
  });

  initialized = true;
  console.log("[Modules] Platform initialized with", registry.getStatus().total, "modules");
}

// Re-export registry and types
export { registry } from "./registry";
export type {
  ModuleMetadata,
  ModuleInstance,
  ModuleConfig,
  ModuleStatus,
  ModuleCategory,
  AnalysisModule,
  ProviderModule,
  Pipeline,
  PipelineStep,
} from "./types";

// Re-export module classes for external use
export { SerpCollectorModule } from "./serp-collector";
export { PageParserModule } from "./page-parser";
export { RelevanceCloudModule } from "./relevance-cloud";
export { PageAuditModule } from "./page-audit";
