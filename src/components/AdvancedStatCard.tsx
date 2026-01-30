"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface AdvancedStatCardProps {
  icon: ReactNode;
  value: string;
  label: string;
  subtitle?: string;
  progress?: number;
  progressColor?: "orange" | "green";
}

export default function AdvancedStatCard({
  icon,
  value,
  label,
  subtitle,
  progress,
  progressColor = "green",
}: AdvancedStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 shadow-lg transition-all duration-300 relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-700 rounded-xl">
            {icon}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <motion.p
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
            >
              {value}
            </motion.p>
            {subtitle && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-green-600 dark:text-green-400 font-semibold"
              >
                {subtitle}
              </motion.span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        </div>

        {progress !== undefined && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className={cn(
                  "h-2.5 rounded-full",
                  progressColor === "orange"
                    ? "bg-gradient-to-r from-orange-500 to-orange-600"
                    : "bg-gradient-to-r from-green-500 to-green-600"
                )}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right font-medium">
              {progress}%
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
