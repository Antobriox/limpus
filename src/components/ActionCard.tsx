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
      className="w-full text-left border border-gray-200 dark:border-neutral-800 rounded-lg p-6 transition-all hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-neutral-900 group"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-neutral-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors [&>svg]:transition-colors [&>svg]:group-hover:text-blue-600 [&>svg]:dark:group-hover:text-blue-400">
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
