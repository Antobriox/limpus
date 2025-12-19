"use client";

import { ReactNode } from "react";

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
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg">
          {icon}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              {subtitle}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>

      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                progressColor === "orange"
                  ? "bg-orange-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
