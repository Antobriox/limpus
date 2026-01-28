"use client";

import { X, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = "warning",
}: ConfirmModalProps) {

  const variantStyles = {
    danger: {
      button: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white",
      icon: "text-red-600",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      Icon: AlertCircle,
    },
    warning: {
      button: "bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white",
      icon: "text-yellow-600",
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      Icon: AlertTriangle,
    },
    info: {
      button: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white",
      icon: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      Icon: Info,
    },
  };

  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1 pr-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      className={cn("p-3 rounded-xl flex-shrink-0", styles.iconBg)}
                    >
                      <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", styles.icon)} />
                    </motion.div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white pt-1">
                      {title}
                    </h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </div>

                <div className="mb-4 sm:mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line break-words leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCancel}
                    className="px-4 py-2.5 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all text-sm sm:text-base font-semibold shadow-sm hover:shadow-md cursor-pointer"
                  >
                    {cancelText}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onConfirm}
                    className={cn(
                      "px-4 py-2.5 rounded-lg transition-all text-sm sm:text-base font-semibold shadow-md hover:shadow-lg cursor-pointer",
                      styles.button
                    )}
                  >
                    {confirmText}
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
