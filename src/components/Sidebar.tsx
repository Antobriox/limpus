"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../hooks/useUser";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    };

    loadProfile();
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const itemClass = (path: string) =>
    `block px-4 py-2 rounded-md transition-colors ${
      pathname.startsWith(path)
        ? "bg-blue-600 text-white"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
    }`;

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";
  const initials = profile?.full_name ? getInitials(profile.full_name) : (user?.email?.[0]?.toUpperCase() || "U");

  return (
    <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-gray-700 h-screen p-4 flex flex-col">
      <div className="mb-6 flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
        <Trophy className="w-6 h-6" /> Olimpiadas U
      </div>

      <nav className="space-y-1 flex-1">
        <Link href="/dashboard" className={itemClass("/dashboard")}>
          Dashboard
        </Link>

        <Link href="/dashboard/usuarios" className={itemClass("/dashboard/usuarios")}>
          Usuarios
        </Link>

        <Link href="/dashboard/torneos" className={itemClass("/dashboard/torneos")}>
          Torneos
        </Link>

        <Link
          href="/dashboard/inscripciones"
          className={itemClass("/dashboard/inscripciones")}
        >
          Inscripciones
        </Link>
      </nav>

      {/* User Profile Section */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex gap-3 items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-gray-900 dark:text-white text-base font-medium leading-normal truncate">
              {displayName}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">
              Administrator
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
