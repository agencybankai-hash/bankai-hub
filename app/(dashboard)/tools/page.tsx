import { Header } from "@/components/layout";
import { Card, CardContent, Badge } from "@/components/ui";
import { toolRegistry } from "@/lib/tools/registry";
import { ArrowRight, Lock } from "lucide-react";

export default function ToolsCatalogPage() {
  return (
    <>
      <Header
        title="Инструменты"
        subtitle="Каталог всех инструментов платформы"
      />

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolRegistry.map((tool) => {
            const isActive = tool.status === "active";
            return (
              <Card key={tool.slug} className={!isActive ? "opacity-50" : ""}>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isActive ? "bg-[#DC2626]/10" : "bg-white/5"
                      }`}
                    >
                      <tool.icon
                        size={20}
                        className={isActive ? "text-[#DC2626]" : "text-slate-500"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-200">
                          {tool.name}
                        </p>
                        <Badge
                          variant={
                            isActive
                              ? "success"
                              : tool.status === "beta"
                              ? "info"
                              : "default"
                          }
                        >
                          {isActive
                            ? "Активен"
                            : tool.status === "beta"
                            ? "Бета"
                            : "Скоро"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  {!isActive && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-slate-600">
                      <Lock size={12} />
                      <span>В разработке</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
