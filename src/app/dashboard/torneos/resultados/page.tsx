// Página para publicar resultados de partidos
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Trophy, Users, Calendar } from "lucide-react";
import { Tournament, Match } from "../types";
import { useResults, MatchResultForm, Player } from "../hooks/useResults";
import { getDisciplineRulesByName } from "../config/disciplineRules";
import { supabase } from "../../../../lib/supabaseClient";

export default function ResultadosPage() {
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const {
    scheduledMatches,
    loading,
    saving,
    loadScheduledMatches,
    loadPlayersForTeam,
    saveMatchResult,
    updateMatchStatus,
  } = useResults(tournament);

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [playersTeamA, setPlayersTeamA] = useState<Player[]>([]);
  const [playersTeamB, setPlayersTeamB] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [resultForm, setResultForm] = useState<MatchResultForm>({
    score_team_a: 0,
    score_team_b: 0,
    goals_team_a: [],
    goals_team_b: [],
    yellow_cards_team_a: [],
    yellow_cards_team_b: [],
    red_cards_team_a: [],
    red_cards_team_b: [],
    sets: [], // Para Vóley: sets individuales con puntajes
  });

  useEffect(() => {
    loadTournament();
  }, []);

  // Los partidos se cargan automáticamente con TanStack Query (caché)
  // No necesitamos llamar loadScheduledMatches manualmente

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

  const handleStartMatch = async (matchId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Deseas comenzar este partido?")) {
      await updateMatchStatus(matchId, "in_progress");
    }
  };

  const handleHalfTime = async (matchId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Deseas pausar el partido para el entretiempo?")) {
      await updateMatchStatus(matchId, "suspended");
    }
  };

  const handleStatusChange = async (matchId: number, newStatus: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    
    // Buscar el partido para verificar su estado actual
    const match = scheduledMatches.find((m: any) => m.id === matchId);
    if (match?.status === "finished") {
      alert("No se puede cambiar el estado de un partido finalizado");
      e.target.value = match.status; // Restaurar el valor anterior
      return;
    }
    
    await updateMatchStatus(matchId, newStatus);
  };

  const handleOpenResultModal = async (match: Match) => {
    // Solo permitir abrir el modal si el partido está en progreso, suspendido o finalizado
    if (match.status !== "in_progress" && match.status !== "suspended" && match.status !== "finished") {
      alert("Debes comenzar el partido antes de publicar resultados");
      return;
    }

    setSelectedMatch(match);
    setLoadingPlayers(true);
    setShowResultModal(true);

    // Cargar jugadores y datos existentes del partido
    const [playersA, playersB, existingResult, existingEvents] = await Promise.all([
      loadPlayersForTeam(match.team_a),
      loadPlayersForTeam(match.team_b),
      supabase
        .from("match_results")
        .select("*")
        .eq("match_id", match.id)
        .single(),
      supabase
        .from("match_events")
        .select("*")
        .eq("match_id", match.id),
    ]);

    setPlayersTeamA(playersA);
    setPlayersTeamB(playersB);

    // Cargar datos existentes si hay
    const result = existingResult.data;
    const events = existingEvents.data || [];

    // Separar eventos por tipo
    const goalsA: Array<{ player_id: number; minute: number }> = [];
    const goalsB: Array<{ player_id: number; minute: number }> = [];
    const yellowCardsA: Array<{ player_id: number; minute: number }> = [];
    const yellowCardsB: Array<{ player_id: number; minute: number }> = [];
    const redCardsA: Array<{ player_id: number; minute: number }> = [];
    const redCardsB: Array<{ player_id: number; minute: number }> = [];
    const sets: Array<{ set_number: number; score_team_a: number; score_team_b: number }> = [];

    events.forEach((event: any) => {
      if (event.event_type === "goal") {
        if (event.team_id === match.team_a) {
          goalsA.push({ player_id: event.player_id, minute: event.value });
        } else {
          goalsB.push({ player_id: event.player_id, minute: event.value });
        }
      } else if (event.event_type === "yellow_card") {
        if (event.team_id === match.team_a) {
          yellowCardsA.push({ player_id: event.player_id, minute: event.value });
        } else {
          yellowCardsB.push({ player_id: event.player_id, minute: event.value });
        }
      } else if (event.event_type === "red_card") {
        if (event.team_id === match.team_a) {
          redCardsA.push({ player_id: event.player_id, minute: event.value });
        } else {
          redCardsB.push({ player_id: event.player_id, minute: event.value });
        }
      } else if (event.event_type?.startsWith("set_") && event.event_type?.includes("_team_")) {
        // Cargar sets desde eventos separados (set_N_team_a y set_N_team_b)
        // event_type: "set_N_team_a" o "set_N_team_b", value = score
        const match = event.event_type.match(/set_(\d+)_team_(a|b)/);
        if (match) {
          const setNumber = parseInt(match[1]);
          const team = match[2]; // 'a' o 'b'
          const existingSet = sets.find(s => s.set_number === setNumber);
          
          if (team === "a") {
            if (existingSet) {
              existingSet.score_team_a = event.value || 0;
            } else {
              sets.push({
                set_number: setNumber,
                score_team_a: event.value || 0,
                score_team_b: 0,
              });
            }
          } else if (team === "b") {
            if (existingSet) {
              existingSet.score_team_b = event.value || 0;
            } else {
              sets.push({
                set_number: setNumber,
                score_team_a: 0,
                score_team_b: event.value || 0,
              });
            }
          }
        }
      }
    });

    // Ordenar sets por número
    sets.sort((a, b) => a.set_number - b.set_number);

    setResultForm({
      score_team_a: result?.score_team_a || 0,
      score_team_b: result?.score_team_b || 0,
      goals_team_a: goalsA,
      goals_team_b: goalsB,
      yellow_cards_team_a: yellowCardsA,
      yellow_cards_team_b: yellowCardsB,
      red_cards_team_a: redCardsA,
      red_cards_team_b: redCardsB,
      sets: sets,
    });

    setLoadingPlayers(false);
  };

  const [showGoalForm, setShowGoalForm] = useState<{ team: "a" | "b" | null; playerId: string; minute: string }>({
    team: null,
    playerId: "",
    minute: "",
  });

  const handleAddGoal = (team: "a" | "b", playerId: number, minute: number) => {
    if (selectedMatch?.status === "finished") {
      alert("No se pueden agregar goles a un partido finalizado");
      return;
    }
    if (team === "a") {
      setResultForm({
        ...resultForm,
        goals_team_a: [...resultForm.goals_team_a, { player_id: playerId, minute }],
        score_team_a: resultForm.score_team_a + 1,
      });
    } else {
      setResultForm({
        ...resultForm,
        goals_team_b: [...resultForm.goals_team_b, { player_id: playerId, minute }],
        score_team_b: resultForm.score_team_b + 1,
      });
    }
    setShowGoalForm({ team: null, playerId: "", minute: "" });
  };

  const handleOpenGoalForm = (team: "a" | "b") => {
    if (selectedMatch?.status === "finished") {
      alert("No se pueden agregar goles a un partido finalizado");
      return;
    }
    setShowGoalForm({ team, playerId: "", minute: "" });
  };

  const handleRemoveGoal = (team: "a" | "b", index: number) => {
    if (selectedMatch?.status === "finished") {
      alert("No se pueden eliminar goles de un partido finalizado");
      return;
    }
    if (team === "a") {
      const newGoals = resultForm.goals_team_a.filter((_, i) => i !== index);
      setResultForm({
        ...resultForm,
        goals_team_a: newGoals,
        score_team_a: newGoals.length,
      });
    } else {
      const newGoals = resultForm.goals_team_b.filter((_, i) => i !== index);
      setResultForm({
        ...resultForm,
        goals_team_b: newGoals,
        score_team_b: newGoals.length,
      });
    }
  };

  const [showCardForm, setShowCardForm] = useState<{ team: "a" | "b" | null; type: "yellow" | "red" | null; playerId: string; minute: string }>({
    team: null,
    type: null,
    playerId: "",
    minute: "",
  });

  const handleOpenCardForm = (team: "a" | "b", type: "yellow" | "red") => {
    if (selectedMatch?.status === "finished") {
      alert("No se pueden agregar tarjetas a un partido finalizado");
      return;
    }
    setShowCardForm({ team, type, playerId: "", minute: "" });
  };

  const handleAddCard = (team: "a" | "b", type: "yellow" | "red", playerId: number, minute: number) => {
    if (selectedMatch?.status === "finished") {
      alert("No se pueden agregar tarjetas a un partido finalizado");
      return;
    }
    if (type === "yellow") {
      if (team === "a") {
        setResultForm({
          ...resultForm,
          yellow_cards_team_a: [...resultForm.yellow_cards_team_a, { player_id: playerId, minute }],
        });
      } else {
        setResultForm({
          ...resultForm,
          yellow_cards_team_b: [...resultForm.yellow_cards_team_b, { player_id: playerId, minute }],
        });
      }
    } else {
      if (team === "a") {
        setResultForm({
          ...resultForm,
          red_cards_team_a: [...resultForm.red_cards_team_a, { player_id: playerId, minute }],
        });
      } else {
        setResultForm({
          ...resultForm,
          red_cards_team_b: [...resultForm.red_cards_team_b, { player_id: playerId, minute }],
        });
      }
    }
  };

  const handleRemoveCard = (team: "a" | "b", type: "yellow" | "red", index: number) => {
    if (selectedMatch?.status === "finished") {
      alert("No se pueden eliminar tarjetas de un partido finalizado");
      return;
    }
    if (type === "yellow") {
      if (team === "a") {
        setResultForm({
          ...resultForm,
          yellow_cards_team_a: resultForm.yellow_cards_team_a.filter((_, i) => i !== index),
        });
      } else {
        setResultForm({
          ...resultForm,
          yellow_cards_team_b: resultForm.yellow_cards_team_b.filter((_, i) => i !== index),
        });
      }
    } else {
      if (team === "a") {
        setResultForm({
          ...resultForm,
          red_cards_team_a: resultForm.red_cards_team_a.filter((_, i) => i !== index),
        });
      } else {
        setResultForm({
          ...resultForm,
          red_cards_team_b: resultForm.red_cards_team_b.filter((_, i) => i !== index),
        });
      }
    }
  };

  const handleSaveResult = async () => {
    if (!selectedMatch) return;
    
    if (selectedMatch.status === "finished") {
      alert("No se pueden modificar los resultados de un partido finalizado");
      return;
    }

    const success = await saveMatchResult(selectedMatch.id, resultForm);
    if (success) {
      setShowResultModal(false);
      setSelectedMatch(null);
    }
  };

  const getPlayerName = (playerId: number, team: "a" | "b") => {
    const players = team === "a" ? playersTeamA : playersTeamB;
    const player = players.find((p) => p.id === playerId);
    return player ? player.full_name : "Jugador desconocido";
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
              Publicar Resultados
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ingresa los resultados, goles y tarjetas de los partidos programados
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
        </div>
      )}

      {/* Lista de partidos programados */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando partidos...</p>
        </div>
      ) : scheduledMatches.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
          <Trophy className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No hay partidos programados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduledMatches.map((match: any) => {
            const scheduledDate = match.scheduled_at ? new Date(match.scheduled_at) : null;
            return (
              <div
                key={match.id}
                className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-3">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {match.teams?.name || "Equipo A"} vs {match.teams1?.name || "Equipo B"}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {scheduledDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {scheduledDate.toLocaleDateString("es-ES", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            {scheduledDate.toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Disciplina:</span>
                        <span>{match.sportName || "Sin disciplina"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Género:</span>
                        <span className="capitalize">{match.genero || "No asignado"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Asistente:</span>
                        <span>{match.assistantName || "Sin asignar"}</span>
                      </div>
                      {match.refereeName && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Árbitro:</span>
                          <span>{match.refereeName}</span>
                        </div>
                      )}
                      {match.field && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Cancha:</span>
                          <span>{match.field}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Controles de estado del partido */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {match.status === "scheduled" || match.status === "pending" ? (
                        <button
                          onClick={(e) => handleStartMatch(match.id, e)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                        >
                          Comenzar Partido
                        </button>
                      ) : match.status === "in_progress" || match.status === "suspended" ? (
                        <>
                          {match.status === "in_progress" && (
                            <button
                              onClick={(e) => handleHalfTime(match.id, e)}
                              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm whitespace-nowrap"
                            >
                              Entretiempo
                            </button>
                          )}
                          {match.status === "suspended" && (
                            <button
                              onClick={(e) => handleStartMatch(match.id, e)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                            >
                              Reanudar Partido
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenResultModal(match)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                          >
                            Publicar Resultado
                          </button>
                        </>
                      ) : match.status === "finished" ? (
                        <button
                          onClick={() => handleOpenResultModal(match)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm whitespace-nowrap"
                        >
                          Ver Resultado
                        </button>
                      ) : null}
                      
                      {/* Select para cambiar estado manualmente */}
                      <select
                        value={match.status || "scheduled"}
                        onChange={(e) => handleStatusChange(match.id, e.target.value, e)}
                        disabled={match.status === "finished"}
                        className={`px-3 py-2 border rounded-lg text-sm ${
                          match.status === "finished"
                            ? "border-gray-400 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            : "border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        title={match.status === "finished" ? "No se puede cambiar el estado de un partido finalizado" : ""}
                      >
                        <option value="scheduled">Programado</option>
                        <option value="in_progress">En Curso</option>
                        <option value="suspended">Suspendido/Entretiempo</option>
                        <option value="finished">Finalizado</option>
                        <option value="postponed">Aplazado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para ingresar resultados */}
      {showResultModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Publicar Resultado
                </h2>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Información del partido */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedMatch.teams?.name || "Equipo A"} vs {selectedMatch.teams1?.name || "Equipo B"}
                </h3>
                {selectedMatch.scheduled_at && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(selectedMatch.scheduled_at).toLocaleString("es-ES")}
                  </p>
                )}
              </div>

              {loadingPlayers ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando jugadores...</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const isFinished = selectedMatch.status === "finished";
                    // Obtener reglas de la disciplina
                    const disciplineRules = selectedMatch.sportName 
                      ? getDisciplineRulesByName(selectedMatch.sportName)
                      : null;
                    const usesCards = disciplineRules?.usesCards || false;
                    const usesSets = disciplineRules?.usesSets || false;
                    const metricName = disciplineRules?.metricName || "goles";
                    
                    // Determinar el nombre de la métrica a mostrar
                    const scoreLabel = usesSets 
                      ? "Sets" 
                      : metricName === "puntos" 
                        ? "Puntos" 
                        : "Goles";
                    
                    return (
                      <>
                        {/* Resultado del partido */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                            {usesSets ? "Sets Ganados" : "Resultado"}
                          </h3>
                          <div className="grid grid-cols-3 gap-4 items-center">
                            <div className="text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {selectedMatch.teams?.name || "Equipo A"}
                              </p>
                              {isFinished ? (
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                  {resultForm.score_team_a}
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  max={usesSets ? 3 : undefined}
                                  value={resultForm.score_team_a}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    setResultForm({
                                      ...resultForm,
                                      score_team_a: value,
                                    });
                                  }}
                                  className="text-3xl font-bold text-center w-20 mx-auto px-2 py-1 border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                />
                              )}
                            </div>
                            <div className="text-center text-gray-400">vs</div>
                            <div className="text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {selectedMatch.teams1?.name || "Equipo B"}
                              </p>
                              {isFinished ? (
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                  {resultForm.score_team_b}
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  max={usesSets ? 3 : undefined}
                                  value={resultForm.score_team_b}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    setResultForm({
                                      ...resultForm,
                                      score_team_b: value,
                                    });
                                  }}
                                  className="text-3xl font-bold text-center w-20 mx-auto px-2 py-1 border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                />
                              )}
                            </div>
                          </div>
                          {usesSets && !isFinished && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                              {selectedMatch.sportName?.toLowerCase().includes("voley") || selectedMatch.sportName?.toLowerCase().includes("volleyball")
                                ? "Los sets ganados se calculan automáticamente según los sets individuales agregados abajo"
                                : selectedMatch.sportName?.toLowerCase().includes("padel")
                                ? "Los sets ganados se calculan automáticamente. Cada set se gana con 6 juegos (diferencia de 2), o 7-5 si hay empate 5-5, o tie-break si hay empate 6-6."
                                : "Los sets ganados se calculan automáticamente según los sets individuales agregados abajo"}
                            </p>
                          )}
                          {isFinished && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
                              Partido finalizado - No se pueden agregar más eventos
                            </p>
                          )}
                        </div>

                  {/* Sets Individuales - Solo para Vóley */}
                  {usesSets && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Sets Individuales
                      </h3>
                      {!isFinished && (
                        <button
                          onClick={() => {
                            const newSetNumber = resultForm.sets.length + 1;
                            setResultForm({
                              ...resultForm,
                              sets: [
                                ...resultForm.sets,
                                { set_number: newSetNumber, score_team_a: 0, score_team_b: 0 },
                              ],
                            });
                          }}
                          className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          + Agregar Set
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {resultForm.sets.map((set, index) => {
                        // Validar reglas según la disciplina
                        const isValidSet = (scoreA: number, scoreB: number, isPadel: boolean) => {
                          if (isPadel) {
                            // Reglas del Pádel: juegos, no puntos
                            // Para ganar un set: 6 juegos con diferencia de 2
                            // Si llega 5-5, se juega hasta 7-5
                            // Si llega 6-6, se juega tie-break a 7 puntos (con diferencia de 2)
                            
                            // Caso normal: 6 juegos con diferencia de 2 (y el oponente tiene menos de 5)
                            if (scoreA >= 6 && scoreA - scoreB >= 2 && scoreB <= 4) return { valid: true, winner: 'a' };
                            if (scoreB >= 6 && scoreB - scoreA >= 2 && scoreA <= 4) return { valid: true, winner: 'b' };
                            
                            // Caso 5-5: se juega hasta 7-5
                            if (scoreA === 7 && scoreB === 5) return { valid: true, winner: 'a' };
                            if (scoreB === 7 && scoreA === 5) return { valid: true, winner: 'b' };
                            
                            // Caso 6-6: tie-break a 7 puntos (con diferencia de 2)
                            // Cuando ambos tienen 6 juegos, los valores ingresados representan puntos del tie-break
                            // Si uno tiene 7 o más puntos en el tie-break con diferencia de 2, gana el set
                            if (scoreA === 6 && scoreB === 6) {
                              // Ambos tienen 6 juegos, están en tie-break
                              // Los valores ahora representan puntos del tie-break
                              // Tie-break se gana con 7 puntos y diferencia de 2
                              if (scoreA >= 7 && scoreA - scoreB >= 2) return { valid: true, winner: 'a' };
                              if (scoreB >= 7 && scoreB - scoreA >= 2) return { valid: true, winner: 'b' };
                              // Si aún no hay ganador, están en tie-break
                              return { valid: false, winner: null, needsTiebreak: true };
                            }
                            
                            // Si uno tiene 7 o más y el otro tiene 6, podría ser tie-break ganado
                            // Pero solo si ambos pasaron por 6-6, así que verificamos si ambos tienen >= 6
                            if (scoreA >= 7 && scoreB >= 6 && scoreA - scoreB >= 2) return { valid: true, winner: 'a' };
                            if (scoreB >= 7 && scoreA >= 6 && scoreB - scoreA >= 2) return { valid: true, winner: 'b' };
                            
                            return { valid: false, winner: null };
                          } else {
                            // Reglas del Voleibol: mínimo 25 puntos con ventaja de 2
                            if (scoreA >= 25 && scoreA - scoreB >= 2) return { valid: true, winner: 'a' };
                            if (scoreB >= 25 && scoreB - scoreA >= 2) return { valid: true, winner: 'b' };
                            if (scoreA >= 24 && scoreB >= 24) {
                              // En caso de empate 24-24 o más, se necesita ventaja de 2
                              if (scoreA - scoreB >= 2) return { valid: true, winner: 'a' };
                              if (scoreB - scoreA >= 2) return { valid: true, winner: 'b' };
                            }
                            return { valid: false, winner: null };
                          }
                        };

                        const isPadel = selectedMatch.sportName?.toLowerCase().includes("padel") || false;
                        const setValidation = isValidSet(set.score_team_a, set.score_team_b, isPadel);
                        const teamAWon = setValidation.valid && setValidation.winner === 'a';
                        const teamBWon = setValidation.valid && setValidation.winner === 'b';
                        const setFinished = setValidation.valid;
                        
                        return (
                          <div key={index} className={`p-3 rounded border ${
                            setFinished 
                              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                              : 'bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  Set {set.set_number}
                                </span>
                                {setFinished && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                    ✓ Set ganado
                                  </span>
                                )}
                                {!setFinished && set.score_team_a > 0 && set.score_team_b > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                                    En progreso
                                  </span>
                                )}
                              </div>
                              {!isFinished && (
                                <button
                                  onClick={() => {
                                    const newSets = resultForm.sets.filter((_, i) => i !== index);
                                    // Recalcular sets ganados usando validación según disciplina
                                    const setsWonA = newSets.filter(s => {
                                      const validation = isValidSet(s.score_team_a, s.score_team_b, isPadel);
                                      return validation.valid && validation.winner === 'a';
                                    }).length;
                                    const setsWonB = newSets.filter(s => {
                                      const validation = isValidSet(s.score_team_a, s.score_team_b, isPadel);
                                      return validation.valid && validation.winner === 'b';
                                    }).length;
                                    setResultForm({
                                      ...resultForm,
                                      sets: newSets,
                                      score_team_a: setsWonA,
                                      score_team_b: setsWonB,
                                    });
                                  }}
                                  className="text-sm text-red-600 hover:text-red-700"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-3 items-center">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  {selectedMatch.teams?.name || "Equipo A"} <span className="text-gray-500">({isPadel ? "Juegos" : "Puntos"})</span>
                                </label>
                                {isFinished ? (
                                  <div className={`text-lg font-bold ${teamAWon ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                    {set.score_team_a}
                                    {teamAWon && <span className="ml-1 text-xs">✓</span>}
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={set.score_team_a || ""}
                                    onChange={(e) => {
                                      const newScore = parseInt(e.target.value) || 0;
                                      const newSets = [...resultForm.sets];
                                      newSets[index] = { ...set, score_team_a: newScore };
                                      // Recalcular sets ganados usando validación según disciplina
                                      const isValidSetRecalc = (scoreA: number, scoreB: number, isPadel: boolean) => {
                                        if (isPadel) {
                                          if (scoreA >= 6 && scoreA - scoreB >= 2 && scoreB < 5) return { valid: true, winner: 'a' };
                                          if (scoreB >= 6 && scoreB - scoreA >= 2 && scoreA < 5) return { valid: true, winner: 'b' };
                                          if (scoreA === 7 && scoreB === 5) return { valid: true, winner: 'a' };
                                          if (scoreB === 7 && scoreA === 5) return { valid: true, winner: 'b' };
                                          if (scoreA >= 7 && scoreA - scoreB >= 2) return { valid: true, winner: 'a' };
                                          if (scoreB >= 7 && scoreB - scoreA >= 2) return { valid: true, winner: 'b' };
                                          return { valid: false, winner: null };
                                        } else {
                                          if (scoreA >= 25 && scoreA - scoreB >= 2) return { valid: true, winner: 'a' };
                                          if (scoreB >= 25 && scoreB - scoreA >= 2) return { valid: true, winner: 'b' };
                                          if (scoreA >= 24 && scoreB >= 24) {
                                            if (scoreA - scoreB >= 2) return { valid: true, winner: 'a' };
                                            if (scoreB - scoreA >= 2) return { valid: true, winner: 'b' };
                                          }
                                          return { valid: false, winner: null };
                                        }
                                      };
                                      const setsWonA = newSets.filter(s => {
                                        const validation = isValidSetRecalc(s.score_team_a, s.score_team_b, isPadel);
                                        return validation.valid && validation.winner === 'a';
                                      }).length;
                                      const setsWonB = newSets.filter(s => {
                                        const validation = isValidSetRecalc(s.score_team_a, s.score_team_b, isPadel);
                                        return validation.valid && validation.winner === 'b';
                                      }).length;
                                      setResultForm({
                                        ...resultForm,
                                        sets: newSets,
                                        score_team_a: setsWonA,
                                        score_team_b: setsWonB,
                                      });
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-gray-900 dark:text-white text-center"
                                  />
                                )}
                              </div>
                              <div className="text-center text-gray-400 font-bold">-</div>
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  {selectedMatch.teams1?.name || "Equipo B"} <span className="text-gray-500">({isPadel ? "Juegos" : "Puntos"})</span>
                                </label>
                                {isFinished ? (
                                  <div className={`text-lg font-bold ${teamBWon ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                    {set.score_team_b}
                                    {teamBWon && <span className="ml-1 text-xs">✓</span>}
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={set.score_team_b || ""}
                                    onChange={(e) => {
                                      const newScore = parseInt(e.target.value) || 0;
                                      const newSets = [...resultForm.sets];
                                      newSets[index] = { ...set, score_team_b: newScore };
                                      // Recalcular sets ganados usando validación según disciplina
                                      const isValidSetRecalc = (scoreA: number, scoreB: number, isPadel: boolean) => {
                                        if (isPadel) {
                                          if (scoreA >= 6 && scoreA - scoreB >= 2 && scoreB < 5) return { valid: true, winner: 'a' };
                                          if (scoreB >= 6 && scoreB - scoreA >= 2 && scoreA < 5) return { valid: true, winner: 'b' };
                                          if (scoreA === 7 && scoreB === 5) return { valid: true, winner: 'a' };
                                          if (scoreB === 7 && scoreA === 5) return { valid: true, winner: 'b' };
                                          if (scoreA >= 7 && scoreA - scoreB >= 2) return { valid: true, winner: 'a' };
                                          if (scoreB >= 7 && scoreB - scoreA >= 2) return { valid: true, winner: 'b' };
                                          return { valid: false, winner: null };
                                        } else {
                                          if (scoreA >= 25 && scoreA - scoreB >= 2) return { valid: true, winner: 'a' };
                                          if (scoreB >= 25 && scoreB - scoreA >= 2) return { valid: true, winner: 'b' };
                                          if (scoreA >= 24 && scoreB >= 24) {
                                            if (scoreA - scoreB >= 2) return { valid: true, winner: 'a' };
                                            if (scoreB - scoreA >= 2) return { valid: true, winner: 'b' };
                                          }
                                          return { valid: false, winner: null };
                                        }
                                      };
                                      const setsWonA = newSets.filter(s => {
                                        const validation = isValidSetRecalc(s.score_team_a, s.score_team_b, isPadel);
                                        return validation.valid && validation.winner === 'a';
                                      }).length;
                                      const setsWonB = newSets.filter(s => {
                                        const validation = isValidSetRecalc(s.score_team_a, s.score_team_b, isPadel);
                                        return validation.valid && validation.winner === 'b';
                                      }).length;
                                      setResultForm({
                                        ...resultForm,
                                        sets: newSets,
                                        score_team_a: setsWonA,
                                        score_team_b: setsWonB,
                                      });
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-gray-900 dark:text-white text-center"
                                  />
                                )}
                              </div>
                            </div>
                            {!isFinished && setValidation.valid && (
                              <div className="mt-2">
                                <p className="text-xs text-green-600 dark:text-green-400 text-center font-medium">
                                  ✓ Set ganado: {teamAWon ? selectedMatch.teams?.name : selectedMatch.teams1?.name} ({set.score_team_a > set.score_team_b ? set.score_team_a : set.score_team_b} {isPadel ? "juegos" : "puntos"} con ventaja de 2)
                                </p>
                              </div>
                            )}
                            {!isFinished && !setValidation.valid && set.score_team_a > 0 && set.score_team_b > 0 && (
                              <div className="mt-2">
                                {isPadel ? (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    {set.score_team_a === 6 && set.score_team_b === 6 
                                      ? "Empate 6-6: Ingresa puntos del tie-break (mínimo 7 con diferencia de 2)"
                                      : (set.score_team_a === 5 && set.score_team_b === 5) || (set.score_team_a === 6 && set.score_team_b === 5) || (set.score_team_a === 5 && set.score_team_b === 6)
                                      ? "Empate 5-5: Se juega hasta 7-5"
                                      : "Para ganar: 6 juegos con diferencia de 2"}
                                  </p>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {resultForm.sets.length === 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          <p>No hay sets registrados. Haz clic en "+ Agregar Set" para comenzar.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Goles/Puntos del Equipo A - Solo mostrar si no es vóley ni pádel */}
                  {!usesSets && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {scoreLabel} - {selectedMatch.teams?.name || "Equipo A"}
                      </h3>
                      <button
                        onClick={() => handleOpenGoalForm("a")}
                        disabled={isFinished}
                        className={`px-3 py-1 text-sm rounded ${
                          isFinished
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        + Agregar {scoreLabel === "Puntos" ? "Punto" : "Gol"}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {resultForm.goals_team_a.map((goal, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-800 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {getPlayerName(goal.player_id, "a")} - Minuto {goal.minute}'
                          </span>
                          <button
                            onClick={() => handleRemoveGoal("a", index)}
                            disabled={isFinished}
                            className={`text-sm ${
                              isFinished
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-700"
                            }`}
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                      {resultForm.goals_team_a.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                          No hay {scoreLabel.toLowerCase()} registrados
                        </p>
                      )}
                      {showGoalForm.team === "a" && !isFinished && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Jugador
                              </label>
                              <select
                                value={showGoalForm.playerId}
                                onChange={(e) => setShowGoalForm({ ...showGoalForm, playerId: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                              >
                                <option value="">Seleccionar...</option>
                                {playersTeamA.map((player) => (
                                  <option key={player.id} value={player.id}>
                                    {player.jersey_number ? `#${player.jersey_number} - ` : ""}{player.full_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Minuto
                              </label>
                              <input
                                type="number"
                                value={showGoalForm.minute}
                                onChange={(e) => setShowGoalForm({ ...showGoalForm, minute: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                placeholder="Minuto"
                                min="1"
                                max="120"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (showGoalForm.playerId && showGoalForm.minute) {
                                  handleAddGoal("a", parseInt(showGoalForm.playerId), parseInt(showGoalForm.minute));
                                }
                              }}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Agregar
                            </button>
                            <button
                              onClick={() => setShowGoalForm({ team: null, playerId: "", minute: "" })}
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Goles/Puntos del Equipo B - Solo mostrar si no es vóley */}
                  {!usesSets && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {scoreLabel} - {selectedMatch.teams1?.name || "Equipo B"}
                      </h3>
                      <button
                        onClick={() => handleOpenGoalForm("b")}
                        disabled={isFinished}
                        className={`px-3 py-1 text-sm rounded ${
                          isFinished
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        + Agregar {scoreLabel === "Puntos" ? "Punto" : "Gol"}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {resultForm.goals_team_b.map((goal, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-800 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {getPlayerName(goal.player_id, "b")} - Minuto {goal.minute}'
                          </span>
                          <button
                            onClick={() => handleRemoveGoal("b", index)}
                            disabled={isFinished}
                            className={`text-sm ${
                              isFinished
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-700"
                            }`}
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                      {resultForm.goals_team_b.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                          No hay {scoreLabel.toLowerCase()} registrados
                        </p>
                      )}
                      {showGoalForm.team === "b" && !isFinished && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Jugador
                              </label>
                              <select
                                value={showGoalForm.playerId}
                                onChange={(e) => setShowGoalForm({ ...showGoalForm, playerId: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                              >
                                <option value="">Seleccionar...</option>
                                {playersTeamB.map((player) => (
                                  <option key={player.id} value={player.id}>
                                    {player.jersey_number ? `#${player.jersey_number} - ` : ""}{player.full_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Minuto
                              </label>
                              <input
                                type="number"
                                value={showGoalForm.minute}
                                onChange={(e) => setShowGoalForm({ ...showGoalForm, minute: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                placeholder="Minuto"
                                min="1"
                                max="120"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (showGoalForm.playerId && showGoalForm.minute) {
                                  handleAddGoal("b", parseInt(showGoalForm.playerId), parseInt(showGoalForm.minute));
                                }
                              }}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Agregar
                            </button>
                            <button
                              onClick={() => setShowGoalForm({ team: null, playerId: "", minute: "" })}
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Tarjetas Amarillas Equipo A - Solo mostrar si la disciplina usa tarjetas */}
                  {usesCards && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-4 h-4 bg-yellow-500 rounded"></span>
                        Tarjetas Amarillas - {selectedMatch.teams?.name || "Equipo A"}
                      </h3>
                      <button
                        onClick={() => handleOpenCardForm("a", "yellow")}
                        disabled={isFinished}
                        className={`px-3 py-1 text-sm rounded ${
                          isFinished
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : "bg-yellow-600 text-white hover:bg-yellow-700"
                        }`}
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {resultForm.yellow_cards_team_a.map((card, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-800 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {getPlayerName(card.player_id, "a")} - Minuto {card.minute}'
                          </span>
                          <button
                            onClick={() => handleRemoveCard("a", "yellow", index)}
                            disabled={isFinished}
                            className={`text-sm ${
                              isFinished
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-700"
                            }`}
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                      {resultForm.yellow_cards_team_a.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                          No hay tarjetas amarillas registradas
                        </p>
                      )}
                      {showCardForm.team === "a" && showCardForm.type === "yellow" && !isFinished && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Jugador
                              </label>
                              <select
                                value={showCardForm.playerId}
                                onChange={(e) => setShowCardForm({ ...showCardForm, playerId: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                              >
                                <option value="">Seleccionar...</option>
                                {playersTeamA.map((player) => (
                                  <option key={player.id} value={player.id}>
                                    {player.jersey_number ? `#${player.jersey_number} - ` : ""}{player.full_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Minuto
                              </label>
                              <input
                                type="number"
                                value={showCardForm.minute}
                                onChange={(e) => setShowCardForm({ ...showCardForm, minute: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                placeholder="Minuto"
                                min="1"
                                max="120"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (showCardForm.playerId && showCardForm.minute) {
                                  handleAddCard("a", "yellow", parseInt(showCardForm.playerId), parseInt(showCardForm.minute));
                                }
                              }}
                              className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            >
                              Agregar
                            </button>
                            <button
                              onClick={() => setShowCardForm({ team: null, type: null, playerId: "", minute: "" })}
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Tarjetas Amarillas Equipo B - Solo mostrar si la disciplina usa tarjetas */}
                  {usesCards && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-4 h-4 bg-yellow-500 rounded"></span>
                        Tarjetas Amarillas - {selectedMatch.teams1?.name || "Equipo B"}
                      </h3>
                      <button
                        onClick={() => handleOpenCardForm("b", "yellow")}
                        disabled={isFinished}
                        className={`px-3 py-1 text-sm rounded ${
                          isFinished
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : "bg-yellow-600 text-white hover:bg-yellow-700"
                        }`}
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {resultForm.yellow_cards_team_b.map((card, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-800 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {getPlayerName(card.player_id, "b")} - Minuto {card.minute}'
                          </span>
                          <button
                            onClick={() => handleRemoveCard("b", "yellow", index)}
                            disabled={isFinished}
                            className={`text-sm ${
                              isFinished
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-700"
                            }`}
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                      {resultForm.yellow_cards_team_b.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                          No hay tarjetas amarillas registradas
                        </p>
                      )}
                      {showCardForm.team === "b" && showCardForm.type === "yellow" && !isFinished && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Jugador
                              </label>
                              <select
                                value={showCardForm.playerId}
                                onChange={(e) => setShowCardForm({ ...showCardForm, playerId: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                              >
                                <option value="">Seleccionar...</option>
                                {playersTeamB.map((player) => (
                                  <option key={player.id} value={player.id}>
                                    {player.jersey_number ? `#${player.jersey_number} - ` : ""}{player.full_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Minuto
                              </label>
                              <input
                                type="number"
                                value={showCardForm.minute}
                                onChange={(e) => setShowCardForm({ ...showCardForm, minute: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                placeholder="Minuto"
                                min="1"
                                max="120"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (showCardForm.playerId && showCardForm.minute) {
                                  handleAddCard("b", "yellow", parseInt(showCardForm.playerId), parseInt(showCardForm.minute));
                                }
                              }}
                              className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            >
                              Agregar
                            </button>
                            <button
                              onClick={() => setShowCardForm({ team: null, type: null, playerId: "", minute: "" })}
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Tarjetas Rojas Equipo A - Solo mostrar si la disciplina usa tarjetas */}
                  {usesCards && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-4 h-4 bg-red-500 rounded"></span>
                        Tarjetas Rojas - {selectedMatch.teams?.name || "Equipo A"}
                      </h3>
                      <button
                        onClick={() => handleOpenCardForm("a", "red")}
                        disabled={isFinished}
                        className={`px-3 py-1 text-sm rounded ${
                          isFinished
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {resultForm.red_cards_team_a.map((card, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-800 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {getPlayerName(card.player_id, "a")} - Minuto {card.minute}'
                          </span>
                          <button
                            onClick={() => handleRemoveCard("a", "red", index)}
                            disabled={isFinished}
                            className={`text-sm ${
                              isFinished
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-700"
                            }`}
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                      {resultForm.red_cards_team_a.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                          No hay tarjetas rojas registradas
                        </p>
                      )}
                      {showCardForm.team === "a" && showCardForm.type === "red" && !isFinished && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Jugador
                              </label>
                              <select
                                value={showCardForm.playerId}
                                onChange={(e) => setShowCardForm({ ...showCardForm, playerId: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                              >
                                <option value="">Seleccionar...</option>
                                {playersTeamA.map((player) => (
                                  <option key={player.id} value={player.id}>
                                    {player.jersey_number ? `#${player.jersey_number} - ` : ""}{player.full_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Minuto
                              </label>
                              <input
                                type="number"
                                value={showCardForm.minute}
                                onChange={(e) => setShowCardForm({ ...showCardForm, minute: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                placeholder="Minuto"
                                min="1"
                                max="120"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (showCardForm.playerId && showCardForm.minute) {
                                  handleAddCard("a", "red", parseInt(showCardForm.playerId), parseInt(showCardForm.minute));
                                }
                              }}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Agregar
                            </button>
                            <button
                              onClick={() => setShowCardForm({ team: null, type: null, playerId: "", minute: "" })}
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Tarjetas Rojas Equipo B - Solo mostrar si la disciplina usa tarjetas */}
                  {usesCards && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-4 h-4 bg-red-500 rounded"></span>
                        Tarjetas Rojas - {selectedMatch.teams1?.name || "Equipo B"}
                      </h3>
                      <button
                        onClick={() => handleOpenCardForm("b", "red")}
                        disabled={isFinished}
                        className={`px-3 py-1 text-sm rounded ${
                          isFinished
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {resultForm.red_cards_team_b.map((card, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-800 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {getPlayerName(card.player_id, "b")} - Minuto {card.minute}'
                          </span>
                          <button
                            onClick={() => handleRemoveCard("b", "red", index)}
                            disabled={isFinished}
                            className={`text-sm ${
                              isFinished
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-700"
                            }`}
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                      {resultForm.red_cards_team_b.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                          No hay tarjetas rojas registradas
                        </p>
                      )}
                      {showCardForm.team === "b" && showCardForm.type === "red" && !isFinished && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Jugador
                              </label>
                              <select
                                value={showCardForm.playerId}
                                onChange={(e) => setShowCardForm({ ...showCardForm, playerId: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                              >
                                <option value="">Seleccionar...</option>
                                {playersTeamB.map((player) => (
                                  <option key={player.id} value={player.id}>
                                    {player.jersey_number ? `#${player.jersey_number} - ` : ""}{player.full_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Minuto
                              </label>
                              <input
                                type="number"
                                value={showCardForm.minute}
                                onChange={(e) => setShowCardForm({ ...showCardForm, minute: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                placeholder="Minuto"
                                min="1"
                                max="120"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (showCardForm.playerId && showCardForm.minute) {
                                  handleAddCard("b", "red", parseInt(showCardForm.playerId), parseInt(showCardForm.minute));
                                }
                              }}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Agregar
                            </button>
                            <button
                              onClick={() => setShowCardForm({ team: null, type: null, playerId: "", minute: "" })}
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
                    <button
                      onClick={() => setShowResultModal(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveResult}
                      disabled={saving || isFinished}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isFinished
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {saving ? "Guardando..." : isFinished ? "Resultado Finalizado" : "Guardar Resultado"}
                    </button>
                  </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

