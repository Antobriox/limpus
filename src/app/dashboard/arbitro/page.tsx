"use client";

import { useUser } from "../../../hooks/useUser";
import { useRefereeMatches } from "./hooks/useRefereeMatches";
import { useRealtimeSubscription } from "../../../hooks/useRealtimeSubscription";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Calendar, Clock, MapPin, UserCircle, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabaseClient";

export default function ArbitroPage() {
  const router = useRouter();
  const { user, roles, loading: userLoading } = useUser();
  const {
    upcomingMatches,
    liveMatches,
    pastMatches,
    loading: matchesLoading,
  } = useRefereeMatches(user?.id ?? null);

  useRealtimeSubscription();

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!roles.includes("arbitro") && !roles.includes("administrador")) {
      router.replace("/dashboard/general");
    }
  }, [user, roles, userLoading, router]);

  const handleLogout = () => {
    document.body.style.opacity = "0";
    document.body.style.pointerEvents = "none";
    const loader = document.createElement("div");
    loader.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, rgb(249 250 251) 0%, rgb(255 255 255) 50%, rgb(249 250 251) 100%);
    `;
    loader.innerHTML = `
      <div style="text-align: center;">
        <div style="width: 48px; height: 48px; border: 4px solid rgb(191 219 254); border-top-color: rgb(37 99 235);
          border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
        <p style="color: rgb(75 85 99); font-weight: 500;">Cerrando sesión...</p>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
    document.body.appendChild(loader);
    supabase.auth.signOut().finally(() => window.location.replace("/"));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    const days = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
    return `${days[d.getDay()]}, ${d.getDate()} ${d.toLocaleDateString("es-ES", { month: "short" })}`;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  if (userLoading || matchesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando tus partidos...</p>
        </motion.div>
      </div>
    );
  }

  const totalMatches = liveMatches.length + upcomingMatches.length + pastMatches.length;

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white py-6 sm:py-8 px-4 sm:px-6 shadow-xl"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <UserCircle className="w-7 h-7" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">Partidos a arbitrar</h1>
              <p className="text-amber-100 text-sm sm:text-base">
                {totalMatches} partido{totalMatches !== 1 ? "s" : ""} asignado{totalMatches !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </motion.button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* En vivo */}
        {liveMatches.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-6 rounded-full bg-red-500 animate-pulse" />
              En vivo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMatches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-neutral-800 rounded-xl p-5 border-2 border-red-200 dark:border-red-900/50 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {match.sport_name}
                      {match.genero && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {match.genero === "masculino" ? "M" : match.genero === "femenino" ? "F" : match.genero}
                        </span>
                      )}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                      {match.status === "suspended" ? "ENTRETIEMPO" : "EN VIVO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <p className="font-bold text-gray-900 dark:text-white truncate flex-1">{match.team_a_name}</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                      {match.score_a ?? 0} – {match.score_b ?? 0}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white truncate flex-1 text-right">{match.team_b_name}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    {match.field && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {match.field}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-medium">
                      Mi rol: {match.miRol}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Próximos */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Próximos partidos
          </h2>
          {upcomingMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 border border-gray-200 dark:border-neutral-700 text-center">
              <p className="text-gray-500 dark:text-gray-400">No tienes partidos programados por ahora.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingMatches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-gray-200 dark:border-neutral-700 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {match.sport_name}
                      {match.genero && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {match.genero === "masculino" ? "M" : match.genero === "femenino" ? "F" : match.genero}
                        </span>
                      )}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium">
                      Programado
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white mb-1">
                    {match.team_a_name} vs {match.team_b_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {formatDate(match.scheduled_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {formatTime(match.scheduled_at)}
                    </span>
                    {match.field && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {match.field}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-medium">
                      Mi rol: {match.miRol}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Finalizados */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Partidos finalizados</h2>
          {pastMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 border border-gray-200 dark:border-neutral-700 text-center">
              <p className="text-gray-500 dark:text-gray-400">Aún no has arbitrado partidos finalizados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastMatches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-gray-200 dark:border-neutral-700 opacity-90"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {match.sport_name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs">
                      Finalizado
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="font-bold text-gray-900 dark:text-white truncate flex-1">{match.team_a_name}</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
                      {match.score_a ?? 0} – {match.score_b ?? 0}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white truncate flex-1 text-right">{match.team_b_name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    {match.field && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {match.field}
                      </span>
                    )}
                    <span className="text-xs text-amber-600 dark:text-amber-400">Mi rol: {match.miRol}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
