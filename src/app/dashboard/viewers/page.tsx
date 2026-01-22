"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useUser } from "../../../hooks/useUser";
import { useViewersData, LiveMatch, UpcomingMatch } from "./hooks/useViewersData";
import { Calendar, Clock, MapPin, X, Eye } from "lucide-react";
import MatchDetailsModal from "../../leader/components/MatchDetailsModal";

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
  const { tournamentName, sports, liveMatches, upcomingMatches, pastMatches = [], loading } = useViewersData();
  
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [filteredMatches, setFilteredMatches] = useState<{
    live: LiveMatch[];
    upcoming: UpcomingMatch[];
  }>({ live: [], upcoming: [] });
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<{
    id: number;
    teamAId: number;
    teamBId: number;
    teamAName: string;
    teamBName: string;
    sportName: string;
    genero?: string | null;
  } | null>(null);

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

  // Comentado para que siempre se renderice el contenido, incluso si está cargando
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
  //       <div className="text-center">
  //         <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
  //         <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
  //       </div>
  //     </div>
  //   );
  // }

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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {match.sport_name}
                      </span>
                      {match.genero && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                          {match.genero === "masculino" ? "Masculino" : match.genero === "femenino" ? "Femenino" : match.genero}
                        </span>
                      )}
                    </div>
                    {match.status === "suspended" ? (
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        ENTRETIEMPO
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        EN VIVO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white">{match.team_a_name}</p>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mx-4">
                      {match.score_a !== null && match.score_b !== null 
                        ? `${match.score_a} - ${match.score_b}`
                        : "0 - 0"}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{match.team_b_name}</p>
                    </div>
                  </div>
                  {match.field && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{match.field}</span>
                    </div>
                  )}
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                    Ver Ahora
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Próximos Partidos */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Próximos Partidos
          </h2>
          {loading ? (
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        {match.sport_name}
                      </span>
                      {match.genero && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                          {match.genero === "masculino" ? "Masculino" : match.genero === "femenino" ? "Femenino" : match.genero}
                        </span>
                      )}
                    </div>
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

        {/* Historial de Partidos */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Historial de Partidos
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando historial...</p>
            </div>
          ) : !pastMatches || pastMatches.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
              <p className="text-gray-500 dark:text-gray-400">No hay partidos jugados aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastMatches.map((match) => {
                const hasResult = match.score_a !== null && match.score_b !== null;

                return (
                  <div
                    key={match.id}
                    className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                            {match.sport_name}
                          </span>
                          {match.genero && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                              {match.genero === "masculino" ? "Masculino" : match.genero === "femenino" ? "Femenino" : match.genero}
                            </span>
                          )}
                          {hasResult && (
                            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded text-xs font-semibold">
                              Finalizado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {match.team_a_name}
                          </p>
                          <span className="text-gray-400 dark:text-gray-500">vs</span>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {match.team_b_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                          {hasResult
                            ? `${match.score_a} - ${match.score_b}`
                            : "Sin resultado"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {match.scheduled_at && formatDate(match.scheduled_at)} {match.scheduled_at && formatTime(match.scheduled_at)}
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
                          className="mt-2 flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              {match.sport_name}
                            </span>
                            {match.genero && (
                              <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                                {match.genero === "masculino" ? "Masculino" : match.genero === "femenino" ? "Femenino" : match.genero}
                              </span>
                            )}
                          </div>
                          {match.status === "suspended" ? (
                            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              ENTRETIEMPO
                            </span>
                          ) : (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              EN VIVO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 dark:text-white">{match.team_a_name}</p>
                          </div>
                          <div className="text-2xl font-black text-gray-900 dark:text-white mx-4">
                            {match.score_a !== null && match.score_b !== null 
                              ? `${match.score_a} - ${match.score_b}`
                              : "0 - 0"}
                          </div>
                          <div className="flex-1 text-right">
                            <p className="font-bold text-gray-900 dark:text-white">{match.team_b_name}</p>
                          </div>
                        </div>
                        {match.field && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>{match.field}</span>
                          </div>
                        )}
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
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              {match.sport_name}
                            </span>
                            {match.genero && (
                              <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                                {match.genero === "masculino" ? "Masculino" : match.genero === "femenino" ? "Femenino" : match.genero}
                              </span>
                            )}
                            {match.status === "pending" && (
                              <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-medium">
                                Pendiente
                              </span>
                            )}
                          </div>
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
