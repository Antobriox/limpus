// src/components/Topbar.tsx
"use client";

import { supabase } from "../lib/supabaseClient";
import { useUser } from "../hooks/useUser";
import { useRouter } from "next/navigation";
import { useTheme } from "../hooks/useTheme";
import { Sun, Moon } from "lucide-react";

export default function Topbar() {
  const { user, roles } = useUser();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="h-16 bg-white dark:bg-neutral-900 border-b dark:border-neutral-800 flex items-center justify-between px-6">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Bienvenido
        </p>
        <p className="font-semibold text-gray-900 dark:text-white">
          {user?.email} ({roles[0] ?? "sin rol"})
        </p>
      </div>

      <div className="flex items-center gap-4">
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

        <button
          onClick={logout}
          className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
