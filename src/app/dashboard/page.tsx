"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../hooks/useUser";

export default function DashboardPage() {
  const { user, roles, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Redirigir según el rol del usuario
    if (roles.includes("administrador")) {
      router.replace("/dashboard/admin");
    } else if (roles.includes("lider_equipo")) {
      router.replace("/dashboard/leader");
    } else if (roles.includes("arbitro")) {
      router.replace("/dashboard/referee");
    } else {
      router.replace("/dashboard/admin"); // Por defecto mostrar admin dashboard
    }
  }, [loading, user, roles, router]);

  return (
    <div className="flex justify-center items-center h-64 text-gray-400 dark:text-gray-500">
      Cargando dashboard...
    </div>
  );
}
