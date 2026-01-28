"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  variant?: "default" | "blue";
}

export default function ActionCard({
  icon,
  title,
  description,
  onClick,
  variant = "default",
}: ActionCardProps) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full text-left border rounded-xl p-6 transition-all duration-300 cursor-pointer",
        "bg-white dark:bg-neutral-900 group relative overflow-hidden",
        "hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20",
        variant === "blue"
          ? "border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600"
          : "border-gray-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500"
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 rounded-xl" />
      
      <div className="relative z-10 flex items-start gap-4">
        <motion.div
          whileHover={{ rotate: 5, scale: 1.1 }}
          className={cn(
            "p-3 rounded-xl transition-all duration-300",
            "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-700",
            "group-hover:from-blue-100 group-hover:to-blue-50 dark:group-hover:from-blue-900/50 dark:group-hover:to-blue-800/50",
            "[&>svg]:transition-colors [&>svg]:text-gray-600 dark:[&>svg]:text-gray-400",
            "[&>svg]:group-hover:text-blue-600 [&>svg]:dark:group-hover:text-blue-400"
          )}
        >
          {icon}
        </motion.div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
