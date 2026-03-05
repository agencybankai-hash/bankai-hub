// ═══════════════════════════════════════════════════
// Module Registry API — List & manage platform modules
// ═══════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { initializeModules, registry } from "@/lib/modules";
import { listLLMProviders } from "@/lib/providers/llm";
import { listSerpProviders } from "@/lib/providers/serp";

export async function GET() {
  initializeModules();

  const status = registry.getStatus();
  const llmProviders = listLLMProviders();
  const serpProviders = listSerpProviders();

  return NextResponse.json({
    platform: {
      name: "Bankai Hub",
      version: "2.0.0",
      architecture: "modular",
    },
    modules: status,
    providers: {
      llm: llmProviders,
      serp: serpProviders,
    },
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  initializeModules();

  try {
    const body = await req.json();
    const { action, moduleId } = body;

    switch (action) {
      case "activate": {
        const result = await registry.activate(moduleId);
        return NextResponse.json(result);
      }
      case "deactivate": {
        registry.deactivate(moduleId);
        return NextResponse.json({ success: true });
      }
      case "status": {
        const module = registry.getModule(moduleId);
        if (!module) {
          return NextResponse.json({ error: "Module not found" }, { status: 404 });
        }
        return NextResponse.json(module);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
