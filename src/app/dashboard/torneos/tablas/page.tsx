// Página para mostrar tablas de posiciones por disciplina
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, TrendingUp } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useStandings } from "../hooks/useStandings";
import { BomboStandings } from "../types/standings";
import { getDisciplineRulesByName } from "../config/disciplineRules";

export default function TablasPage() {
  const router = useRouter();
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [selectedSportName, setSelectedSportName] = useState<string>("");

  // Usar el hook con TanStack Query - los datos se cargan automáticamente y se cachean
  const { bomboStandings, loading, error } = useStandings(
    selectedSport,
    selectedSportName
  );

  useEffect(() => {
    loadSports();
  }, []);

  useEffect(() => {
    if (selectedSport) {
      const sport = sports.find((s) => s.id === selectedSport);
      if (sport) {
        setSelectedSportName(sport.name);
      }
    }
  }, [selectedSport, sports]);

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
              Tablas de Posiciones
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Clasificación por disciplina según reglas específicas
            </p>
          </div>
        </div>
      </div>

      {/* Selector de disciplina */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Seleccionar Disciplina
        </label>
        <select
          value={selectedSport || ""}
          onChange={(e) => setSelectedSport(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
        >
          <option value="">Seleccionar disciplina...</option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </div>

      {/* Información de reglas */}
      {rules && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Reglas de {rules.disciplineName}
          </h3>
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p>
              <strong>Puntos:</strong>{" "}
              {rules.pointSystem.win !== undefined && `Victoria: ${rules.pointSystem.win} pts`}
              {rules.pointSystem.draw !== undefined && `, Empate: ${rules.pointSystem.draw} pts`}
              {rules.pointSystem.loss !== undefined && `, Derrota: ${rules.pointSystem.loss} pts`}
            </p>
            <p>
              <strong>Criterios de desempate:</strong>{" "}
              {rules.tiebreakerOrder.join(" → ")}
            </p>
          </div>
        </div>
      )}

      {/* Tabla de posiciones */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando tabla de posiciones...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : bomboStandings.length === 0 && selectedSport ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
          <Trophy className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No hay equipos registrados para esta disciplina. Genera brackets primero.
          </p>
        </div>
      ) : bomboStandings.length > 0 ? (
        <div className="space-y-6">
          {bomboStandings.map((bombo) => (
            <div key={bombo.bomboNumber}>
              <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border-b border-gray-200 dark:border-neutral-800">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{bombo.bomboName}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-neutral-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                          Pos
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                          Equipo
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                          PJ
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                          G
                        </th>
                        {rules?.pointSystem.draw !== undefined && (
                          <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                            E
                          </th>
                        )}
                        <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                          P
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                          {rules?.metricName === "goles" ? "GF" : rules?.metricName === "sets" ? "Sets G" : "PF"}
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                          {rules?.metricName === "goles" ? "GC" : rules?.metricName === "sets" ? "Sets P" : "PC"}
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                          {rules?.metricName === "goles" ? "DG" : rules?.metricName === "sets" ? "DS" : "DP"}
                        </th>
                        {rules?.usesCards && (
                          <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                            Fair Play
                          </th>
                        )}
                        <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                          Pts
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                      {bombo.standings.map((standing) => (
                        <tr
                          key={standing.teamId}
                          className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                            {standing.position}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {standing.teamName}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                            {standing.played}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                            {standing.wins}
                          </td>
                          {rules?.pointSystem.draw !== undefined && (
                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                              {standing.draws}
                            </td>
                          )}
                          <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                            {standing.losses}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                            {rules?.metricName === "sets" ? standing.setsWon : rules?.metricName === "goles" ? standing.goalsFor : standing.pointsFor}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                            {rules?.metricName === "sets" ? standing.setsLost : rules?.metricName === "goles" ? standing.goalsAgainst : standing.pointsAgainst}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                            {rules?.metricName === "sets" 
                              ? standing.setDifference > 0 ? `+${standing.setDifference}` : standing.setDifference
                              : rules?.metricName === "goles"
                              ? standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference
                              : standing.pointDifference > 0 ? `+${standing.pointDifference}` : standing.pointDifference}
                          </td>
                          {rules?.usesCards && (
                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                              {standing.fairPlayPoints}
                            </td>
                          )}
                          <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                            {standing.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

