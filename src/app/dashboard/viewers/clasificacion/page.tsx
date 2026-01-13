"use client";

import { useState, useEffect } from "react";
import { useStandings } from "../../torneos/hooks/useStandings";
import { useSports } from "../hooks/useSports";
import { getDisciplineRulesByName } from "../../torneos/config/disciplineRules";
import { ArrowLeft, Trophy, TrendingUp, Star } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ClasificacionViewersPage() {
  const router = useRouter();
  // Usar el hook con TanStack Query para cargar deportes
  const { sports, loading: loadingSports } = useSports();
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [selectedSportName, setSelectedSportName] = useState<string>("");

  // Seleccionar el primer deporte por defecto cuando se cargan los deportes
  useEffect(() => {
    if (sports.length > 0 && !selectedSport) {
      setSelectedSport(sports[0].id);
    }
  }, [sports, selectedSport]);

  // Actualizar el nombre del deporte cuando cambia la selección
  useEffect(() => {
    if (selectedSport) {
      const sport = sports.find((s) => s.id === selectedSport);
      if (sport) {
        setSelectedSportName(sport.name);
      }
    }
  }, [selectedSport, sports]);

  // Usar el hook con TanStack Query para cargar standings
  const { bomboStandings, loading: loadingStandings, error, isFetching } = useStandings(
    selectedSport,
    selectedSportName
  );

  const rules = selectedSportName ? getDisciplineRulesByName(selectedSportName) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center relative">
            {/* Navigation Links - Centrados */}
            <div className="flex items-center gap-8">
              <a
                href="/dashboard/viewers"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition"
              >
                Home
              </a>
              <a
                href="/dashboard/viewers/clasificacion"
                className="text-blue-600 dark:text-blue-400 font-medium transition"
              >
                Clasificación
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/viewers")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            Tablas de Posiciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consulta la clasificación de todos los equipos por disciplina
          </p>
        </div>

        {/* Selector de Disciplina */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecciona una disciplina
          </label>
          <select
            value={selectedSport || ""}
            onChange={(e) => setSelectedSport(Number(e.target.value) || null)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecciona una disciplina</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">
              Error al cargar la clasificación: {error.message}
            </p>
          </div>
        )}

        {/* Loading State - Solo mostrar en primera carga cuando no hay datos en caché */}
        {loadingStandings && bomboStandings.length === 0 && !error && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando clasificación...</p>
            </div>
          </div>
        )}

        {/* Standings Tables - Mostrar datos del caché inmediatamente, incluso si está refetching */}
        {!error && bomboStandings && bomboStandings.length > 0 && (
          <div className="space-y-8">
            {bomboStandings.map((bomboStanding, index) => (
              <div key={index} className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden">
                {/* Table Header */}
                <div className="bg-blue-600 dark:bg-blue-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">
                    {bomboStandings.length > 1 ? `Bombo ${bomboStanding.bomboNumber}` : "Clasificación General"}
                  </h2>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-neutral-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Pos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Pts
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          PJ
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          G
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          E
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          P
                        </th>
                        {rules?.usesSets ? (
                          <>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Sets G
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Sets P
                            </th>
                          </>
                        ) : (
                          <>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {rules?.metricName === "goles" ? "GF" : "PF"}
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {rules?.metricName === "goles" ? "GC" : "PC"}
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {rules?.metricName === "goles" ? "DG" : "DP"}
                            </th>
                          </>
                        )}
                        {rules?.usesCards && (
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Fair Play
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                      {bomboStanding.standings.map((team, teamIndex) => (
                        <tr
                          key={team.teamId}
                          className={teamIndex < 3 ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {teamIndex === 0 && <Trophy className="w-5 h-5 text-yellow-500 mr-2" />}
                              {teamIndex === 1 && <Trophy className="w-5 h-5 text-gray-400 mr-2" />}
                              {teamIndex === 2 && <Trophy className="w-5 h-5 text-orange-600 mr-2" />}
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {teamIndex + 1}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {team.teamName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {team.points}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {team.matchesPlayed}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {team.wins}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {team.draws || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {team.losses}
                            </span>
                          </td>
                          {rules?.usesSets ? (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {team.setsWon || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {team.setsLost || 0}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {team.goalsFor || team.pointsFor || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {team.goalsAgainst || team.pointsAgainst || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`text-sm font-medium ${
                                  (team.goalDifference || team.pointDifference || 0) > 0
                                    ? "text-green-600 dark:text-green-400"
                                    : (team.goalDifference || team.pointDifference || 0) < 0
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}>
                                  {team.goalDifference !== undefined
                                    ? team.goalDifference
                                    : team.pointDifference !== undefined
                                    ? team.pointDifference
                                    : 0}
                                </span>
                              </td>
                            </>
                          )}
                          {rules?.usesCards && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {team.fairPlayPoints || 0}
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingStandings && !error && (!bomboStandings || bomboStandings.length === 0) && selectedSport && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-8 text-center">
            <Trophy className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No hay equipos registrados para esta disciplina. Genera brackets primero.
            </p>
          </div>
        )}

        {/* No Sport Selected */}
        {!selectedSport && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Selecciona una disciplina para ver su clasificación
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
