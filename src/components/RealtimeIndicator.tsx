"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi } from "lucide-react";

/**
 * Indicador visual de conexión en tiempo real
 * Muestra un pequeño icono cuando hay actualizaciones
 */
export function RealtimeIndicator() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    // Escuchar eventos personalizados de actualización
    const handleRealtimeUpdate = () => {
      setShowUpdate(true);
      setTimeout(() => setShowUpdate(false), 2000);
    };

    window.addEventListener("realtime-update", handleRealtimeUpdate);

    return () => {
      window.removeEventListener("realtime-update", handleRealtimeUpdate);
    };
  }, []);

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-green-500 dark:bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Wifi className="w-4 h-4" />
          </motion.div>
          <span className="text-sm font-medium">Actualizado</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
