// Página para publicar resultados de partidos
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Trophy, Users, Calendar } from "lucide-react";
import { Tournament, Match } from "../types";
import { useResults, MatchResultForm, Player } from "../hooks/useResults";
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
  });

  useEffect(() => {
    loadTournament();
  }, []);

  useEffect(() => {
    if (tournament && tournament.id > 0) {
      console.log("Cargando partidos para torneo:", tournament.id, tournament.name);
      loadScheduledMatches();
    } else {
      console.log("No se puede cargar partidos - torneo:", tournament);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleOpenResultModal = async (match: Match) => {
    setSelectedMatch(match);
    setResultForm({
      score_team_a: 0,
      score_team_b: 0,
      goals_team_a: [],
      goals_team_b: [],
      yellow_cards_team_a: [],
      yellow_cards_team_b: [],
      red_cards_team_a: [],
      red_cards_team_b: [],
    });
    setLoadingPlayers(true);
    setShowResultModal(true);

    // Cargar jugadores de ambos equipos
    const [playersA, playersB] = await Promise.all([
      loadPlayersForTeam(match.team_a),
      loadPlayersForTeam(match.team_b),
    ]);

    setPlayersTeamA(playersA);
    setPlayersTeamB(playersB);
    setLoadingPlayers(false);
  };

  const [showGoalForm, setShowGoalForm] = useState<{ team: "a" | "b" | null; playerId: string; minute: string }>({
    team: null,
    playerId: "",
    minute: "",
  });

  const handleAddGoal = (team: "a" | "b", playerId: number, minute: number) => {
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
    setShowGoalForm({ team, playerId: "", minute: "" });
  };

  const handleRemoveGoal = (team: "a" | "b", index: number) => {
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

  const handleAddCard = (team: "a" | "b", type: "yellow" | "red", playerId: number, minute: number) => {
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
                className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOpenResultModal(match)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-3">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {match.teams?.name || "Equipo A"} vs {match.teams1?.name || "Equipo B"}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
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
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          match.status === "finished"
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            : match.status === "in_progress"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        }`}>
                          {match.status === "finished" ? "Finalizado" : 
                           match.status === "in_progress" ? "En Curso" : 
                           "Programado"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Disciplina:</span>
                        <span>{match.sportName || "Sin disciplina"}</span>
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
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap">
                    {match.status === "finished" ? "Ver Resultado" : "Publicar Resultado"}
                  </button>
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
                  {/* Resultado del partido */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resultado</h3>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {selectedMatch.teams?.name || "Equipo A"}
                        </p>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {resultForm.score_team_a}
                        </div>
                      </div>
                      <div className="text-center text-gray-400">vs</div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {selectedMatch.teams1?.name || "Equipo B"}
                        </p>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {resultForm.score_team_b}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Goles del Equipo A */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Goles - {selectedMatch.teams?.name || "Equipo A"}
                      </h3>
                      <button
                        onClick={() => handleOpenGoalForm("a")}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        + Agregar Gol
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
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                      {resultForm.goals_team_a.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                          No hay goles registrados
                        </p>
                      )}
                      {showGoalForm.team === "a" && (
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

                  {/* Goles del Equipo B */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Goles - {selectedMatch.teams1?.name || "Equipo B"}
                      </h3>
                      <button
                        onClick={() => handleOpenGoalForm("b")}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        + Agregar Gol
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
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                      {resultForm.goals_team_b.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                          No hay goles registrados
                        </p>
                      )}
                      {showGoalForm.team === "b" && (
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

                  {/* Tarjetas Amarillas Equipo A */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-4 h-4 bg-yellow-500 rounded"></span>
                        Tarjetas Amarillas - {selectedMatch.teams?.name || "Equipo A"}
                      </h3>
                      <button
                        onClick={() => handleOpenCardForm("a", "yellow")}
                        className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
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
                            className="text-red-600 hover:text-red-700 text-sm"
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
                      {showCardForm.team === "a" && showCardForm.type === "yellow" && (
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

                  {/* Tarjetas Amarillas Equipo B */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-4 h-4 bg-yellow-500 rounded"></span>
                        Tarjetas Amarillas - {selectedMatch.teams1?.name || "Equipo B"}
                      </h3>
                      <button
                        onClick={() => handleOpenCardForm("b", "yellow")}
                        className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
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
                            className="text-red-600 hover:text-red-700 text-sm"
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
                      {showCardForm.team === "b" && showCardForm.type === "yellow" && (
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

                  {/* Tarjetas Rojas Equipo A */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-4 h-4 bg-red-500 rounded"></span>
                        Tarjetas Rojas - {selectedMatch.teams?.name || "Equipo A"}
                      </h3>
                      <button
                        onClick={() => handleOpenCardForm("a", "red")}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
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
                            className="text-red-600 hover:text-red-700 text-sm"
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
                      {showCardForm.team === "a" && showCardForm.type === "red" && (
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

                  {/* Tarjetas Rojas Equipo B */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-4 h-4 bg-red-500 rounded"></span>
                        Tarjetas Rojas - {selectedMatch.teams1?.name || "Equipo B"}
                      </h3>
                      <button
                        onClick={() => handleOpenCardForm("b", "red")}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
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
                            className="text-red-600 hover:text-red-700 text-sm"
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
                      {showCardForm.team === "b" && showCardForm.type === "red" && (
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
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Guardando..." : "Guardar Resultado"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

