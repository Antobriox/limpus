"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useUser } from "../../../hooks/useUser";
import { useTeamLeader } from "./hooks/useTeamLeader";
import { useTeamMatches } from "./hooks/useTeamMatches";
import { useTeamStats } from "./hooks/useTeamStats";
import { Calendar, Clock, MapPin, Trophy, Users, TrendingUp, Award, Target, FileText } from "lucide-react";
import { useState } from "react";
import RegistrationModal from "./components/RegistrationModal";

export default function LeaderPage() {
  const router = useRouter();
  const { user } = useUser();
  const { teamInfo, loading: loadingTeam } = useTeamLeader();
  const { upcomingMatches, liveMatches, pastMatches, loading: loadingMatches } = useTeamMatches(teamInfo?.id || null);
  const { stats, loading: loadingStats } = useTeamStats(teamInfo?.id || null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Fecha no programada";
    const date = new Date(dateString);
    const months = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  if (loadingTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando información del equipo...</p>
        </div>
      </div>
    );
  }

  if (!teamInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
        <div className="text-center max-w-md mx-auto px-6">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No tienes un equipo asignado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Contacta con un administrador para que te asigne a un equipo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black mb-2">{teamInfo.name}</h1>
              <p className="text-blue-100 text-lg">{teamInfo.faculty}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Estadísticas del Equipo */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Estadísticas del Equipo
          </h2>
          {loadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700 animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-neutral-600 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 dark:bg-neutral-600 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Partidos Jugados</span>
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMatches}</p>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Victorias</span>
                  <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.wins}</p>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Empates</span>
                  <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.draws}</p>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Puntos</span>
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.points}</p>
              </div>
            </div>
          )}

          {/* Estadísticas por Disciplina */}
          {Object.keys(stats.byDiscipline).length > 0 && (
            <div className="mt-6 bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Por Disciplina
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.byDiscipline).map(([discipline, disciplineStats]) => {
                  const statsData = disciplineStats as {
                    matches: number;
                    wins: number;
                    losses: number;
                    draws: number;
                    points: number;
                  };
                  return (
                    <div key={discipline} className="border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{discipline}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Partidos:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{statsData.matches}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Victorias:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">{statsData.wins}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Empates:</span>
                          <span className="font-medium text-yellow-600 dark:text-yellow-400">{statsData.draws}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Derrotas:</span>
                          <span className="font-medium text-red-600 dark:text-red-400">{statsData.losses}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-neutral-700">
                          <span className="text-gray-900 dark:text-white font-semibold">Puntos:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{statsData.points}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Información del Equipo */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Información del Equipo
          </h2>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Líderes del Equipo</h3>
                <ul className="space-y-2">
                  {teamInfo.leaders.length > 0 ? (
                    teamInfo.leaders.map((leader, index) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400">
                        {leader}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 dark:text-gray-400">Sin líderes asignados</li>
                  )}
                </ul>
                {teamInfo.careers.length > 0 && (
                  <>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 mt-6">Carreras</h3>
                    <ul className="space-y-2">
                      {teamInfo.careers.map((career, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-400">
                          {career}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Capitán</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {teamInfo.captain || "Sin capitán asignado"}
                </p>
                <button
                  onClick={() => setShowRegistrationModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Llenar Inscripción
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Partidos en Vivo */}
        {liveMatches.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Partidos en Vivo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {match.sport_name}
                    </span>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      EN VIVO
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className={`font-bold ${match.team_a_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                        {match.team_a_name}
                      </p>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mx-4">
                      {match.score_a ?? 0} - {match.score_b ?? 0}
                    </div>
                    <div className="flex-1 text-right">
                      <p className={`font-bold ${match.team_b_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                        {match.team_b_name}
                      </p>
                    </div>
                  </div>
                  {match.field && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{match.field}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Próximos Partidos */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Próximos Partidos
          </h2>
          {loadingMatches ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : upcomingMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
              <p className="text-gray-500 dark:text-gray-400">No hay partidos programados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {match.sport_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className={`font-bold ${match.team_a_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                        {match.team_a_name}
                      </p>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 mx-2">vs</span>
                    <div className="flex-1 text-right">
                      <p className={`font-bold ${match.team_b_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                        {match.team_b_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(match.scheduled_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(match.scheduled_at)}</span>
                    </div>
                    {match.field && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{match.field}</span>
                      </div>
                    )}
                  </div>
                  {match.referee && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Árbitro: {match.referee}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Partidos Pasados */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Historial de Partidos
          </h2>
          {loadingMatches ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : pastMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
              <p className="text-gray-500 dark:text-gray-400">No hay partidos jugados aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastMatches.slice(0, 10).map((match) => {
                const isWin = match.team_a_id === teamInfo.id
                  ? (match.score_a ?? 0) > (match.score_b ?? 0)
                  : (match.score_b ?? 0) > (match.score_a ?? 0);
                const isDraw = (match.score_a ?? 0) === (match.score_b ?? 0);

                return (
                  <div
                    key={match.id}
                    className={`bg-white dark:bg-neutral-800 rounded-lg p-4 border ${
                      isWin
                        ? "border-green-200 dark:border-green-800"
                        : isDraw
                        ? "border-yellow-200 dark:border-yellow-800"
                        : "border-gray-200 dark:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            {match.sport_name}
                          </span>
                          {isWin && (
                            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded text-xs font-semibold">
                              Victoria
                            </span>
                          )}
                          {isDraw && (
                            <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded text-xs font-semibold">
                              Empate
                            </span>
                          )}
                          {!isWin && !isDraw && (
                            <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded text-xs font-semibold">
                              Derrota
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold ${match.team_a_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                            {match.team_a_name}
                          </p>
                          <span className="text-gray-400 dark:text-gray-500">vs</span>
                          <p className={`font-bold ${match.team_b_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                            {match.team_b_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                          {match.score_a ?? 0} - {match.score_b ?? 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(match.scheduled_at)} {formatTime(match.scheduled_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal de Inscripciones */}
      {showRegistrationModal && teamInfo && (
        <RegistrationModal
          teamId={teamInfo.id}
          onClose={() => setShowRegistrationModal(false)}
        />
      )}
    </div>
  );
}
