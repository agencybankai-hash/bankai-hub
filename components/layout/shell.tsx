"use client";

import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-[#1e1f21]">
      <Sidebar />
      {/* Main content — offset by sidebar width, responsive to collapse */}
      <main className="ml-16 lg:ml-56 transition-all duration-200">
        {children}
      </main>
    </div>
  );
}
