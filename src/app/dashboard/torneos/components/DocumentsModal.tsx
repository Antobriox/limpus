// Componente modal para gestionar documentos
"use client";

import { useEffect } from "react";
import { Upload, RefreshCw, Trash2 } from "lucide-react";
import { Tournament } from "../types";
import { useDocuments } from "../hooks/useDocuments";

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
}

export default function DocumentsModal({
  isOpen,
  onClose,
  tournament,
}: DocumentsModalProps) {
  const { uploading, uploadedFiles, loadDocuments, uploadFile, updateFile, deleteFile } = useDocuments(tournament);

  useEffect(() => {
    if (isOpen && tournament) {
      loadDocuments();
    }
  }, [isOpen, tournament]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    e.target.value = "";
  };

  const handleUpdateFile = async (filePath: string, fileName: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await updateFile(filePath, file);
      }
    };
    input.click();
  };

  const handleDeleteFile = async (filePath: string, fileName: string) => {
    await deleteFile(filePath, fileName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Documentos del Torneo
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subir PDF
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
                disabled={uploading}
              />
              <label
                htmlFor="pdf-upload"
                className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Upload className="w-5 h-5" />
                {uploading ? "Subiendo..." : "Seleccionar PDF"}
              </label>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Solo archivos PDF
              </p>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Archivos subidos
                </h3>
                <button
                  onClick={loadDocuments}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  disabled={uploading}
                >
                  <RefreshCw className={`w-4 h-4 ${uploading ? "animate-spin" : ""}`} />
                  Actualizar
                </button>
              </div>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <svg
                        className="w-5 h-5 text-red-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-900 dark:text-white truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        Ver
                      </a>
                      <button
                        onClick={() => handleUpdateFile(file.path, file.name)}
                        disabled={uploading}
                        className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 text-sm px-2 py-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Actualizar archivo"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.path, file.name)}
                        disabled={uploading}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar archivo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

