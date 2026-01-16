// src/app/dashboard/layout.tsx
"use client";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { useUser } from "../../hooks/useUser";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, roles, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/dashboard/viewers/clasificacion"];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // No redirigir a login si es una ruta pública
    if (!loading && !user && !isPublicRoute) {
      router.replace("/login");
    }
  }, [user, loading, router, isPublicRoute]);

  // Si es viewer, mostrar sin sidebar ni topbar (no mostrar loader innecesario)
  const isViewer = roles.includes("viewers") || (!roles.includes("administrador") && !roles.includes("lider_equipo") && !roles.includes("arbitro"));
  
  // Si es líder de equipo, también mostrar sin sidebar/topbar (tiene su propia UI)
  const isLeader = roles.includes("lider_equipo");

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

  // Solo mostrar loader si está cargando Y no es viewer ni líder (para evitar flash innecesario)
  if (loading && !isViewer && !isLeader) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-neutral-900 text-gray-900 dark:text-white">
        Cargando dashboard...
      </div>
    );
  }

  if (isViewer || isLeader) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-white dark:bg-neutral-900">
          {children}
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gray-50 dark:bg-neutral-950">
        {/* Overlay para móviles */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
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
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-950 min-h-0">
            {children}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
