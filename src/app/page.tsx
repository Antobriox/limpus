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

  return null;
}
