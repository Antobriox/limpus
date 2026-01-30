"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Trophy, X, Users, UsersRound, FileText, History, LogOut } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../hooks/useUser";
import { motion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "../lib/utils";

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editionParam = searchParams.get("edition");
  const { user } = useUser();
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [parent] = useAutoAnimate();

  const isViewingHistorial = editionParam != null && editionParam !== "";

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

  const logout = () => {
    // Ocultar INMEDIATAMENTE todo el contenido
    document.body.style.opacity = "0";
    document.body.style.pointerEvents = "none";
    
    // Mostrar loader
    const loader = document.createElement("div");
    loader.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgb(239 246 255) 0%, rgb(255 255 255) 50%, rgb(239 246 255) 100%);
    `;
    loader.innerHTML = `
      <div style="text-align: center;">
        <div style="
          width: 48px;
          height: 48px;
          border: 4px solid rgb(191 219 254);
          border-top-color: rgb(37 99 235);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        "></div>
        <p style="color: rgb(75 85 99); font-weight: 500;">Cerrando sesión...</p>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-color-scheme: dark) {
          div:first-child {
            background: linear-gradient(135deg, rgb(10 10 10) 0%, rgb(23 23 23) 50%, rgb(10 10 10) 100%) !important;
          }
          p { color: rgb(156 163 175) !important; }
          div > div:first-child {
            border-color: rgb(30 58 138) !important;
            border-top-color: rgb(96 165 250) !important;
          }
        }
      </style>
    `;
    document.body.appendChild(loader);
    
    // Cerrar sesión y redirigir
    supabase.auth.signOut().finally(() => {
      window.location.replace("/");
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const itemClass = (pathForActive: string, isActive: boolean) => {
    return cn(
      "relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm",
      "group overflow-hidden",
      isActive
        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400"
    );
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";
  const initials = profile?.full_name ? getInitials(profile.full_name) : (user?.email?.[0]?.toUpperCase() || "U");

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  // Enlaces del sidebar SIEMPRE al torneo actual (sin ?edition=).
  // Si estás viendo historial (?edition=X), al hacer clic en Torneos/Equipos/Inscripciones/Usuarios
  // navegamos a la ruta limpia para forzar vista del torneo actual.
  const navItems = [
    { href: "/dashboard/torneos", label: "Torneos", icon: Trophy },
    { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
    { href: "/dashboard/equipos", label: "Equipos", icon: UsersRound },
    { href: "/dashboard/inscripciones", label: "Inscripciones", icon: FileText },
    { href: "/dashboard/historial", label: "Historial", icon: History },
  ].map((item) => {
    const isTorneoActualSection = ["/dashboard/torneos", "/dashboard/usuarios", "/dashboard/equipos", "/dashboard/inscripciones"].includes(item.href);
    const isActive =
      pathname.startsWith(item.href) &&
      (!isViewingHistorial || !isTorneoActualSection);
    return { ...item, href: item.href, isActive, isTorneoActualSection };
  });

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isTorneoActualSection: boolean) => {
    handleLinkClick();
    if (isViewingHistorial && isTorneoActualSection) {
      e.preventDefault();
      router.push(href);
    }
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 sm:w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-gray-700 h-screen p-4 flex flex-col shadow-lg"
    >
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </motion.div>
          <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            Olimpiadas U
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400 transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>

      <nav className="space-y-2 flex-1" ref={parent}>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Link 
                href={item.href} 
                className={itemClass(item.href, item.isActive)} 
                onClick={(e) => handleNavClick(e, item.href, item.isTorneoActualSection ?? false)}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {item.isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-4"
      >
        <div className="flex gap-3 items-center mb-4">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg"
          >
            {initials}
          </motion.div>
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-gray-900 dark:text-white text-base font-medium leading-normal truncate">
              {displayName}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">
              Administrator
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all text-sm font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </motion.button>
      </motion.div>
    </motion.aside>
  );
}
