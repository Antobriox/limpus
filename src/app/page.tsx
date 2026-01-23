"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../hooks/useUser";
import { useViewersData } from "./dashboard/viewers/hooks/useViewersData";
import { Calendar, Clock, MapPin, Eye, X } from "lucide-react";
import MatchDetailsModal from "./dashboard/leader/components/MatchDetailsModal";

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
  const { user, roles, loading: userLoading } = useUser();
  const { tournamentName, sports, liveMatches, upcomingMatches, pastMatches = [], loading } = useViewersData();
  
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [filteredMatches, setFilteredMatches] = useState<{
    live: typeof liveMatches;
    upcoming: typeof upcomingMatches;
    past: typeof pastMatches;
  }>({ live: [], upcoming: [], past: [] });
  
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<{
    id: number;
    teamAId: number;
    teamBId: number;
    teamAName: string;
    teamBName: string;
    sportName: string;
    genero?: string | null;
  } | null>(null);

  // Redirigir usuarios autenticados según su rol
  useEffect(() => {
    if (userLoading) return;
    
    if (user && roles.length > 0) {
    if (roles.includes("administrador")) {
        router.replace("/dashboard/torneos");
    } else if (roles.includes("lider_equipo")) {
      router.replace("/dashboard/leader");
    } else if (roles.includes("arbitro")) {
        router.replace("/dashboard/general");
      }
      // Si es viewer o no tiene rol específico, se queda en la página pública
    }
  }, [user, roles, userLoading, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSportClick = (sportId: number) => {
    setSelectedSport(sportId);
    // Filtrar partidos por disciplina
    const sport = sports.find((s) => s.id === sportId);
    if (sport) {
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
      setFilteredMatches({ live: filteredLive, upcoming: filteredUpcoming, past: filteredPast });
    }
  };

  const handleCloseModal = () => {
    setSelectedSport(null);
    setFilteredMatches({ live: [], upcoming: [], past: [] });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-50">
        {user ? (
          <button
            onClick={handleLogout}
            className="bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition font-medium shadow-md text-xs sm:text-sm"
          >
            Cerrar Sesión
          </button>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition font-medium shadow-md text-xs sm:text-sm"
          >
            Iniciar Sesión
          </button>
        )}
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4">{tournamentName}</h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 px-4">Sé testigo de la pasión. Sigue la acción.</p>
          <button
            onClick={() => router.push("/dashboard/viewers/clasificacion")}
            className="mt-6 sm:mt-8 bg-white text-blue-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold hover:bg-blue-50 transition text-sm sm:text-base"
          >
            Ver Clasificación
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12 space-y-8 sm:space-y-10 md:space-y-12">
        
        {/* Explora los Deportes */}
        <section id="deportes" className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
            Explora los Deportes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 justify-items-center">
            {sports.map((sport) => (
              <div
                key={sport.id}
                onClick={() => handleSportClick(sport.id)}
                className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 md:p-8 text-center hover:shadow-lg transition cursor-pointer border border-gray-200 dark:border-neutral-700 w-full max-w-[180px] sm:max-w-[200px]"
              >
                <div className="text-5xl sm:text-6xl md:text-7xl mb-3 sm:mb-4 md:mb-6 flex justify-center">{getSportIcon(sport.name)}</div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base md:text-lg">{sport.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Partidos en Vivo */}
        <section id="en-vivo">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Partidos en Vivo
            </h2>
            {liveMatches.length > 0 && (
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                {liveMatches.length} {liveMatches.length === 1 ? "EN VIVO" : "EN VIVO"}
              </span>
            )}
          </div>
          
          {liveMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 sm:p-8 text-center border border-gray-200 dark:border-neutral-700">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No hay partidos en vivo en este momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {liveMatches.map((match) => (
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
                      {match.score_a !== null && match.score_b !== null 
                        ? `${match.score_a} - ${match.score_b}`
                        : "0 - 0"}
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
                    className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm sm:text-base"
                  >
                    Ver Ahora
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Próximos Partidos */}
        <section id="proximos">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Próximos Partidos
            </h2>
            {upcomingMatches.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {upcomingMatches.length} {upcomingMatches.length === 1 ? "partido" : "partidos"}
              </span>
            )}
          </div>
          
          {upcomingMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 sm:p-8 text-center border border-gray-200 dark:border-neutral-700">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No hay partidos programados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {upcomingMatches.map((match) => (
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
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Árbitro: {match.referee}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Historial de Partidos */}
        <section id="historial">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Historial de Partidos
            </h2>
            {pastMatches.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {pastMatches.length} {pastMatches.length === 1 ? "partido" : "partidos"}
              </span>
            )}
          </div>
          
          {!pastMatches || pastMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 sm:p-8 text-center border border-gray-200 dark:border-neutral-700">
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">No hay partidos jugados aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {pastMatches.map((match) => {
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
          )}
        </section>
      </div>

      {/* Modal de Partidos por Disciplina */}
      {selectedSport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white pr-2">
                Partidos de {sports.find((s) => s.id === selectedSport)?.name}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
              </button>
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
                        {match.score_a !== null && match.score_b !== null 
                          ? `${match.score_a} - ${match.score_b}`
                          : "0 - 0"}
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
                      className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm sm:text-base"
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
                          teamAId: match.team_a_id || 0,
                          teamBId: match.team_b_id || 0,
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
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay partidos programados para {sports.find((s) => s.id === selectedSport)?.name} en este momento
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
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
          genero={selectedMatchForDetails.genero || null}
          onClose={() => setSelectedMatchForDetails(null)}
        />
      )}
    </div>
  );
}

