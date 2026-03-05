"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/[0.06] bg-[#0a0e17]/80 backdrop-blur-sm px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          title="Выйти"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
