"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { Toaster } from "sonner";

export function QueryClientProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: "bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700",
            title: "text-gray-900 dark:text-white",
            description: "text-gray-600 dark:text-gray-400",
            success: "border-green-500/50",
            error: "border-red-500/50",
            warning: "border-yellow-500/50",
            info: "border-blue-500/50",
          },
        }}
      />
    </QueryClientProvider>
  );
}
