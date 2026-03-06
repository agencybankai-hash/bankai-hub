import { queryMany } from "@/lib/db";
import { Header } from "@/components/layout";
import { Card, CardContent, Badge } from "@/components/ui";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const members = await queryMany(
    `SELECT id, name, email, role, created_at
     FROM hub_users ORDER BY created_at ASC`
  );

  return (
    <>
      <Header
        title="Команда"
        subtitle={`${members.length} участников`}
      />

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m: any) => (
            <Card key={m.id}>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DC2626]/10">
                    <User size={18} className="text-[#DC2626]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {m.name || "Без имени"}
                    </p>
                    <Badge variant={m.role === "admin" ? "info" : "default"}>
                      {m.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {members.length === 0 && (
            <Card className="col-span-full">
              <CardContent>
                <div className="text-center py-8">
                  <User size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Пока нет участников.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
