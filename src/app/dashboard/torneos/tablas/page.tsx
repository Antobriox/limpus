// Página para mostrar tablas de posiciones por disciplina
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useStandings } from "../hooks/useStandings";
import { getDisciplineRulesByName } from "../config/disciplineRules";

export default function TablasPage() {
  const router = useRouter();
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [selectedSportName, setSelectedSportName] = useState<string>("");
  const [selectedGenero, setSelectedGenero] = useState<string | null>(null);

  // Usar el hook con TanStack Query - los datos se cargan automáticamente y se cachean
  const { bomboStandings, loading, error } = useStandings(
    selectedSport,
    selectedSportName,
    undefined,
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Volver</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tablas de Posiciones
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Clasificación por disciplina según reglas específicas
            </p>
          </div>
        </div>
      </div>

      {/* Selectores de disciplina y género */}
      <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Género
            </label>
            <select
              value={selectedGenero ?? ""}
              onChange={(e) => setSelectedGenero(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
            >
              <option value="">Selecciona un género</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
          </div>
        )}
      </div>

      {/* Información de reglas */}
      {rules && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
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
        </div>
      )}

      {/* Tabla de posiciones - Solo mostrar si hay género seleccionado */}
      {!selectedGenero && selectedSport ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4">
            Selecciona un género para ver las tablas de posiciones
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-8 sm:py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Cargando tabla de posiciones...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 sm:py-12 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900 px-4">
          <p className="text-sm sm:text-base text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : bomboStandings.length === 0 && selectedSport && selectedGenero ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 px-4">
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            No hay equipos registrados para esta disciplina y género. Genera brackets primero.
          </p>
        </div>
      ) : bomboStandings.length > 0 ? (
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
                  <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                    {bomboStanding.standings.map((team, teamIndex) => (
                      <tr
                        key={team.teamId}
                        className={teamIndex < 3 ? "bg-blue-50 dark:bg-blue-900/20" : ""}
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
                          <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                            {team.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
