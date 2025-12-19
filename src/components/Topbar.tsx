"use client";

import { useTheme } from "../hooks/useTheme";
import { Sun, Moon } from "lucide-react";

export default function Topbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end px-6">
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
