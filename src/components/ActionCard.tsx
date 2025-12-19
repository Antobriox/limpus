"use client";

import { ReactNode } from "react";

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
    <button
      onClick={onClick}
      className={`w-full text-left border rounded-lg p-6 transition-all hover:shadow-md ${
        variant === "blue"
          ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
          : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-lg ${
            variant === "blue"
              ? "bg-blue-100 dark:bg-blue-900/30"
              : "bg-gray-100 dark:bg-neutral-800"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}
