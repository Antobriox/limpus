// src/app/dashboard/layout.tsx
"use client";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import { RealtimeIndicator } from "../../components/RealtimeIndicator";
import { useUser } from "../../hooks/useUser";
import { useRealtimeSubscription } from "../../hooks/useRealtimeSubscription";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, roles, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 🔥 ACTIVAR ACTUALIZACIONES EN TIEMPO REAL
  useRealtimeSubscription();

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/dashboard/viewers/clasificacion"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Derivados para redirección (siempre calculados para no cambiar orden de hooks)
  const isViewer = roles.includes("viewers") || (!roles.includes("administrador") && !roles.includes("lider_equipo") && !roles.includes("arbitro"));
  const isLeader = roles.includes("lider_equipo");
  const isArbitroOnly = roles.includes("arbitro") && !roles.includes("administrador");
  const arbitroAllowedPaths = ["/dashboard/arbitro"];
  const isArbitroAllowedPath = arbitroAllowedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    // No redirigir a login si es una ruta pública
    if (!loading && !user && !isPublicRoute) {
      router.replace("/login");
    }
  }, [user, loading, router, isPublicRoute]);

  useEffect(() => {
    if (!loading && user && isArbitroOnly && !isArbitroAllowedPath) {
      router.replace("/dashboard/arbitro");
    }
  }, [loading, user, isArbitroOnly, isArbitroAllowedPath, pathname, router]);

  // Si es una ruta pública, mostrar sin autenticación
  if (isPublicRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-white dark:bg-neutral-900">
          {children}
        </div>
      </QueryClientProvider>
    );
  }

  // Mostrar loader mientras está cargando
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
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
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  // Si es viewer, líder o árbitro (solo), mostrar su UI específica sin sidebar
  if (isViewer || isLeader || isArbitroOnly) {
    return (
      <QueryClientProvider client={queryClient}>
        <RealtimeIndicator />
        <div className="min-h-screen bg-white dark:bg-neutral-900">
          {children}
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeIndicator />
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        {/* Overlay para móviles */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed lg:static inset-y-0 left-0 z-50 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 min-h-0">
            {children}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
