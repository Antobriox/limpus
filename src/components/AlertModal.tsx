"use client";

import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

interface AlertModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  variant?: "success" | "error" | "warning" | "info";
}

export default function AlertModal({
  isOpen,
  title,
  message,
  buttonText = "Aceptar",
  onClose,
  variant = "info",
}: AlertModalProps) {

  const variantConfig = {
    success: {
      icon: CheckCircle,
      iconColor: "text-green-600 dark:text-green-400",
      buttonColor: "bg-green-600 hover:bg-green-700 text-white",
      defaultTitle: "Éxito",
    },
    error: {
      icon: XCircle,
      iconColor: "text-red-600 dark:text-red-400",
      buttonColor: "bg-red-600 hover:bg-red-700 text-white",
      defaultTitle: "Error",
    },
    warning: {
      icon: AlertCircle,
      iconColor: "text-yellow-600 dark:text-yellow-400",
      buttonColor: "bg-yellow-600 hover:bg-yellow-700 text-white",
      defaultTitle: "Advertencia",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-600 dark:text-blue-400",
      buttonColor: "bg-blue-600 hover:bg-blue-700 text-white",
      defaultTitle: "Información",
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-0 pointer-events-auto border border-gray-200 dark:border-neutral-700 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className={cn(
                      "p-3 rounded-xl flex-shrink-0",
                      variant === "success" && "bg-green-100 dark:bg-green-900/30",
                      variant === "error" && "bg-red-100 dark:bg-red-900/30",
                      variant === "warning" && "bg-yellow-100 dark:bg-yellow-900/30",
                      variant === "info" && "bg-blue-100 dark:bg-blue-900/30"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", config.iconColor)} />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {displayTitle}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line break-words leading-relaxed">
                      {message}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </div>

                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className={cn(
                      "px-4 py-2.5 rounded-lg transition-all text-sm sm:text-base font-semibold shadow-md hover:shadow-lg cursor-pointer",
                      config.buttonColor
                    )}
                  >
                    {buttonText}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
