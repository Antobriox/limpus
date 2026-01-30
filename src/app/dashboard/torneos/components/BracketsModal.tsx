// Componente modal para generar brackets
"use client";

import { useEffect } from "react";
import { Tournament } from "../types";
import { useBrackets } from "../hooks/useBrackets";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../../../lib/utils";

interface BracketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
  sportId?: number | null;
  onSuccess?: () => void;
}

export default function BracketsModal({
  isOpen,
  onClose,
  tournament,
  sportId = null,
  onSuccess,
}: BracketsModalProps) {
  const {
    allTeams,
    selectedTeams,
    bombos,
    generating,
    loadTeams,
    generateBombos,
    saveBrackets,
    setBombos,
    toggleTeamSelection,
    selectAllTeams,
    deselectAllTeams,
  } = useBrackets(tournament, sportId);

  useEffect(() => {
    if (isOpen) {
      loadTeams();
    }
  }, [isOpen, loadTeams]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-2 sm:my-4 mx-2 sm:mx-0 pointer-events-auto border border-gray-200 dark:border-neutral-700">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent pr-2">
                    Generar Brackets - Fases de Grupo
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </motion.button>
                </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-xl shadow-sm"
          >
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Equipos disponibles:</strong> {allTeams.length}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              <strong>Equipos seleccionados:</strong> {selectedTeams.size}
            </p>
            {bombos.length > 0 && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <strong>Bombos generados:</strong> {bombos.length}
              </p>
            )}
          </motion.div>

          {bombos.length === 0 && allTeams.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Seleccionar Equipos
                </h3>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={selectAllTeams}
                    className="px-3 py-1.5 text-sm border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    Todos
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={deselectAllTeams}
                    className="px-3 py-1.5 text-sm border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    Ninguno
                  </motion.button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto mb-4">
                <div className="grid grid-cols-2 gap-2">
                  {allTeams.map((team, index) => (
                    <motion.label
                      key={team.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center p-2 border-2 border-gray-200 dark:border-neutral-700 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm hover:shadow-md"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeams.has(team.id)}
                        onChange={() => toggleTeamSelection(team.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                        {team.name}
                      </span>
                    </motion.label>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: selectedTeams.size === 0 ? 1 : 1.05 }}
                  whileTap={{ scale: selectedTeams.size === 0 ? 1 : 0.95 }}
                  onClick={generateBombos}
                  disabled={selectedTeams.size === 0}
                  className={cn(
                    "px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl",
                    selectedTeams.size === 0 && "cursor-not-allowed"
                  )}
                >
                  Generar Brackets
                </motion.button>
              </div>
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
                    className="border border-gray-200 dark:border-neutral-800 rounded-lg p-4 bg-gray-50 dark:bg-neutral-800 min-h-[200px]"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add("bg-blue-50", "dark:bg-blue-950/20");
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove("bg-blue-50", "dark:bg-blue-950/20");
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove("bg-blue-50", "dark:bg-blue-950/20");
                      
                      const draggedTeamId = parseInt(e.dataTransfer.getData("teamId"));
                      const sourceBomboIndex = parseInt(e.dataTransfer.getData("sourceBomboIndex"));
                      
                      if (sourceBomboIndex === bomboIndex) return; // No hacer nada si se suelta en el mismo bombo
                      
                      // Encontrar el equipo en el bombo origen
                      const sourceBombo = bombos[sourceBomboIndex];
                      const team = sourceBombo.find(t => t.id === draggedTeamId);
                      
                      if (!team) return;
                      
                      // Crear nuevos bombos actualizados
                      const newBombos = [...bombos];
                      
                      // Remover el equipo del bombo origen
                      newBombos[sourceBomboIndex] = sourceBombo.filter(t => t.id !== draggedTeamId);
                      
                      // Agregar el equipo al bombo destino
                      newBombos[bomboIndex] = [...newBombos[bomboIndex], team];
                      
                      // Actualizar el estado
                      setBombos(newBombos);
                    }}
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
                      {bombo.map((team) => (
                        <div
                          key={team.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("teamId", team.id.toString());
                            e.dataTransfer.setData("sourceBomboIndex", bomboIndex.toString());
                            e.currentTarget.style.opacity = "0.5";
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = "1";
                          }}
                          className="p-2 bg-white dark:bg-neutral-900 rounded border border-gray-200 dark:border-neutral-700 cursor-move hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {team.name}
                          </p>
                        </div>
                      ))}
                      {bombo.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded">
                          Arrastra equipos aquí
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
            {bombos.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateBombos}
                className="px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md font-medium"
              >
                Regenerar
              </motion.button>
            )}
            {bombos.length > 0 && (
              <motion.button
                whileHover={{ scale: generating ? 1 : 1.05 }}
                whileTap={{ scale: generating ? 1 : 0.95 }}
                onClick={handleSave}
                disabled={generating}
                className={cn(
                  "px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl",
                  generating && "cursor-not-allowed"
                )}
              >
                {generating ? "Guardando..." : "Guardar Brackets"}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md font-medium"
            >
              Cerrar
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

