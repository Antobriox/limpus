"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useStandings } from "../../torneos/hooks/useStandings";
import { useSports } from "../hooks/useSports";
import { useActiveTournamentIds } from "../hooks/useViewersData";
import { getDisciplineRulesByName } from "../../torneos/config/disciplineRules";
import { ArrowLeft, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "../../../../lib/utils";

export default function ClasificacionViewersPage() {
  const router = useRouter();
  const { sports } = useSports();
  const { activeTournamentIds, loading: loadingTournamentIds } = useActiveTournamentIds();
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [selectedSportName, setSelectedSportName] = useState<string>("");
  const [selectedGenero, setSelectedGenero] = useState<string | null>(null);

  // Seleccionar "Fútbol" por defecto cuando se cargan los deportes
  useEffect(() => {
    if (sports.length > 0 && !selectedSport) {
      // Buscar "Fútbol" específicamente
      const futbolSport = sports.find(
        (s) => s.name.toLowerCase().includes("futbol") || 
               s.name.toLowerCase().includes("fútbol") ||
               s.name.toLowerCase().includes("football")
      ) || sports[0]; // Si no encuentra Fútbol, usar el primero
      
      // Usar setTimeout para evitar setState sincrónico en efecto
      setTimeout(() => {
        setSelectedSport(futbolSport.id);
        setSelectedSportName(futbolSport.name);
        // Establecer "masculino" como género por defecto
        setSelectedGenero("masculino");
      }, 0);
    }
  }, [sports, selectedSport]);

  // Cuando se selecciona un deporte, establecer "masculino" por defecto si no hay género seleccionado
  useEffect(() => {
    if (selectedSport && !selectedGenero) {
      // Usar setTimeout para evitar setState síncrono en effect
      const timer = setTimeout(() => {
        setSelectedGenero("masculino");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedSport, selectedGenero]);

  // Usar el hook con TanStack Query para cargar standings
  // Solo ejecutar cuando tengamos activeTournamentIds y hayan IDs válidos
  const { bomboStandings, loading: loadingStandings, error } = useStandings(
    selectedSport,
    selectedSportName,
    activeTournamentIds.length > 0 ? activeTournamentIds : undefined,
    selectedGenero
  );

  const rules = selectedSportName ? getDisciplineRulesByName(selectedSportName) : null;

  const [listRef] = useAutoAnimate();

  // Mostrar loading mientras se cargan los tournament IDs o los standings
  const isLoading = loadingTournamentIds || loadingStandings;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Navigation Bar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center relative">
            {/* Navigation Links - Centrados */}
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition"
              >
                Home
              </Link>
              <Link
                href="/dashboard/viewers/clasificacion"
                className="text-blue-600 dark:text-blue-400 font-medium transition"
              >
                Clasificación
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-4 sm:mb-6"
        >
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-3 sm:mb-4 transition text-sm sm:text-base font-medium cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Volver</span>
          </motion.button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
            Tablas de Posiciones
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Consulta la clasificación de todos los equipos por disciplina
          </p>
        </motion.div>

        {/* Selectores de Disciplina y Género */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 sm:mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Selecciona una disciplina
            </label>
            <select
              value={selectedSport ?? ""}
              onChange={(e) => {
                const sportId = e.target.value ? Number(e.target.value) : null;
                setSelectedSport(sportId);
                // Establecer "masculino" por defecto al cambiar disciplina
                setSelectedGenero("masculino");
              }}
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            >
              <option value="">Selecciona una disciplina</option>
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </div>
          {selectedSport && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Selecciona un género
              </label>
              <select
                value={selectedGenero ?? ""}
                onChange={(e) => setSelectedGenero(e.target.value || null)}
                className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
              >
              <option value="">Selecciona un género</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              </select>
            </div>
          )}
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">
              Error al cargar la clasificación: {error}
            </p>
          </div>
        )}

        {/* Loading State - Solo mostrar en primera carga cuando no hay datos en caché */}
        {isLoading && bomboStandings.length === 0 && !error && (
          <div className="flex justify-center items-center py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-8 h-8 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full mb-4"
              />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando clasificación...</p>
            </motion.div>
          </div>
        )}

        {/* Mensaje si no hay género seleccionado */}
        {selectedSport && !selectedGenero && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-lg"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              <Trophy className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            </motion.div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Selecciona un género para ver las tablas de posiciones
            </p>
          </motion.div>
        )}

        {/* Standings Tables - Mostrar datos del caché inmediatamente, incluso si está refetching */}
        {!error && selectedGenero && bomboStandings && bomboStandings.length > 0 && (
          <div className="space-y-8" ref={listRef}>
            {bomboStandings.map((bomboStanding, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                {/* Table Header */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-700 dark:via-blue-800 dark:to-blue-900 px-6 py-4 shadow-md">
                  <h2 className="text-xl font-bold text-white">
                    {bomboStandings.length > 1 ? `Bombo ${bomboStanding.bomboNumber}` : "Clasificación General"}
                  </h2>
                </div>

                {/* Table */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[640px] sm:min-w-0">
                    <thead className="bg-gray-50 dark:bg-neutral-900">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Pos
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          PJ
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          G
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          E
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          P
                        </th>
                        {rules?.usesSets ? (
                          <>
                            <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Sets G
                            </th>
                            <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Sets P
                            </th>
                          </>
                        ) : (
                          <>
                            <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {rules?.metricName === "goles" ? "GF" : "PF"}
                            </th>
                            <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {rules?.metricName === "goles" ? "GC" : "PC"}
                            </th>
                            <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {rules?.metricName === "goles" ? "DG" : "DP"}
                            </th>
                          </>
                        )}
                        {rules?.usesCards && (
                          <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Fair Play
                          </th>
                        )}
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Pts
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700" ref={listRef}>
                      {bomboStanding.standings.map((team, teamIndex) => (
                        <motion.tr
                          key={team.teamId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: teamIndex * 0.03 }}
                          whileHover={{ scale: 1.01, x: 5 }}
                          className={cn(
                            "transition-all",
                            teamIndex < 3 ? "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20" : "hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                          )}
                        >
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {teamIndex === 0 && <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mr-1 sm:mr-2 flex-shrink-0" />}
                              {teamIndex === 1 && <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-1 sm:mr-2 flex-shrink-0" />}
                              {teamIndex === 2 && <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mr-1 sm:mr-2 flex-shrink-0" />}
                              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                {teamIndex + 1}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 min-w-[120px]">
                            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              {team.teamName}
                            </span>
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {team.played}
                            </span>
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {team.wins}
                            </span>
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {team.draws || 0}
                            </span>
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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
                          <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                            <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                              {team.points}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!bomboStandings || bomboStandings.length === 0) && selectedSport && selectedGenero && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-8 text-center shadow-lg"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              <Trophy className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            </motion.div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              No hay equipos registrados para esta disciplina y género. Genera brackets primero.
            </p>
          </motion.div>
        )}

        {/* No Sport Selected */}
        {!selectedSport && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-8 text-center shadow-lg"
          >
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Selecciona una disciplina para ver su clasificación
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
