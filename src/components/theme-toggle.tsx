"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      title={collapsed ? (theme === "light" ? "Modo oscuro" : "Modo claro") : undefined}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 active:bg-slate-700 transition-all duration-200 w-full"
    >
      {theme === "light" ? (
        <Moon className="h-[18px] w-[18px] shrink-0" />
      ) : (
        <Sun className="h-[18px] w-[18px] shrink-0" />
      )}
      {!collapsed && (
        <span>{theme === "light" ? "Modo oscuro" : "Modo claro"}</span>
      )}
    </button>
  );
}
