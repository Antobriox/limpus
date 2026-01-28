"use client";

import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 shadow-sm"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </motion.button>

      <div className="flex-1 lg:flex-none" />

      <motion.button
        whileHover={{ scale: 1.05, rotate: 15 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className={cn(
          "relative p-2.5 rounded-lg transition-all duration-200 cursor-pointer",
          "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700",
          "hover:from-gray-200 hover:to-gray-300 dark:hover:from-neutral-700 dark:hover:to-neutral-600",
          "shadow-md hover:shadow-lg"
        )}
        aria-label="Cambiar tema"
      >
        <motion.div
          initial={false}
          animate={{ rotate: theme === "dark" ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-blue-600" />
          )}
        </motion.div>
      </motion.button>
    </motion.header>
  );
}
