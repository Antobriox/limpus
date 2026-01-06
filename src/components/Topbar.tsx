"use client";

import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon, Menu } from "lucide-react";

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 lg:flex-none" />

      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
        aria-label="Cambiar tema"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        ) : (
          <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        )}
      </button>
    </header>
  );
}
