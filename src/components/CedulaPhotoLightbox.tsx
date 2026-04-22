"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getCedulaPhotoDisplayUrl } from "../lib/openCedulaPhoto";

type CedulaPhotoLightboxProps = {
  isOpen: boolean;
  /** Valor guardado en BD (URL pública de Supabase o ruta en el bucket) */
  storedUrl: string | null;
  onClose: () => void;
};

/**
 * Muestra la foto de la cédula en un overlay en la misma página (sin abrir otra pestaña).
 */
export default function CedulaPhotoLightbox({
  isOpen,
  storedUrl,
  onClose,
}: CedulaPhotoLightboxProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !storedUrl?.trim()) {
      setDisplayUrl(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDisplayUrl(null);

    getCedulaPhotoDisplayUrl(storedUrl)
      .then((url) => {
        if (!cancelled) setDisplayUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la imagen.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, storedUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Vista de foto de cédula"
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-4xl max-h-[90vh] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-700 shadow-2xl flex flex-col"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-900/95">
              <span className="text-sm font-medium text-neutral-200 truncate pr-2">
                Foto de cédula
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 p-2 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-[200px] max-h-[calc(90vh-56px)] overflow-auto flex items-center justify-center p-4 bg-neutral-950">
              {loading && (
                <p className="text-neutral-400 text-sm py-12">Cargando imagen…</p>
              )}
              {!loading && error && (
                <p className="text-red-400 text-sm text-center py-12 px-4">{error}</p>
              )}
              {!loading && !error && displayUrl && (
                <img
                  src={displayUrl}
                  alt="Documento de identificación"
                  className="max-w-full max-h-[min(80vh,800px)] w-auto h-auto object-contain rounded-md"
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
