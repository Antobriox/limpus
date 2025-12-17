// src/components/Topbar.tsx
"use client";

import { supabase } from "../lib/supabaseClient";
import { useUser } from "../hooks/useUser";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const { user, roles } = useUser();
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <div>
        <p className="text-sm text-gray-500">
          Bienvenido
        </p>
        <p className="font-semibold">
          {user?.email} ({roles[0] ?? "sin rol"})
        </p>
      </div>

      <button
        onClick={logout}
        className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
      >
        Cerrar sesión
      </button>
    </header>
  );
}
