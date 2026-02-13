"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../hooks/useUser";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { user, roles, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // PRIORIDAD: arbitro -> líder -> admin -> general por defecto
    if (roles.includes("arbitro")) {
      router.replace("/dashboard/general");
    } else if (roles.includes("lider_equipo")) {
      router.replace("/dashboard/leader");
    } else if (roles.includes("administrador")) {
      router.replace("/dashboard/admin");
    } else {
      router.replace("/dashboard/general");
    }
  }, [loading, user, roles, router]);

  // 👇 IMPORTANTE: componente válido
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full mx-auto mb-4"
        />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando dashboard...</p>
      </motion.div>
    </div>
  );
}
