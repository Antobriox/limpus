"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../hooks/useUser";

export default function HomePage() {
  const { user, roles, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // 🔥 AQUÍ SE DECIDE TODO
    if (roles.includes("administrador")) {
      router.replace("/dashboard/admin");
    } else if (roles.includes("lider_equipo")) {
      router.replace("/dashboard/leader");
    } else if (roles.includes("arbitro")) {
      router.replace("/dashboard/referee");
    } else {
      router.replace("/dashboard");
    }
  }, [loading, user, roles, router]);

  // Mostrar un componente de carga mientras se verifica la autenticación
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    </div>
  );
}
