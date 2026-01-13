// Página para generar brackets
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Network } from "lucide-react";
import { Tournament, Team } from "../types";
import { useBrackets } from "../hooks/useBrackets";
import { supabase } from "../../../../lib/supabaseClient";

export default function BracketsPage() {
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
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
  } = useBrackets(tournament, selectedSport);

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
  }, []);

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
    // Cargar brackets guardados cuando el torneo y disciplina estén disponibles
    if (tournament && tournament.id !== 0 && selectedSport) {
      loadSavedBrackets();
    }
  }, [tournament?.id, selectedSport]);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Generar Brackets
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Crear llaves de eliminación automática - Fases de Grupo
            </p>
          </div>
        </div>
      </div>

      {/* Selector de disciplina */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Seleccionar Disciplina (para identificar los brackets guardados)
        </label>
        <select
          value={selectedSport || ""}
          onChange={(e) => {
            const sportId = e.target.value ? parseInt(e.target.value) : null;
            setSelectedSport(sportId);
            setBombos([]); // Limpiar brackets al cambiar disciplina
            // Los brackets guardados se cargarán automáticamente en el useEffect
          }}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
        >
          <option value="">Seleccionar disciplina...</option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Nota: Los brackets se generan con los equipos que selecciones manualmente, no por inscripciones.
        </p>
      </div>

      {/* Información del torneo */}
      {tournament && selectedSport && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Torneo:</strong> {tournament.name}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            <strong>Disciplina:</strong> {sports.find(s => s.id === selectedSport)?.name || "N/A"}
          </p>
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
        </div>
      )}

      {/* Selección de equipos */}
      {!loadingSaved && bombos.length === 0 && selectedSport && allTeams.length > 0 && (
        <div className="mb-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Seleccionar Equipos para los Brackets
            </h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllTeams}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Seleccionar Todos
              </button>
              <button
                onClick={deselectAllTeams}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Deseleccionar Todos
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allTeams.map((team) => (
                <label
                  key={team.id}
                  className="flex items-center p-3 border border-gray-200 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTeams.has(team.id)}
                    onChange={() => toggleTeamSelection(team.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                    {team.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={generateBombos}
              disabled={selectedTeams.size === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 mx-auto"
            >
              <Network className="w-5 h-5" />
              Generar Brackets
            </button>
            {selectedTeams.size === 0 && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Selecciona al menos un equipo para generar los brackets
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mensaje de carga */}
      {loadingSaved && (
        <div className="mb-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando brackets guardados...</p>
        </div>
      )}

      {/* Bombos generados */}
      {!loadingSaved && bombos.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fases de Grupo (Bombos)
            </h3>
            {savedDrawId && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                ✓ Brackets Guardados
              </span>
            )}
          </div>
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
                  {bombo.map((team, teamIndex) => (
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

      {/* Botones de acción */}
      {!loadingSaved && bombos.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
          {savedDrawId ? (
            // Si hay brackets guardados, solo mostrar "Limpiar" (eliminar)
            <button
              onClick={async () => {
                if (confirm("¿Estás seguro de que quieres eliminar los brackets guardados?")) {
                  await deleteSavedBrackets();
                  // Recargar para verificar que se eliminaron
                  if (tournament && tournament.id !== 0) {
                    await loadSavedBrackets();
                  }
                }
              }}
              className="px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-neutral-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Limpiar (Eliminar)
            </button>
          ) : (
            // Si no hay brackets guardados, mostrar opciones para generar nuevos
            <>
              <button
                onClick={generateBombos}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Regenerar
              </button>
              <button
                onClick={handleSave}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? "Guardando..." : "Guardar Brackets"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

