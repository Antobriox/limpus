// Página para generar brackets
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Network } from "lucide-react";
import { Tournament } from "../types";
import { useBrackets } from "../hooks/useBrackets";
import { supabase } from "../../../../lib/supabaseClient";
import { motion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "../../../../lib/utils";

export default function BracketsPage() {
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [selectedGenero, setSelectedGenero] = useState<string | null>(null);
  const {
    allTeams,
    selectedTeams,
    bombos,
    generating,
    savedDrawId,
    loadingSaved,
    loadTeams,
    loadSavedBrackets,
    generateBombos,
    saveBrackets,
    deleteSavedBrackets,
    setBombos,
    toggleTeamSelection,
    selectAllTeams,
    deselectAllTeams,
  } = useBrackets(tournament, selectedSport, selectedGenero);

  useEffect(() => {
    const initialize = async () => {
      await loadTournament();
      await loadSports();
    };
    initialize();
  }, []);

  useEffect(() => {
    // Cargar todos los equipos disponibles (sin importar la disciplina)
    loadTeams();
  }, [loadTeams]);

  const loadSports = async () => {
    try {
      const { data, error } = await supabase
        .from("sports")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setSports(data || []);
    } catch (err) {
      console.error("Error cargando deportes:", err);
    }
  };

  useEffect(() => {
    // Cargar brackets guardados cuando el torneo, disciplina y género estén disponibles
    if (tournament && tournament.id !== 0 && selectedSport && selectedGenero) {
      loadSavedBrackets();
    } else {
      // Si no hay género seleccionado, limpiar los brackets
      setBombos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament?.id, selectedSport, selectedGenero, loadSavedBrackets]);

  const loadTournament = async () => {
    try {
      const { data: tournaments } = await supabase
        .from("tournaments")
        .select("id, name, start_date, end_date")
        .order("id", { ascending: false })
        .limit(1);

      if (tournaments && tournaments.length > 0) {
        const t = tournaments[0];
        setTournament({
          id: t.id,
          name: t.name || "Torneo",
          start_date: t.start_date || "",
          end_date: t.end_date || "",
          location: undefined,
          status: "EN CURSO",
        });
      } else {
        setTournament({
          id: 0,
          name: "Sin torneo activo",
          start_date: "",
          end_date: "",
          location: undefined,
          status: "SIN INICIAR",
        });
      }
    } catch (error) {
      console.error("Error cargando torneo:", error);
    }
  };

  const handleSave = async () => {
    await saveBrackets(async () => {
      // Recargar los brackets guardados después de guardar
      if (tournament && tournament.id !== 0) {
        await loadSavedBrackets();
      }
    });
  };


  const [listRef] = useAutoAnimate();

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6"
      >
        <motion.button
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition font-medium cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </motion.button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
              Generar Brackets
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Crear llaves de eliminación automática - Fases de Grupo (Bombos)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Selector de disciplina y género */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Disciplina (para identificar los brackets guardados)
            </label>
            <select
              value={selectedSport ?? ""}
              onChange={(e) => {
                const sportId = e.target.value ? parseInt(e.target.value) : null;
                setSelectedSport(sportId);
                setBombos([]); // Limpiar brackets al cambiar disciplina
                setSelectedGenero(null); // Limpiar género al cambiar disciplina
                // Los brackets guardados se cargarán automáticamente en el useEffect
              }}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            >
              <option value="">Seleccionar disciplina...</option>
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Género <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedGenero ?? ""}
              onChange={(e) => {
                const genero = e.target.value || null;
                setSelectedGenero(genero);
                setBombos([]); // Limpiar brackets al cambiar género
              }}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            >
              <option value="">Seleccionar género...</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Nota: Los brackets se generan con los equipos que selecciones manualmente, filtrados por género.
        </p>
      </motion.div>

      {/* Información del torneo */}
      {tournament && selectedSport && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-xl shadow-sm"
        >
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Torneo:</strong> {tournament.name}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            <strong>Disciplina:</strong> {sports.find(s => s.id === selectedSport)?.name || "N/A"}
          </p>
          {selectedGenero && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              <strong>Género:</strong> {selectedGenero === "masculino" ? "Masculino" : "Femenino"}
            </p>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            <strong>Equipos disponibles:</strong> {allTeams.length}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            <strong>Equipos seleccionados:</strong> {selectedTeams.size}
          </p>
          {loadingSaved && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              Cargando brackets guardados...
            </p>
          )}
          {!loadingSaved && bombos.length > 0 && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              <strong>Bombos {savedDrawId ? "guardados" : "generados"}:</strong> {bombos.length}
              {savedDrawId && (
                <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                  ✓ Guardado
                </span>
              )}
            </p>
          )}
        </motion.div>
      )}

      {/* Selección de equipos */}
      {!loadingSaved && bombos.length === 0 && selectedSport && allTeams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Seleccionar Equipos para los Brackets
            </h3>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={selectAllTeams}
                className="px-3 py-1.5 text-sm border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md font-medium cursor-pointer"
              >
                Seleccionar Todos
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={deselectAllTeams}
                className="px-3 py-1.5 text-sm border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md font-medium cursor-pointer"
              >
                Deseleccionar Todos
              </motion.button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" ref={listRef}>
              {allTeams.map((team, index) => (
                <motion.label
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center p-3 border-2 border-gray-200 dark:border-neutral-700 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                >
                  <input
                    type="checkbox"
                    checked={selectedTeams.has(team.id)}
                    onChange={() => toggleTeamSelection(team.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                  />
                  <span className="ml-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {team.name}
                  </span>
                </motion.label>
              ))}
            </div>
          </div>
          <div className="mt-4 text-center">
            <motion.button
              whileHover={{ scale: selectedTeams.size === 0 || !selectedGenero ? 1 : 1.05 }}
              whileTap={{ scale: selectedTeams.size === 0 || !selectedGenero ? 1 : 0.95 }}
              onClick={() => generateBombos()}
              disabled={selectedTeams.size === 0 || !selectedGenero}
              className={cn(
                "px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl cursor-pointer",
                (selectedTeams.size === 0 || !selectedGenero) && "cursor-not-allowed"
              )}
            >
              <Network className="w-5 h-5" />
              Generar Brackets
            </motion.button>
            {!selectedGenero && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Debes seleccionar un género para generar los brackets
              </p>
            )}
            {selectedGenero && selectedTeams.size === 0 && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selecciona al menos un equipo para generar los brackets
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Mensaje de carga */}
      {loadingSaved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block w-8 h-8 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full"
          />
          <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">Cargando brackets guardados...</p>
        </motion.div>
      )}

      {/* Bombos generados */}
      {!loadingSaved && bombos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fases de Grupo (Bombos)
            </h3>
            {savedDrawId && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold shadow-sm"
              >
                ✓ Brackets Guardados
              </motion.span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" ref={listRef}>
            {bombos.map((bombo, bomboIndex) => (
              <motion.div
                key={bomboIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + bomboIndex * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`border-2 border-gray-200 dark:border-neutral-800 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-700 min-h-[200px] shadow-lg hover:shadow-xl transition-all ${savedDrawId ? '' : ''}`}
                onDragOver={savedDrawId ? undefined : (e: React.DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  if (e.currentTarget) {
                    e.currentTarget.classList.add("bg-blue-50", "dark:bg-blue-950/20");
                  }
                }}
                onDragLeave={savedDrawId ? undefined : (e: React.DragEvent<HTMLDivElement>) => {
                  if (e.currentTarget) {
                    e.currentTarget.classList.remove("bg-blue-50", "dark:bg-blue-950/20");
                  }
                }}
                onDrop={savedDrawId ? undefined : (e: React.DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  if (e.currentTarget) {
                    e.currentTarget.classList.remove("bg-blue-50", "dark:bg-blue-950/20");
                  }
                  
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
                <div className="space-y-2" ref={listRef}>
                  {bombo.map((team, teamIndex) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + bomboIndex * 0.1 + teamIndex * 0.05 }}
                      whileHover={savedDrawId ? {} : { scale: 1.05, x: 5 }}
                    >
                      <div
                        draggable={!savedDrawId}
                        onDragStart={savedDrawId ? undefined : (e: React.DragEvent<HTMLDivElement>) => {
                          e.dataTransfer.setData("teamId", team.id.toString());
                          e.dataTransfer.setData("sourceBomboIndex", bomboIndex.toString());
                          if (e.currentTarget) {
                            (e.currentTarget as HTMLDivElement).style.opacity = "0.5";
                          }
                        }}
                        onDragEnd={savedDrawId ? undefined : (e: React.DragEvent<HTMLDivElement>) => {
                          if (e.currentTarget) {
                            (e.currentTarget as HTMLDivElement).style.opacity = "1";
                          }
                        }}
                        className={cn(
                          "p-3 bg-white dark:bg-neutral-900 rounded-xl border-2 transition-all shadow-sm hover:shadow-md",
                          savedDrawId 
                            ? "cursor-default border-gray-200 dark:border-neutral-700" 
                            : "cursor-move hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700"
                        )}
                      >
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {team.name}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {bombo.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 text-center text-sm text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-xl"
                    >
                      Arrastra equipos aquí
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Botones de acción */}
      {!loadingSaved && bombos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800"
        >
          {savedDrawId ? (
            // Si hay brackets guardados, solo mostrar "Limpiar" (eliminar)
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                // Confirmación eliminada
                {
                  await deleteSavedBrackets();
                  // Recargar para verificar que se eliminaron
                  if (tournament && tournament.id !== 0) {
                    await loadSavedBrackets();
                  }
                }
              }}
              className="px-4 py-2.5 border-2 border-red-300 dark:border-red-700 rounded-xl bg-white dark:bg-neutral-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm hover:shadow-md font-medium"
            >
              Limpiar (Eliminar)
            </motion.button>
          ) : (
            // Si no hay brackets guardados, mostrar opciones para generar nuevos
            <>
              <motion.button
                whileHover={{ scale: !selectedGenero ? 1 : 1.05 }}
                whileTap={{ scale: !selectedGenero ? 1 : 0.95 }}
                onClick={() => generateBombos()}
                disabled={!selectedGenero}
                  className={cn(
                    "px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                    !selectedGenero && "cursor-not-allowed"
                  )}
              >
                Regenerar
              </motion.button>
              <motion.button
                whileHover={{ scale: generating || !selectedGenero ? 1 : 1.05 }}
                whileTap={{ scale: generating || !selectedGenero ? 1 : 0.95 }}
                onClick={handleSave}
                disabled={generating || !selectedGenero}
                  className={cn(
                    "px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl cursor-pointer",
                    (generating || !selectedGenero) && "cursor-not-allowed"
                  )}
              >
                {generating ? "Guardando..." : "Guardar Brackets"}
              </motion.button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

