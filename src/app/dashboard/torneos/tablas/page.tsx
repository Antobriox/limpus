// Página para mostrar tablas de posiciones por disciplina
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useStandings } from "../hooks/useStandings";
import { useDashboard } from "../hooks/useDashboard";
import { getDisciplineRulesByName } from "../config/disciplineRules";
import { motion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "../../../../lib/utils";

export default function TablasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editionParam = searchParams.get("edition");
  const editionId = editionParam ? parseInt(editionParam, 10) : undefined;
  const { activeTournamentIds } = useDashboard(editionId);

  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [selectedSportName, setSelectedSportName] = useState<string>("");
  const [selectedGenero, setSelectedGenero] = useState<string | null>(null);

  const { bomboStandings, loading, error } = useStandings(
    selectedSport,
    selectedSportName,
    activeTournamentIds.length > 0 ? activeTournamentIds : undefined,
    selectedGenero
  );

  useEffect(() => {
    loadSports();
  }, []);

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

  useEffect(() => {
    if (selectedSport) {
      const sport = sports.find((s) => s.id === selectedSport);
      if (sport) {
        setSelectedSportName(sport.name);
      }
    }
  }, [selectedSport, sports]);

  // Cuando se selecciona un deporte, establecer "masculino" por defecto si no hay género seleccionado
  useEffect(() => {
    if (selectedSport && !selectedGenero) {
      setSelectedGenero("masculino");
    }
  }, [selectedSport, selectedGenero]);

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

  const rules = selectedSportName ? getDisciplineRulesByName(selectedSportName) : null;

  const [listRef] = useAutoAnimate();

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-4 sm:mb-6"
      >
        <motion.button
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push(editionId ? `/dashboard/torneos?edition=${editionId}` : "/dashboard/torneos")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-3 sm:mb-4 transition text-sm sm:text-base font-medium"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Volver</span>
        </motion.button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
              Tablas de Posiciones
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Clasificación por disciplina según reglas específicas
            </p>
          </div>
        </div>
      </motion.div>

      {/* Selectores de disciplina y género */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar Disciplina
          </label>
          <select
            value={selectedSport ?? ""}
            onChange={(e) => {
              const sportId = e.target.value ? parseInt(e.target.value) : null;
              setSelectedSport(sportId);
              // Establecer "masculino" por defecto al cambiar disciplina
              setSelectedGenero("masculino");
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
        {selectedSport && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Género
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

      {/* Información de reglas */}
      {rules && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-xl shadow-sm"
        >
          <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2">
            Reglas de {rules.disciplineName}
          </h3>
          <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p>
              <strong>Puntos:</strong>{" "}
              {rules.pointSystem.win !== undefined && `Victoria: ${rules.pointSystem.win} pts`}
              {rules.pointSystem.draw !== undefined && `, Empate: ${rules.pointSystem.draw} pts`}
              {rules.pointSystem.loss !== undefined && `, Derrota: ${rules.pointSystem.loss} pts`}
            </p>
            <p>
              <strong>Criterios de desempate:</strong>{" "}
              <span className="break-words">{rules.tiebreakerOrder.join(" → ")}</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Tabla de posiciones - Solo mostrar si hay género seleccionado */}
      {!selectedGenero && selectedSport ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 sm:py-12 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-lg"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
          </motion.div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4 font-medium">
            Selecciona un género para ver las tablas de posiciones
          </p>
        </motion.div>
      ) : loading ? (
        <div className="text-center py-8 sm:py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block w-8 h-8 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full"
          />
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">Cargando tabla de posiciones...</p>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 sm:py-12 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900 px-4 shadow-lg"
        >
          <p className="text-sm sm:text-base text-red-600 dark:text-red-400 font-semibold">{error}</p>
        </motion.div>
      ) : bomboStandings.length === 0 && selectedSport && selectedGenero ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 sm:py-12 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 px-4 shadow-lg"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
          </motion.div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
            No hay equipos registrados para esta disciplina y género. Genera brackets primero.
          </p>
        </motion.div>
      ) : bomboStandings.length > 0 ? (
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
      ) : null}
    </div>
  );
}
