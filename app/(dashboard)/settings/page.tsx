"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Header title="Настройки" subtitle="Профиль и настройки платформы" />

      <div className="p-6 max-w-lg space-y-6">
        <Card>
          <CardContent>
            <h3 className="text-sm font-medium text-slate-300 mb-4">Профиль</h3>
            <div className="space-y-4">
              <Input
                id="name"
                label="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
              />
              <div className="flex items-center gap-3">
                <Button onClick={handleSave} loading={saving} size="sm">
                  <Save size={14} /> Сохранить
                </Button>
                {saved && <span className="text-xs text-emerald-400">Сохранено!</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
