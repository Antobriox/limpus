"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const { user } = useUser();
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [parent] = useAutoAnimate();

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

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const itemClass = (path: string) => {
    const isActive = pathname.startsWith(path);
    
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

  const navItems = [
    { href: "/dashboard/torneos", label: "Torneos", icon: Trophy },
    { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
    { href: "/dashboard/equipos", label: "Equipos", icon: UsersRound },
    { href: "/dashboard/inscripciones", label: "Inscripciones", icon: FileText },
    { href: "/dashboard/historial", label: "Historial", icon: History },
  ];

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
          const isActive = pathname.startsWith(item.href);
          
          return (
            <motion.div
              key={item.href}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Link 
                href={item.href} 
                className={itemClass(item.href)} 
                onClick={handleLinkClick}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && (
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
