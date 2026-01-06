// Componente modal para generar brackets
"use client";

import { useEffect } from "react";
import { Tournament, Team } from "../types";
import { useBrackets } from "../hooks/useBrackets";

interface BracketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
  onSuccess?: () => void;
}

export default function BracketsModal({
  isOpen,
  onClose,
  tournament,
  onSuccess,
}: BracketsModalProps) {
  const {
    allTeams,
    bombos,
    generating,
    loadTeams,
    generateBombos,
    saveBrackets,
    setBombos,
  } = useBrackets(tournament);

  useEffect(() => {
    if (isOpen && tournament) {
      loadTeams();
    }
  }, [isOpen, tournament]);

  const handleClose = () => {
    setBombos([]);
    onClose();
  };

  const handleSave = async () => {
    await saveBrackets(() => {
      handleClose();
      if (onSuccess) onSuccess();
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Generar Brackets - Fases de Grupo
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Equipos disponibles:</strong> {allTeams.length}
            </p>
            {bombos.length > 0 && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <strong>Bombos generados:</strong> {bombos.length}
              </p>
            )}
          </div>

          {bombos.length === 0 && (
            <div className="mb-6 text-center">
              <button
                onClick={generateBombos}
                disabled={allTeams.length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Generar Brackets
              </button>
            </div>
          )}

          {bombos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Fases de Grupo (Bombos)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {bombos.map((bombo, bomboIndex) => (
                  <div
                    key={bomboIndex}
                    className="border border-gray-200 dark:border-neutral-800 rounded-lg p-4 bg-gray-50 dark:bg-neutral-800"
                  >
                    <div className="mb-3 pb-2 border-b border-gray-300 dark:border-neutral-700">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                        Bombo {bomboIndex + 1}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {bombo.length} {bombo.length === 1 ? "equipo" : "equipos"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {bombo.map((team, teamIndex) => (
                        <div
                          key={team.id}
                          className="p-2 bg-white dark:bg-neutral-900 rounded border border-gray-200 dark:border-neutral-700"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {team.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
            {bombos.length > 0 && (
              <button
                onClick={generateBombos}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Regenerar
              </button>
            )}
            {bombos.length > 0 && (
              <button
                onClick={handleSave}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? "Guardando..." : "Guardar Brackets"}
              </button>
            )}
            <button
              onClick={handleClose}
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

