"use client";

import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

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
  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-md w-full mx-2 sm:mx-0">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${config.iconColor}`} />
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {displayTitle}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line break-words">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 p-1"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${config.buttonColor}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
