"use client";

import React from "react";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition rounded-t-lg ${
        active
          ? "text-blue-400 border-b-2 border-blue-400 -mb-px"
          : "text-[var(--text-muted)] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
