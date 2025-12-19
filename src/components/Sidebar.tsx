"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const itemClass = (path: string) =>
    `block px-4 py-2 rounded-md transition-colors ${
      pathname.startsWith(path)
        ? "bg-blue-600 text-white"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
    }`;

  return (
    <aside className="w-64 bg-white dark:bg-neutral-900 border-r dark:border-neutral-800 h-screen p-4">
      <div className="mb-6 flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
        <Trophy className="w-6 h-6" /> Olimpiadas U
      </div>

      <nav className="space-y-1">
        <Link href="/dashboard" className={itemClass("/dashboard")}>
          Dashboard
        </Link>

        <Link href="/dashboard/usuarios" className={itemClass("/dashboard/usuarios")}>
          Usuarios
        </Link>

        <Link href="/dashboard/torneos" className={itemClass("/dashboard/torneos")}>
          Torneos
        </Link>

        {/* 👉 NUEVO */}
        <Link
          href="/dashboard/inscripciones"
          className={itemClass("/dashboard/inscripciones")}
        >
          Inscripciones
        </Link>
      </nav>
    </aside>
  );
}
