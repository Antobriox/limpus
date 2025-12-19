"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const itemClass = (path: string) =>
    `block px-4 py-2 rounded-md ${
      pathname.startsWith(path)
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <aside className="w-64 bg-white border-r h-screen p-4">
      <div className="mb-6 flex items-center gap-2 font-bold text-lg">
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
