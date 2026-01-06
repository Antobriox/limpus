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
  const {
    allTeams,
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
  } = useBrackets(tournament);

  useEffect(() => {
    const initialize = async () => {
      await loadTournament();
      await loadTeams();
    };
    initialize();
  }, []);

  useEffect(() => {
    // Cargar brackets guardados cuando el torneo esté disponible
    if (tournament && tournament.id !== 0) {
      loadSavedBrackets();
    }
  }, [tournament?.id]);

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

      {/* Información del torneo */}
      {tournament && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Torneo:</strong> {tournament.name}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            <strong>Equipos disponibles:</strong> {allTeams.length}
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

      {/* Botón para generar brackets */}
      {!loadingSaved && bombos.length === 0 && (
        <div className="mb-6 text-center">
          <button
            onClick={generateBombos}
            disabled={allTeams.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 mx-auto"
          >
            <Network className="w-5 h-5" />
            Generar Brackets
          </button>
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

