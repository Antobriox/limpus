// src/app/dashboard/layout.tsx
"use client";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { useUser } from "../../hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-neutral-900 text-gray-900 dark:text-white">
        Cargando dashboard...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-950">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-950 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
