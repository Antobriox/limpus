"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useUser } from "../../../hooks/useUser";
import { useViewersData, Sport, LiveMatch, UpcomingMatch } from "./hooks/useViewersData";
import { Calendar, Clock, MapPin, Trophy, Play, Star, X } from "lucide-react";

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
  return "🏆"; // Icono por defecto
};

export default function ViewersPage() {
  const router = useRouter();
  const { user } = useUser();
  // Usar el hook con TanStack Query - los datos se cargan automáticamente y se cachean
  const { tournamentName, sports, liveMatches, upcomingMatches, loading } = useViewersData();
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [filteredMatches, setFilteredMatches] = useState<{
    live: LiveMatch[];
    upcoming: UpcomingMatch[];
  }>({ live: [], upcoming: [] });

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
      setFilteredMatches({ live: filteredLive, upcoming: filteredUpcoming });
    }
  };

  const handleCloseModal = () => {
    setSelectedSport(null);
    setFilteredMatches({ live: [], upcoming: [] });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const formatTime = (dateString: string) => {
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
      {/* Botón de Cerrar Sesión - Esquina superior derecha */}
      <div className="absolute top-4 right-4 z-50">
        {user ? (
          <button
            onClick={handleLogout}
            className="bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition font-medium"
          >
            Cerrar Sesión
          </button>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Iniciar Sesión
          </button>
        )}
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-4">{tournamentName}</h1>
          <p className="text-xl text-blue-100">Sé testigo de la pasión. Sigue la acción.</p>
          <button
            onClick={() => router.push("/dashboard/viewers/clasificacion")}
            className="mt-8 bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition"
          >
            Ver Clasificación
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Explora los Deportes */}
        <section id="deportes" className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Explora los Deportes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 justify-items-center">
            {sports.map((sport) => (
              <div
                key={sport.id}
                onClick={() => handleSportClick(sport.id)}
                className="bg-white dark:bg-neutral-800 rounded-lg p-8 text-center hover:shadow-lg transition cursor-pointer border border-gray-200 dark:border-neutral-700 w-full max-w-[200px]"
              >
                <div className="text-7xl mb-6 flex justify-center">{getSportIcon(sport.name)}</div>
                <p className="font-semibold text-gray-900 dark:text-white text-lg">{sport.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sucediendo Ahora */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Sucediendo Ahora
          </h2>
          {liveMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
              <p className="text-gray-500 dark:text-gray-400">No hay partidos en vivo en este momento</p>
            </div>
          ) : (
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
                      <p className="font-bold text-gray-900 dark:text-white">{match.team_a_name}</p>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mx-4">
                      {match.score_a} - {match.score_b}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{match.team_b_name}</p>
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                    Ver Ahora
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Próximos Eventos */}
        <section id="calendario">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Próximos Eventos
          </h2>
          {upcomingMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
              <p className="text-gray-500 dark:text-gray-400">No hay eventos próximos programados</p>
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
                      <p className="font-bold text-gray-900 dark:text-white">{match.team_a_name}</p>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 mx-2">vs</span>
                    <div className="flex-1 text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{match.team_b_name}</p>
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
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal de Partidos por Disciplina */}
      {selectedSport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Partidos de {sports.find((s) => s.id === selectedSport)?.name}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Partidos en Vivo */}
              {filteredMatches.live.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    En Vivo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMatches.live.map((match) => (
                      <div
                        key={match.id}
                        className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 border border-gray-200 dark:border-neutral-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            {match.sport_name}
                          </span>
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            EN VIVO
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 dark:text-white">{match.team_a_name}</p>
                          </div>
                          <div className="text-2xl font-black text-gray-900 dark:text-white mx-4">
                            {match.score_a} - {match.score_b}
                          </div>
                          <div className="flex-1 text-right">
                            <p className="font-bold text-gray-900 dark:text-white">{match.team_b_name}</p>
                          </div>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                          Ver Ahora
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Próximos Partidos */}
              {filteredMatches.upcoming.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Próximos Partidos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMatches.upcoming.map((match) => (
                      <div
                        key={match.id}
                        className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-4 border border-gray-200 dark:border-neutral-700"
                      >
                        <div className="flex items-center justify-center mb-3">
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            {match.sport_name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 dark:text-white">{match.team_a_name}</p>
                          </div>
                          <span className="text-gray-400 dark:text-gray-500 mx-2">vs</span>
                          <div className="flex-1 text-right">
                            <p className="font-bold text-gray-900 dark:text-white">{match.team_b_name}</p>
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sin partidos */}
              {filteredMatches.live.length === 0 && filteredMatches.upcoming.length === 0 && (
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
    </div>
  );
}
