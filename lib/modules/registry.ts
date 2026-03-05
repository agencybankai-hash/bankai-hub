// ═══════════════════════════════════════════════════
// Module Registry — Central hub for all platform modules
// ═══════════════════════════════════════════════════

import {
  ModuleInstance,
  ModuleMetadata,
  ModuleConfig,
  ModuleStatus,
  ModuleCategory,
  AnalysisModule,
  Pipeline,
} from "./types";

class ModuleRegistry {
  private modules = new Map<string, ModuleInstance>();
  private implementations = new Map<string, AnalysisModule>();
  private pipelines = new Map<string, Pipeline>();

  // ─── Module Registration ───

  register(module: AnalysisModule, config?: ModuleConfig): void {
    const { metadata } = module;

    if (this.modules.has(metadata.id)) {
      console.warn(`Module "${metadata.id}" already registered, replacing.`);
    }

    this.modules.set(metadata.id, {
      metadata,
      status: "inactive",
      config: config || {},
    });

    this.implementations.set(metadata.id, module);
    console.log(`[Registry] Registered module: ${metadata.name} v${metadata.version}`);
  }

  unregister(moduleId: string): boolean {
    const removed = this.modules.delete(moduleId);
    this.implementations.delete(moduleId);
    return removed;
  }

  // ─── Module Activation ───

  async activate(moduleId: string): Promise<{ success: boolean; error?: string }> {
    const instance = this.modules.get(moduleId);
    const impl = this.implementations.get(moduleId);

    if (!instance || !impl) {
      return { success: false, error: `Module "${moduleId}" not found` };
    }

    instance.status = "loading";

    try {
      const validation = await impl.validate();
      if (!validation.valid) {
        instance.status = "error";
        instance.error = validation.errors.join("; ");
        return { success: false, error: instance.error };
      }

      instance.status = "active";
      instance.error = undefined;
      return { success: true };
    } catch (e: any) {
      instance.status = "error";
      instance.error = e.message;
      return { success: false, error: e.message };
    }
  }

  deactivate(moduleId: string): void {
    const instance = this.modules.get(moduleId);
    if (instance) {
      instance.status = "inactive";
    }
  }

  // ─── Module Execution ───

  async execute<TInput, TOutput>(
    moduleId: string,
    input: TInput
  ): Promise<TOutput> {
    const instance = this.modules.get(moduleId);
    const impl = this.implementations.get(moduleId);

    if (!instance || !impl) {
      throw new Error(`Module "${moduleId}" not found`);
    }

    if (instance.status !== "active") {
      // Auto-activate if not active
      const activation = await this.activate(moduleId);
      if (!activation.success) {
        throw new Error(`Cannot activate module: ${activation.error}`);
      }
    }

    instance.lastRun = new Date().toISOString();
    return impl.execute(input) as Promise<TOutput>;
  }

  // ─── Pipeline Execution ───

  registerPipeline(pipeline: Pipeline): void {
    this.pipelines.set(pipeline.id, pipeline);
  }

  async executePipeline(pipelineId: string, initialInput: any): Promise<any> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error(`Pipeline "${pipelineId}" not found`);

    let currentOutput = initialInput;

    for (const step of pipeline.steps) {
      if (step.condition && !step.condition(currentOutput)) {
        continue; // Skip step if condition not met
      }

      currentOutput = await this.execute(step.moduleId, {
        ...currentOutput,
        ...(step.config || {}),
      });
    }

    return currentOutput;
  }

  // ─── Queries ───

  getModule(moduleId: string): ModuleInstance | undefined {
    return this.modules.get(moduleId);
  }

  getImplementation(moduleId: string): AnalysisModule | undefined {
    return this.implementations.get(moduleId);
  }

  listModules(category?: ModuleCategory): ModuleInstance[] {
    const all = Array.from(this.modules.values());
    if (category) {
      return all.filter((m) => m.metadata.category === category);
    }
    return all;
  }

  listActive(): ModuleInstance[] {
    return Array.from(this.modules.values()).filter(
      (m) => m.status === "active"
    );
  }

  getStatus(): {
    total: number;
    active: number;
    inactive: number;
    error: number;
    modules: ModuleInstance[];
  } {
    const modules = Array.from(this.modules.values());
    return {
      total: modules.length,
      active: modules.filter((m) => m.status === "active").length,
      inactive: modules.filter((m) => m.status === "inactive").length,
      error: modules.filter((m) => m.status === "error").length,
      modules,
    };
  }
}

// Singleton instance
export const registry = new ModuleRegistry();
export default registry;
