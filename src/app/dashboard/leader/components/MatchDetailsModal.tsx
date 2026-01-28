"use client";

import { useState, useEffect, useCallback } from "react";

// Tipos para datos de Supabase
type SupabasePlayer = {
  id: number;
  full_name: string;
  jersey_number: number | null;
};

import { supabase } from "../../../../lib/supabaseClient";
import { X } from "lucide-react";
import { getDisciplineRulesByName } from "../../torneos/config/disciplineRules";
import { motion, AnimatePresence } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";

type MatchDetailsModalProps = {
  matchId: number;
  teamAId: number | null;
  teamBId: number | null;
  teamAName: string;
  teamBName: string;
  sportName: string;
  genero?: string | null;
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
  genero,
  onClose,
}: MatchDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);

  const loadMatchDetails = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar eventos del partido
      const { data: eventsData } = await supabase
        .from("match_events")
        .select("*")
        .eq("match_id", matchId)
        .order("value", { ascending: true });

      // Obtener sport_id del partido para filtrar jugadores
      let sportId: number | undefined = undefined;
      const { data: matchData } = await supabase
        .from("matches")
        .select(`
          tournament_id,
          genero,
          tournaments!inner (
            sport_id
          )
        `)
        .eq("id", matchId)
        .single();
      
      // tournaments es un array, tomar el primer elemento
      sportId = Array.isArray(matchData?.tournaments) && matchData.tournaments.length > 0
        ? matchData.tournaments[0].sport_id
        : undefined;
      const matchGenero = matchData?.genero || genero;

      console.log(`Cargando jugadores para partido ${matchId}, deporte ${sportId}, género ${matchGenero}`);

      // Cargar jugadores de ambos equipos filtrando por disciplina y género
      const loadPlayersForTeam = async (teamId: number | null, sportId?: number, genero?: string | null): Promise<Player[]> => {
        if (!teamId) {
          return [];
        }
        // Si tenemos sportId y genero, buscar la inscripción específica
        if (sportId && genero) {
          const { data: teamRegistrations } = await supabase
            .from("team_registrations")
            .select(`
              id,
              form_id,
              registration_forms!inner (
                sport_id,
                genero
              )
            `)
            .eq("team_id", teamId)
            .eq("registration_forms.sport_id", sportId)
            .eq("registration_forms.genero", genero);

          if (teamRegistrations && teamRegistrations.length > 0) {
            const registrationId = teamRegistrations[0].id;
            const { data: players } = await supabase
              .from("players")
              .select("id, full_name, jersey_number")
              .eq("team_registration_id", registrationId)
              .order("jersey_number", { ascending: true, nullsFirst: false });

            return ((players || []) as SupabasePlayer[]).map((p: SupabasePlayer) => ({
              id: p.id,
              full_name: p.full_name,
              jersey_number: p.jersey_number,
            }));
          }
          return [];
        }

        // Fallback: cargar todos los jugadores del equipo (comportamiento anterior)
        const { data: careers } = await supabase
          .from("careers")
          .select("id")
          .eq("team_id", teamId);

        if (!careers || careers.length === 0) {
          return [];
        }

        const careerIds = careers.map((c) => c.id);
        const { data: players } = await supabase
          .from("players")
          .select("id, full_name, jersey_number")
          .in("career_id", careerIds)
          .order("jersey_number", { ascending: true, nullsFirst: false });

        return ((players || []) as SupabasePlayer[]).map((p: SupabasePlayer) => ({
          id: p.id,
          full_name: p.full_name,
          jersey_number: p.jersey_number,
        }));
      };

      // Cargar jugadores de ambos equipos
      const [playersA, playersB] = await Promise.all([
        loadPlayersForTeam(teamAId, sportId, matchGenero),
        loadPlayersForTeam(teamBId, sportId, matchGenero),
      ]);

      setPlayersA(playersA);
      setPlayersB(playersB);

      // Filtrar eventos duplicados basándose en una combinación única de propiedades
      const uniqueEvents = (eventsData || []).reduce((acc: MatchEvent[], event: MatchEvent) => {
        // Verificar si ya existe un evento con la misma clave
        const exists = acc.some(
          (e) =>
            e.event_type === event.event_type &&
            e.team_id === event.team_id &&
            e.player_id === event.player_id &&
            e.value === event.value
        );
        if (!exists) {
          acc.push(event);
        }
        return acc;
      }, []);

      setEvents(uniqueEvents);
    } catch (error) {
      console.error("Error cargando detalles del partido:", error);
    } finally {
      setLoading(false);
    }
  }, [matchId, teamAId, teamBId, genero]);

  useEffect(() => {
    loadMatchDetails();
  }, [loadMatchDetails]);

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

  const [listRef] = useAutoAnimate();

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none"
      >
        <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-2 sm:my-4 mx-2 sm:mx-0 pointer-events-auto border border-gray-200 dark:border-neutral-700 shadow-2xl">
          <div className="sticky top-0 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-md border-b border-gray-200 dark:border-neutral-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent pr-2">
              Detalles del Partido
            </h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition flex-shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Información del partido */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2">
              {teamAName} vs {teamBName}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {sportName}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-8 h-8 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full"
              />
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
                    <div className="space-y-2" ref={listRef}>
                      {goalsA.map((goal, index) => {
                        // Crear una key única usando player_id, minute, points e index
                        const uniqueKey = `goal-a-${goal.player_id}-${goal.minute}-${goal.points || 0}-${index}`;
                        return (
                        <motion.div
                          key={uniqueKey}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all"
                        >
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {getPlayerName(goal.player_id, "a")}
                            {scoreLabel === "Puntos" && goal.points
                              ? ` - ${goal.points} ${goal.points === 1 ? "punto" : "puntos"}${goal.minute > 0 ? ` (Minuto ${goal.minute}')` : ""}`
                              : ` - Minuto ${goal.minute}'`}
                          </span>
                        </motion.div>
                        );
                      })}
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
                    <div className="space-y-2" ref={listRef}>
                      {goalsB.map((goal, index) => {
                        // Crear una key única usando player_id, minute, points e index
                        const uniqueKey = `goal-b-${goal.player_id}-${goal.minute}-${goal.points || 0}-${index}`;
                        return (
                        <motion.div
                          key={uniqueKey}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all"
                        >
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {getPlayerName(goal.player_id, "b")}
                            {scoreLabel === "Puntos" && goal.points
                              ? ` - ${goal.points} ${goal.points === 1 ? "punto" : "puntos"}${goal.minute > 0 ? ` (Minuto ${goal.minute}')` : ""}`
                              : ` - Minuto ${goal.minute}'`}
                          </span>
                        </motion.div>
                        );
                      })}
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
                      <div className="space-y-2" ref={listRef}>
                        {yellowCardsA.map((card, index) => {
                          // Crear una key única usando player_id, minute e index
                          const uniqueKey = `yellow-a-${card.player_id}-${card.minute}-${index}`;
                          return (
                          <motion.div
                            key={uniqueKey}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-700 shadow-sm hover:shadow-md transition-all"
                          >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {getPlayerName(card.player_id, "a")} - Minuto {card.minute}&apos;
                            </span>
                          </motion.div>
                          );
                        })}
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
                      <div className="space-y-2" ref={listRef}>
                        {yellowCardsB.map((card, index) => {
                          // Crear una key única usando player_id, minute e index
                          const uniqueKey = `yellow-b-${card.player_id}-${card.minute}-${index}`;
                          return (
                          <motion.div
                            key={uniqueKey}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-700 shadow-sm hover:shadow-md transition-all"
                          >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {getPlayerName(card.player_id, "b")} - Minuto {card.minute}&apos;
                            </span>
                          </motion.div>
                          );
                        })}
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
                      <div className="space-y-2" ref={listRef}>
                        {redCardsA.map((card, index) => {
                          // Crear una key única usando player_id, minute e index
                          const uniqueKey = `red-a-${card.player_id}-${card.minute}-${index}`;
                          return (
                          <motion.div
                            key={uniqueKey}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-700 shadow-sm hover:shadow-md transition-all"
                          >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {getPlayerName(card.player_id, "a")} - Minuto {card.minute}&apos;
                            </span>
                          </motion.div>
                          );
                        })}
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
                      <div className="space-y-2" ref={listRef}>
                        {redCardsB.map((card, index) => {
                          // Crear una key única usando player_id, minute e index
                          const uniqueKey = `red-b-${card.player_id}-${card.minute}-${index}`;
                          return (
                          <motion.div
                            key={uniqueKey}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-700 shadow-sm hover:shadow-md transition-all"
                          >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {getPlayerName(card.player_id, "b")} - Minuto {card.minute}&apos;
                            </span>
                          </motion.div>
                          );
                        })}
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
      </motion.div>
    </AnimatePresence>
  );
}
