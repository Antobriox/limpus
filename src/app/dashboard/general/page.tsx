"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../hooks/useUser";

export default function DashboardPage() {
  const { user, roles, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (roles.includes("administrador")) {
      router.replace("/dashboard/admin");
    } else if (roles.includes("lider_equipo")) {
      router.replace("/dashboard/leader");
    } else if (roles.includes("arbitro")) {
      router.replace("/dashboard/referee");
    } else {
      router.replace("/dashboard/general");
    }
  }, [loading, user, roles, router]);

  // 👇 IMPORTANTE: componente válido
  return (
    <div className="p-6 text-sm text-neutral-500">
      Cargando dashboard...
    </div>
  );
}
