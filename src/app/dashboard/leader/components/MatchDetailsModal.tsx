"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { X } from "lucide-react";
import { getDisciplineRulesByName } from "../../torneos/config/disciplineRules";

type MatchDetailsModalProps = {
  matchId: number;
  teamAId: number;
  teamBId: number;
  teamAName: string;
  teamBName: string;
  sportName: string;
  onClose: () => void;
};

type MatchEvent = {
  id: number;
  event_type: string;
  team_id: number;
  player_id: number | null;
  value: number | null;
};

type Player = {
  id: number;
  full_name: string;
  jersey_number: number | null;
};

export default function MatchDetailsModal({
  matchId,
  teamAId,
  teamBId,
  teamAName,
  teamBName,
  sportName,
  onClose,
}: MatchDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);

  useEffect(() => {
    loadMatchDetails();
  }, [matchId]);

  const loadMatchDetails = async () => {
    setLoading(true);
    try {
      // Cargar eventos del partido
      const { data: eventsData } = await supabase
        .from("match_events")
        .select("*")
        .eq("match_id", matchId)
        .order("value", { ascending: true });

      // Cargar jugadores de ambos equipos usando la misma lógica que useResults
      // Obtener las carreras de cada equipo
      const [careersA, careersB] = await Promise.all([
        supabase.from("careers").select("id").eq("team_id", teamAId),
        supabase.from("careers").select("id").eq("team_id", teamBId),
      ]);

      const careerIdsA = careersA.data?.map((c) => c.id) || [];
      const careerIdsB = careersB.data?.map((c) => c.id) || [];

      // Cargar jugadores de esas carreras
      const [playersAData, playersBData] = await Promise.all([
        careerIdsA.length > 0
          ? supabase
              .from("players")
              .select("id, full_name, jersey_number")
              .in("career_id", careerIdsA)
              .order("jersey_number", { ascending: true, nullsFirst: false })
          : { data: [] },
        careerIdsB.length > 0
          ? supabase
              .from("players")
              .select("id, full_name, jersey_number")
              .in("career_id", careerIdsB)
              .order("jersey_number", { ascending: true, nullsFirst: false })
          : { data: [] },
      ]);

      setPlayersA(
        (playersAData.data || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          jersey_number: p.jersey_number,
        }))
      );

      setPlayersB(
        (playersBData.data || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          jersey_number: p.jersey_number,
        }))
      );

      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error cargando detalles del partido:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (playerId: number | null, team: "a" | "b"): string => {
    if (!playerId) return "Jugador desconocido";
    const players = team === "a" ? playersA : playersB;
    const player = players.find((p) => p.id === playerId);
    return player
      ? `${player.jersey_number ? `#${player.jersey_number} - ` : ""}${player.full_name}`
      : "Jugador desconocido";
  };

  // Obtener reglas de la disciplina
  const disciplineRules = getDisciplineRulesByName(sportName);
  const usesCards = disciplineRules?.usesCards || false;
  const metricName = disciplineRules?.metricName || "goles";
  const isBasketball =
    sportName?.toLowerCase().includes("basket") ||
    sportName?.toLowerCase().includes("básquet");
  const scoreLabel =
    metricName === "puntos" ? "Puntos" : metricName === "goles" ? "Goles" : "Eventos";

  // Separar eventos por tipo y equipo
  const goalsA: Array<{ player_id: number; minute: number; points?: number }> = [];
  const goalsB: Array<{ player_id: number; minute: number; points?: number }> = [];
  const yellowCardsA: Array<{ player_id: number; minute: number }> = [];
  const yellowCardsB: Array<{ player_id: number; minute: number }> = [];
  const redCardsA: Array<{ player_id: number; minute: number }> = [];
  const redCardsB: Array<{ player_id: number; minute: number }> = [];

  events.forEach((event) => {
    if (event.event_type === "goal") {
      if (event.team_id === teamAId) {
        if (isBasketball && event.value) {
          const points = Math.floor(event.value / 1000);
          const minute = event.value % 1000;
          goalsA.push({
            player_id: event.player_id || 0,
            minute,
            points,
          });
        } else {
          goalsA.push({
            player_id: event.player_id || 0,
            minute: event.value || 0,
          });
        }
      } else {
        if (isBasketball && event.value) {
          const points = Math.floor(event.value / 1000);
          const minute = event.value % 1000;
          goalsB.push({
            player_id: event.player_id || 0,
            minute,
            points,
          });
        } else {
          goalsB.push({
            player_id: event.player_id || 0,
            minute: event.value || 0,
          });
        }
      }
    } else if (event.event_type === "yellow_card") {
      if (event.team_id === teamAId) {
        yellowCardsA.push({
          player_id: event.player_id || 0,
          minute: event.value || 0,
        });
      } else {
        yellowCardsB.push({
          player_id: event.player_id || 0,
          minute: event.value || 0,
        });
      }
    } else if (event.event_type === "red_card") {
      if (event.team_id === teamAId) {
        redCardsA.push({
          player_id: event.player_id || 0,
          minute: event.value || 0,
        });
      } else {
        redCardsB.push({
          player_id: event.player_id || 0,
          minute: event.value || 0,
        });
      }
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detalles del Partido
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del partido */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {teamAName} vs {teamBName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sportName}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Goles/Puntos del Equipo A */}
              {!disciplineRules?.usesSets && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {scoreLabel} - {teamAName}
                  </h3>
                  {goalsA.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No hay {scoreLabel.toLowerCase()} registrados
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {goalsA.map((goal, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-900 rounded"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {getPlayerName(goal.player_id, "a")}
                            {scoreLabel === "Puntos" && goal.points
                              ? ` - ${goal.points} ${goal.points === 1 ? "punto" : "puntos"}${goal.minute > 0 ? ` (Minuto ${goal.minute}')` : ""}`
                              : ` - Minuto ${goal.minute}'`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Goles/Puntos del Equipo B */}
              {!disciplineRules?.usesSets && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {scoreLabel} - {teamBName}
                  </h3>
                  {goalsB.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No hay {scoreLabel.toLowerCase()} registrados
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {goalsB.map((goal, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-900 rounded"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {getPlayerName(goal.player_id, "b")}
                            {scoreLabel === "Puntos" && goal.points
                              ? ` - ${goal.points} ${goal.points === 1 ? "punto" : "puntos"}${goal.minute > 0 ? ` (Minuto ${goal.minute}')` : ""}`
                              : ` - Minuto ${goal.minute}'`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tarjetas Amarillas */}
              {usesCards && (
                <>
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="w-4 h-4 bg-yellow-500 rounded"></span>
                      Tarjetas Amarillas - {teamAName}
                    </h3>
                    {yellowCardsA.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No hay tarjetas amarillas registradas
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {yellowCardsA.map((card, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-900 rounded"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {getPlayerName(card.player_id, "a")} - Minuto {card.minute}'
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="w-4 h-4 bg-yellow-500 rounded"></span>
                      Tarjetas Amarillas - {teamBName}
                    </h3>
                    {yellowCardsB.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No hay tarjetas amarillas registradas
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {yellowCardsB.map((card, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-900 rounded"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {getPlayerName(card.player_id, "b")} - Minuto {card.minute}'
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Tarjetas Rojas */}
              {usesCards && (
                <>
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="w-4 h-4 bg-red-500 rounded"></span>
                      Tarjetas Rojas - {teamAName}
                    </h3>
                    {redCardsA.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No hay tarjetas rojas registradas
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {redCardsA.map((card, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-900 rounded"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {getPlayerName(card.player_id, "a")} - Minuto {card.minute}'
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="w-4 h-4 bg-red-500 rounded"></span>
                      Tarjetas Rojas - {teamBName}
                    </h3>
                    {redCardsB.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No hay tarjetas rojas registradas
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {redCardsB.map((card, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-900 rounded"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {getPlayerName(card.player_id, "b")} - Minuto {card.minute}'
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {goalsA.length === 0 &&
                goalsB.length === 0 &&
                yellowCardsA.length === 0 &&
                yellowCardsB.length === 0 &&
                redCardsA.length === 0 &&
                redCardsB.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay eventos registrados para este partido
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
