"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../hooks/useUser";
import { useTheme } from "../contexts/ThemeContext";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import { useViewersData } from "./dashboard/viewers/hooks/useViewersData";
import { Calendar, Clock, MapPin, Eye, X, Sun, Moon } from "lucide-react";
import MatchDetailsModal from "./dashboard/leader/components/MatchDetailsModal";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

// Función para obtener el icono según el deporte
const getSportIcon = (sportName: string) => {
  const name = sportName.toLowerCase();
  if (name.includes("basket") || name.includes("básquet")) {
    return "🏀";
  } else if (name.includes("futbol") || name.includes("fútbol") || name.includes("football")) {
    return "⚽";
  } else if (name.includes("voley") || name.includes("volleyball") || name.includes("voleibol")) {
    return "🏐";
  } else if (name.includes("padel") || name.includes("pádel") || name.includes("paddle")) {
    return "🎾";
  }
  return "🏆";
};

export default function HomePage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, roles, loading: userLoading } = useUser();
  const { tournamentName, sports, liveMatches, upcomingMatches, pastMatches = [], loading } = useViewersData();
  
  // 🔥 ACTIVAR ACTUALIZACIONES EN TIEMPO REAL
  useRealtimeSubscription();
  
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  
  // 🔥 CALCULAR FILTROS con useMemo (evita re-renders innecesarios)
  const filteredMatches = useMemo(() => {
    if (!selectedSport) {
      return { live: [], upcoming: [], past: [] };
    }
    
    const sport = sports.find((s) => s.id === selectedSport);
    if (!sport) {
      return { live: [], upcoming: [], past: [] };
    }
    
    const filteredLive = liveMatches.filter((m) => 
      m.sport_name.toLowerCase() === sport.name.toLowerCase() ||
      m.sport_name.toLowerCase().includes(sport.name.toLowerCase()) ||
      sport.name.toLowerCase().includes(m.sport_name.toLowerCase())
    );
    const filteredUpcoming = upcomingMatches.filter((m) =>
      m.sport_name.toLowerCase() === sport.name.toLowerCase() ||
      m.sport_name.toLowerCase().includes(sport.name.toLowerCase()) ||
      sport.name.toLowerCase().includes(m.sport_name.toLowerCase())
    );
    const filteredPast = pastMatches.filter((m) =>
      m.sport_name.toLowerCase() === sport.name.toLowerCase() ||
      m.sport_name.toLowerCase().includes(sport.name.toLowerCase()) ||
      sport.name.toLowerCase().includes(m.sport_name.toLowerCase())
    );
    
    return { live: filteredLive, upcoming: filteredUpcoming, past: filteredPast };
  }, [liveMatches, upcomingMatches, pastMatches, selectedSport, sports]);
  
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<{
    id: number;
    teamAId: number | null;
    teamBId: number | null;
    teamAName: string;
    teamBName: string;
    sportName: string;
    genero?: string | null;
  } | null>(null);

  // Redirigir usuarios autenticados según su rol INMEDIATAMENTE
  useEffect(() => {
    if (userLoading) return;
    
    if (user && roles.length > 0) {
      // Redirección INMEDIATA con window.location (sin esperar a React)
      if (roles.includes("administrador")) {
        window.location.replace("/dashboard/torneos");
      } else if (roles.includes("lider_equipo")) {
        window.location.replace("/dashboard/leader");
      } else if (roles.includes("arbitro")) {
        window.location.replace("/dashboard/general");
      }
      // Si es viewer, se queda en la página pública (no hace nada)
    }
  }, [user, roles, userLoading]);

  // Funciones de manejo (definidas antes de los returns)
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

  const handleSportClick = (sportId: number) => {
    // Solo actualizar el deporte seleccionado - useMemo recalculará filteredMatches automáticamente
    setSelectedSport(sportId);
  };

  const handleCloseModal = () => {
    // Solo limpiar el deporte seleccionado - useMemo devolverá arrays vacíos automáticamente
    setSelectedSport(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Fecha no programada";
    const date = new Date(dateString);
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  // Si está cargando o es usuario autenticado no-viewer, mostrar loader
  const isAuthenticatedNonViewer = user && roles.length > 0 && 
    (roles.includes("administrador") || roles.includes("lider_equipo") || roles.includes("arbitro"));
  
  if (userLoading || isAuthenticatedNonViewer) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
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
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  // Mostrar loader mientras carga datos de viewers
  if (loading) {
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
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 relative">
      {/* Header: tema + sesión */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-2 sm:top-4 right-2 sm:right-4 z-50 flex items-center gap-2"
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className={cn(
            "p-2.5 rounded-lg transition-all cursor-pointer",
            "bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-gray-200 dark:border-neutral-700",
            "hover:bg-gray-100 dark:hover:bg-neutral-700 shadow-md hover:shadow-lg"
          )}
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-blue-600" />
          )}
        </motion.button>
        {user ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition font-medium shadow-md text-xs sm:text-sm cursor-pointer"
          >
            Cerrar Sesión
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/login")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium shadow-lg hover:shadow-xl text-xs sm:text-sm"
          >
            Iniciar Sesión
          </motion.button>
        )}
      </motion.div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 shadow-xl"
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4"
          >
            {tournamentName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl text-blue-100 px-4"
          >
            Sé testigo de la pasión. Sigue la acción.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/dashboard/viewers/clasificacion")}
            className="mt-6 sm:mt-8 bg-white text-blue-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-blue-50 transition text-sm sm:text-base shadow-lg hover:shadow-xl"
          >
            Ver Clasificación
          </motion.button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12 space-y-8 sm:space-y-10 md:space-y-12">
        
        {/* Explora los Deportes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          id="deportes"
          className="text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-6 sm:mb-8">
            Explora los Deportes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 justify-items-center">
            {sports.map((sport, index) => (
              <motion.div
                key={sport.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ y: -8, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSportClick(sport.id)}
                className="bg-white dark:bg-neutral-800 rounded-xl p-4 sm:p-6 md:p-8 text-center hover:shadow-xl transition cursor-pointer border-2 border-gray-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-400 w-full max-w-[180px] sm:max-w-[200px] shadow-lg hover:shadow-2xl"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4 md:mb-6 flex justify-center"
                >
                  {getSportIcon(sport.name)}
                </motion.div>
                <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base md:text-lg">{sport.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Partidos en Vivo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          id="en-vivo"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Partidos en Vivo
            </h2>
            {liveMatches.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg"
              >
                {liveMatches.length} {liveMatches.length === 1 ? "EN VIVO" : "EN VIVO"}
              </motion.span>
            )}
          </div>
          
          {liveMatches.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-neutral-800 rounded-xl p-6 sm:p-8 text-center border border-gray-200 dark:border-neutral-700 shadow-lg"
            >
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No hay partidos en vivo en este momento</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {liveMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white dark:bg-neutral-800 rounded-xl p-4 sm:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden group"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:to-red-500/5 transition-all duration-300 rounded-xl" />
                  
                  <div className="relative z-10">
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
                      <span className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap animate-pulse">
                        EN VIVO
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_a_name}</p>
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white mx-2 sm:mx-4 whitespace-nowrap">
                      {`${match.score_a ?? 0} - ${match.score_b ?? 0}`}
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_b_name}</p>
                    </div>
                  </div>
                  
                  {match.field && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{match.field}</span>
                    </div>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setSelectedMatchForDetails({
                        id: match.id,
                        teamAId: match.team_a_id,
                        teamBId: match.team_b_id,
                        teamAName: match.team_a_name,
                        teamBName: match.team_b_name,
                        sportName: match.sport_name,
                        genero: match.genero || null,
                      })
                    }
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 sm:py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition text-sm sm:text-base shadow-lg hover:shadow-xl"
                  >
                    Ver Ahora
                  </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Próximos Partidos */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          id="proximos"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Próximos Partidos
            </h2>
            {upcomingMatches.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {upcomingMatches.length} {upcomingMatches.length === 1 ? "partido" : "partidos"}
              </span>
            )}
          </div>
          
          {upcomingMatches.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-neutral-800 rounded-xl p-6 sm:p-8 text-center border border-gray-200 dark:border-neutral-700 shadow-lg"
            >
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No hay partidos programados</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {upcomingMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white dark:bg-neutral-800 rounded-xl p-4 sm:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden group"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 rounded-xl" />
                  
                  <div className="relative z-10">
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
                      {match.status === "pending" && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-medium whitespace-nowrap">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_a_name}</p>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 mx-1 sm:mx-2 text-xs sm:text-sm">vs</span>
                    <div className="flex-1 text-right min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_b_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
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
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                      Árbitro: {match.referee}
                    </div>
                  )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Historial de Partidos */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          id="historial"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Historial de Partidos
            </h2>
            {pastMatches.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {pastMatches.length} {pastMatches.length === 1 ? "partido" : "partidos"}
              </span>
            )}
          </div>
          
          {!pastMatches || pastMatches.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-neutral-800 rounded-xl p-6 sm:p-8 text-center border border-gray-200 dark:border-neutral-700 shadow-lg"
            >
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No hay partidos jugados aún</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {pastMatches.map((match, index) => {
                const hasResult = match.score_a !== null && match.score_b !== null;

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-4 sm:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden group"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-green-500/5 transition-all duration-300 rounded-xl" />
                    
                    <div className="relative z-10">
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
                        {hasResult && (
                          <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                            Finalizado
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_a_name}</p>
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white mx-2 sm:mx-4 whitespace-nowrap">
                        {hasResult
                          ? `${match.score_a} - ${match.score_b}`
                          : "Sin resultado"}
                      </div>
                      <div className="flex-1 text-right min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_b_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {match.scheduled_at && (
                        <>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{formatDate(match.scheduled_at)}</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{formatTime(match.scheduled_at)}</span>
                          </div>
                        </>
                      )}
                      {match.field && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{match.field}</span>
                        </div>
                      )}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setSelectedMatchForDetails({
                          id: match.id,
                          teamAId: match.team_a_id,
                          teamBId: match.team_b_id,
                          teamAName: match.team_a_name,
                          teamBName: match.team_b_name,
                          sportName: match.sport_name,
                          genero: match.genero || null,
                        })
                      }
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 sm:py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalles
                    </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>

      {/* Modal de Partidos por Disciplina */}
      <AnimatePresence>
        {selectedSport && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none"
            >
              <div className="bg-white dark:bg-neutral-800 rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto pointer-events-auto border border-gray-200 dark:border-neutral-700 shadow-2xl">
                <div className="sticky top-0 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-md border-b border-gray-200 dark:border-neutral-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent pr-2">
                    Partidos de {sports.find((s) => s.id === selectedSport)?.name}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCloseModal}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Partidos en Vivo */}
                {filteredMatches.live.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow"
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
                        <span className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap animate-pulse">
                          EN VIVO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_a_name}</p>
                      </div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white mx-2 sm:mx-4 whitespace-nowrap">
                        {`${match.score_a ?? 0} - ${match.score_b ?? 0}`}
                      </div>
                      <div className="flex-1 text-right min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_b_name}</p>
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
                          genero: match.genero || null,
                        })
                      }
                      className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm sm:text-base cursor-pointer"
                    >
                      Ver Ahora
                    </button>
                  </div>
                ))}

                {/* Próximos Partidos */}
                {filteredMatches.upcoming.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow"
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
                        {match.status === "pending" && (
                          <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-medium whitespace-nowrap">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_a_name}</p>
                      </div>
                      <span className="text-gray-400 dark:text-gray-500 mx-1 sm:mx-2 text-xs sm:text-sm">vs</span>
                      <div className="flex-1 text-right min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_b_name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
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
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mb-3">
                        Árbitro: {match.referee}
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
                          genero: match.genero || null,
                        })
                      }
                      className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalles
                    </button>
                  </div>
                ))}

                {/* Historial de Partidos */}
                {filteredMatches.past.map((match) => {
                  const hasResult = match.score_a !== null && match.score_b !== null;
                  return (
                    <div
                      key={match.id}
                      className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow"
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
                          {hasResult && (
                            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                              Finalizado
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_a_name}</p>
                        </div>
                        <div className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white mx-2 sm:mx-4 whitespace-nowrap">
                          {hasResult
                            ? `${match.score_a} - ${match.score_b}`
                            : "Sin resultado"}
                        </div>
                        <div className="flex-1 text-right min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{match.team_b_name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {match.scheduled_at && (
                          <>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span>{formatDate(match.scheduled_at)}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span>{formatTime(match.scheduled_at)}</span>
                            </div>
                          </>
                        )}
                        {match.field && (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{match.field}</span>
                          </div>
                        )}
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
                            genero: match.genero || null,
                          })
                        }
                        className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm sm:text-base flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Sin partidos */}
              {filteredMatches.live.length === 0 && filteredMatches.upcoming.length === 0 && filteredMatches.past.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay partidos programados para {sports.find((s) => s.id === selectedSport)?.name} en este momento
                  </p>
                </motion.div>
              )}
            </div>
          </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Detalles del Partido */}
      {selectedMatchForDetails && (
        <MatchDetailsModal
          matchId={selectedMatchForDetails.id}
          teamAId={selectedMatchForDetails.teamAId}
          teamBId={selectedMatchForDetails.teamBId}
          teamAName={selectedMatchForDetails.teamAName}
          teamBName={selectedMatchForDetails.teamBName}
          sportName={selectedMatchForDetails.sportName}
          genero={selectedMatchForDetails.genero || null}
          onClose={() => setSelectedMatchForDetails(null)}
        />
      )}
    </div>
  );
}

