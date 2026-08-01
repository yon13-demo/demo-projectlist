"use client";

import { Moon, Sun, QrCode, Menu } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardHeaderProps {
  userName: string;
  onOpenScanner: () => void;
  onToggleSidebar?: () => void;
}

export default function DashboardHeader({
  userName,
  onOpenScanner,
  onToggleSidebar,
}: DashboardHeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored ? stored === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-2 text-text-muted hover:bg-surface-2 md:hidden"
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="font-display text-lg leading-none tracking-tight">Site Ledger</p>
          <p className="text-xs text-text-muted">Welcome back, {userName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-ink transition-transform active:scale-95"
        >
          <QrCode size={16} />
          <span className="hidden sm:inline">Scan to clock in</span>
          <span className="sm:hidden">Scan</span>
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-md border border-border p-2 text-text-muted hover:bg-surface-2"
          aria-label="Toggle color theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
