"use client";

import { useEffect } from "react";
import { useTheme } from "../hooks/useTheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, mounted } = useTheme();

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme, mounted]);

  return <>{children}</>;
}
