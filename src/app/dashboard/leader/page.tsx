"use client";

import { supabase } from "../../../lib/supabaseClient";
import { useTeamLeader } from "./hooks/useTeamLeader";
import { useTeamMatches } from "./hooks/useTeamMatches";
import { useTeamStats } from "./hooks/useTeamStats";
import { useRealtimeSubscription } from "../../../hooks/useRealtimeSubscription";
import { Calendar, Clock, MapPin, Trophy, Users, TrendingUp, Award, Target, FileText, Eye } from "lucide-react";
import { useState } from "react";
import RegistrationModal from "./components/RegistrationModal";
import MatchDetailsModal from "./components/MatchDetailsModal";
import { motion } from "framer-motion";

export default function LeaderPage() {
  const { teamInfo, loading: loadingTeam } = useTeamLeader();
  const { upcomingMatches, liveMatches, pastMatches, loading: loadingMatches } = useTeamMatches(teamInfo?.id || null);
  const { stats, loading: loadingStats } = useTeamStats(teamInfo?.id || null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<{
    id: number;
    teamAId: number | null;
    teamBId: number | null;
    teamAName: string;
    teamBName: string;
    sportName: string;
    genero?: string | null;
  } | null>(null);

  // 🔥 ACTIVAR ACTUALIZACIONES EN TIEMPO REAL
  useRealtimeSubscription();

  const handleLogout = () => {
    // Ocultar INMEDIATAMENTE todo el contenido
    document.body.style.opacity = "0";
    document.body.style.pointerEvents = "none";
    
    // Mostrar loader
    const loader = document.createElement("div");
    loader.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgb(249 250 251) 0%, rgb(255 255 255) 50%, rgb(249 250 251) 100%);
    `;
    loader.innerHTML = `
      <div style="text-align: center;">
        <div style="
          width: 48px;
          height: 48px;
          border: 4px solid rgb(191 219 254);
          border-top-color: rgb(37 99 235);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        "></div>
        <p style="color: rgb(75 85 99); font-weight: 500;">Cerrando sesión...</p>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-color-scheme: dark) {
          div:first-child {
            background: linear-gradient(135deg, rgb(10 10 10) 0%, rgb(23 23 23) 50%, rgb(10 10 10) 100%) !important;
          }
          p { color: rgb(156 163 175) !important; }
          div > div:first-child {
            border-color: rgb(30 58 138) !important;
            border-top-color: rgb(96 165 250) !important;
          }
        }
      </style>
    `;
    document.body.appendChild(loader);
    
    // Cerrar sesión y redirigir
    supabase.auth.signOut().finally(() => {
      window.location.replace("/");
    });
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Cargando información del equipo...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!teamInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No tienes un equipo asignado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Contacta con un administrador para que te asigne a un equipo.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-6 sm:py-8 px-4 sm:px-6 shadow-xl"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-2 truncate">{teamInfo.name}</h1>
              <p className="text-blue-100 text-sm sm:text-base md:text-lg">
                {teamInfo.careers.length > 0 ? teamInfo.careers.join(" / ") : "Sin carreras"}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition font-medium text-sm sm:text-base whitespace-nowrap shadow-lg cursor-pointer"
            >
              Cerrar Sesión
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Estadísticas del Equipo */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
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
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Partidos Jugados</span>
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMatches}</p>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Victorias</span>
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.wins}</p>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Empates</span>
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.draws}</p>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Puntos</span>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.points}</p>
              </div>
            </div>
          )}

          {/* Estadísticas por Disciplina */}
          {Object.keys(stats.byDiscipline).length > 0 && (
            <div className="mt-4 sm:mt-6 bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Por Disciplina
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Información del Equipo
          </h2>
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
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
                <button
                  onClick={() => setShowRegistrationModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium mt-3 cursor-pointer"
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Partidos en Vivo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {liveMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {match.sport_name}
                      </span>
                      {match.genero && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium whitespace-nowrap">
                          {match.genero === "masculino" ? "Masculino" : match.genero === "femenino" ? "Femenino" : match.genero}
                        </span>
                      )}
                    </div>
                    {match.status === "suspended" ? (
                      <span className="bg-yellow-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        ENTRETIEMPO
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        EN VIVO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm sm:text-base truncate ${match.team_a_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                        {match.team_a_name}
                      </p>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mx-2 sm:mx-4 whitespace-nowrap">
                      {match.score_a ?? 0} - {match.score_b ?? 0}
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <p className={`font-bold text-sm sm:text-base truncate ${match.team_b_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                        {match.team_b_name}
                      </p>
                    </div>
                  </div>
                  {match.field && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{match.field}</span>
                    </div>
                  )}
                  <button
                    onClick={() =>
                      setSelectedMatchForDetails({
                        id: match.id,
                        teamAId: match.team_a_id,
                        teamBId: match.team_b_id,
                        teamAName: match.team_a_name,
                        teamBName: match.team_b_name,
                        sportName: match.sport_name,
                        genero: match.genero,
                      })
                    }
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    Ver Detalles
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Próximos Partidos */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Próximos Partidos
          </h2>
          {loadingMatches ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : upcomingMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 sm:p-8 text-center border border-gray-200 dark:border-neutral-700">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No hay partidos programados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {match.sport_name}
                      </span>
                      {match.genero && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium whitespace-nowrap">
                          {match.genero === "masculino" ? "Masculino" : match.genero === "femenino" ? "Femenino" : match.genero}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm sm:text-base truncate ${match.team_a_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                        {match.team_a_name}
                      </p>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 mx-1 sm:mx-2 text-xs sm:text-sm">vs</span>
                    <div className="flex-1 text-right min-w-0">
                      <p className={`font-bold text-sm sm:text-base truncate ${match.team_b_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                        {match.team_b_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{formatDate(match.scheduled_at)}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{formatTime(match.scheduled_at)}</span>
                    </div>
                    {match.field && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{match.field}</span>
                      </div>
                    )}
                  </div>
                  {match.referee && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Historial de Partidos
          </h2>
          {loadingMatches ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : pastMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 sm:p-8 text-center border border-gray-200 dark:border-neutral-700">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No hay partidos jugados aún</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {pastMatches.slice(0, 10).map((match) => {
                // Solo calcular resultado si hay scores (no null)
                const hasResult = match.score_a !== null && match.score_b !== null;
                const isWin = hasResult && (match.team_a_id === teamInfo.id
                  ? match.score_a! > match.score_b!
                  : match.score_b! > match.score_a!);
                const isDraw = hasResult && match.score_a === match.score_b;

                return (
                  <div
                    key={match.id}
                    className={`bg-white dark:bg-neutral-800 rounded-lg p-3 sm:p-4 border ${
                      isWin
                        ? "border-green-200 dark:border-green-800"
                        : isDraw
                        ? "border-yellow-200 dark:border-yellow-800"
                        : "border-gray-200 dark:border-neutral-700"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            {match.sport_name}
                          </span>
                          {match.genero && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium whitespace-nowrap">
                              {match.genero === "masculino" ? "Masculino" : match.genero === "femenino" ? "Femenino" : match.genero}
                            </span>
                          )}
                          {hasResult && isWin && (
                            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                              Victoria
                            </span>
                          )}
                          {hasResult && isDraw && (
                            <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                              Empate
                            </span>
                          )}
                          {hasResult && !isWin && !isDraw && (
                            <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                              Derrota
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`font-bold text-sm sm:text-base truncate ${match.team_a_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                            {match.team_a_name}
                          </p>
                          <span className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">vs</span>
                          <p className={`font-bold text-sm sm:text-base truncate ${match.team_b_id === teamInfo.id ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                            {match.team_b_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col sm:text-right items-center sm:items-end justify-between sm:justify-end gap-3 sm:gap-2">
                        <div>
                          <div className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 dark:text-white">
                            {match.score_a !== null && match.score_b !== null 
                              ? `${match.score_a} - ${match.score_b}`
                              : "Sin resultado"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(match.scheduled_at)} {formatTime(match.scheduled_at)}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setSelectedMatchForDetails({
                              id: match.id,
                              teamAId: match.team_a_id,
                              teamBId: match.team_b_id,
                              teamAName: match.team_a_name,
                              teamBName: match.team_b_name,
                              sportName: match.sport_name,
                            })
                          }
                          className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs flex-shrink-0"
                        >
                          <Eye className="w-3 h-3" />
                          <span className="hidden sm:inline">Ver</span>
                        </button>
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
          editionId={teamInfo.edition_id}
          onClose={() => setShowRegistrationModal(false)}
        />
      )}

      {/* Modal de Detalles del Partido */}
      {selectedMatchForDetails && (
        <MatchDetailsModal
          matchId={selectedMatchForDetails.id}
          teamAId={selectedMatchForDetails.teamAId}
          teamBId={selectedMatchForDetails.teamBId}
          teamAName={selectedMatchForDetails.teamAName}
          teamBName={selectedMatchForDetails.teamBName}
          sportName={selectedMatchForDetails.sportName}
          genero={selectedMatchForDetails.genero}
          onClose={() => setSelectedMatchForDetails(null)}
        />
      )}
    </div>
  );
}
