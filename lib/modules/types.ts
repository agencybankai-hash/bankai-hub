// ═══════════════════════════════════════════════════
// Module System Types — Bankai Hub Modular Platform
// ═══════════════════════════════════════════════════

export type ModuleStatus = "active" | "inactive" | "error" | "loading";

export interface ModuleConfig {
  [key: string]: string | number | boolean | string[];
}

export interface ModuleMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: ModuleCategory;
  icon: string;          // lucide icon name
  requiredEnvVars?: string[];
  dependencies?: string[];
}

export type ModuleCategory =
  | "analysis"
  | "data-source"
  | "provider"
  | "export"
  | "visualization";

export interface ModuleInstance {
  metadata: ModuleMetadata;
  status: ModuleStatus;
  config: ModuleConfig;
  error?: string;
  lastRun?: string;
}

/**
 * Base interface for all analysis modules.
 * Each module implements execute() with typed input/output.
 */
export interface AnalysisModule<TInput = any, TOutput = any> {
  metadata: ModuleMetadata;

  /** Validate that required env vars and config exist */
  validate(): Promise<{ valid: boolean; errors: string[] }>;

  /** Execute the module's main logic */
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Provider module — abstraction for external services (LLM, SERP, etc.)
 */
export interface ProviderModule<TConfig = any> {
  metadata: ModuleMetadata;

  /** Check if provider is configured and reachable */
  healthCheck(): Promise<{ healthy: boolean; message: string }>;

  /** Get current provider config (without secrets) */
  getConfig(): TConfig;
}

/**
 * Event emitted by module system
 */
export interface ModuleEvent {
  type: "module:registered" | "module:activated" | "module:deactivated" | "module:error";
  moduleId: string;
  timestamp: string;
  data?: any;
}

/**
 * Pipeline step — modules can be chained
 */
export interface PipelineStep {
  moduleId: string;
  config?: ModuleConfig;
  condition?: (previousOutput: any) => boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  steps: PipelineStep[];
}
