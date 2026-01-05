"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import AdvancedStatCard from "../../../components/AdvancedStatCard";
import ActionCard from "../../../components/ActionCard";
import {
  Users,
  Settings,
  Square,
  TrendingUp,
  Network,
  Calendar,
  Upload,
  Edit,
  Plus,
  Calendar as CalendarIcon,
  MapPin,
  MoreVertical,
} from "lucide-react";

type Tournament = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location?: string;
  status: string;
};

type Team = {
  id: number;
  name: string;
  faculty?: string;
  captain?: string;
  status?: string;
};

type RecentResult = {
  id: number;
  sport: string;
  category: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  date: string;
  time: string;
};

export default function TorneosPage() {
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [stats, setStats] = useState({
    equiposInscritos: 0,
    equiposNuevos: 0,
    disciplinasActivas: 0,
    partidosJugados: 0,
    partidosTotales: 0,
    progresoGeneral: 0,
  });
  const [recentTeams, setRecentTeams] = useState<Team[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar torneo activo (el más reciente)
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
        // Datos por defecto si no hay torneo
        setTournament({
          id: 0,
          name: "Sin torneo activo",
          start_date: "",
          end_date: "",
          location: undefined,
          status: "SIN INICIAR",
        });
      }

      // Contar TODOS los equipos (no filtrar por torneo)
      const { count } = await supabase
        .from("teams")
        .select("*", { count: "exact", head: true });
      const equiposCount = count || 0;

      // Contar equipos nuevos (últimos 7 días)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: equiposNuevosCount } = await supabase
        .from("teams")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      // Contar disciplinas activas
      const { count: disciplinasCount } = await supabase
        .from("sports")
        .select("*", { count: "exact", head: true });

      // Contar partidos usando match_results (partidos con resultado confirmado)
      let partidosJugadosCount = 0;
      let partidosTotales = 0;

      // Contar partidos con resultados confirmados
      const { count: matchesWithResultsCount } = await supabase
        .from("match_results")
        .select("*", { count: "exact", head: true });

      partidosJugadosCount = matchesWithResultsCount || 0;

      // Contar total de partidos programados
      const { count: totalMatchesCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true });
      
      partidosTotales = totalMatchesCount || 0;

      // Calcular progreso general
      const progreso = partidosTotales > 0 
        ? Math.round((partidosJugadosCount / partidosTotales) * 100)
        : 0;

      setStats({
        equiposInscritos: equiposCount || 0,
        equiposNuevos: equiposNuevosCount || 0,
        disciplinasActivas: disciplinasCount || 0,
        partidosJugados: partidosJugadosCount || 0,
        partidosTotales: partidosTotales,
        progresoGeneral: progreso,
      });

      // Cargar equipos que participan en el torneo activo
      let teamsData: any[] = [];
      
      if (tournaments && tournaments.length > 0) {
        const tournament = tournaments[0];
        const maxId = tournament.id;
        
        // Obtener todos los torneos del mismo lote de creación (IDs cercanos, mismo nombre)
        const { data: allTournamentsWithSameName } = await supabase
          .from("tournaments")
          .select("id")
          .eq("name", tournament.name)
          .gte("id", maxId - 10) // Buscar IDs cercanos (mismo lote)
          .lte("id", maxId)
          .order("id", { ascending: false });

        // Mostrar todos los equipos recientes (no filtrar por torneo)
        const { data: allTeamsData } = await supabase
          .from("teams")
          .select(`
            id,
            name,
            created_at,
            careers (
              id,
              name
            )
          `)
          .order("created_at", { ascending: false })
          .limit(5);
        
        teamsData = allTeamsData || [];
      } else {
        // Si no hay torneo, mostrar equipos recientes
        const { data: allTeamsData } = await supabase
          .from("teams")
          .select(`
            id,
            name,
            created_at,
            careers (
              id,
              name
            )
          `)
          .order("created_at", { ascending: false })
          .limit(5);
        
        teamsData = allTeamsData || [];
      }

      if (teamsData && teamsData.length > 0) {
        // Obtener todos los career_ids únicos
        const careerIds = teamsData
          .flatMap((team: any) => team.careers || [])
          .map((career: any) => career.id)
          .filter((id: number) => id);

        // Obtener todos los capitanes de una vez
        const { data: captainsData } = await supabase
          .from("players")
          .select("career_id, full_name")
          .in("career_id", careerIds)
          .eq("is_captain", true);

        // Crear un mapa de career_id -> captain name
        const captainsMap = new Map(
          captainsData?.map((c: any) => [c.career_id, c.full_name]) || []
        );

        // Mapear equipos con sus detalles
        const teamsWithDetails = teamsData.map((team: any) => {
          const faculty = team.careers && team.careers.length > 0 
            ? team.careers[0].name 
            : "Sin facultad";

          const careerId = team.careers && team.careers.length > 0 
            ? team.careers[0].id 
            : null;

          const captain = careerId && captainsMap.has(careerId)
            ? captainsMap.get(careerId)!
            : "Sin capitán";

          return {
            id: team.id,
            name: team.name,
            faculty: faculty,
            captain: captain,
            status: "Verificado",
          };
        });

        setRecentTeams(teamsWithDetails);
      } else {
        setRecentTeams([]);
      }

      // Cargar resultados recientes usando match_results y matches
      let results: RecentResult[] = [];

      // Obtener partidos con resultados confirmados
      const { data: matchResultsData } = await supabase
        .from("match_results")
        .select(`
          match_id,
          score_team_a,
          score_team_b,
          confirmed_at,
          matches!inner (
            id,
            team_a,
            team_b,
            scheduled_at,
            tournaments!inner (
              id,
              name,
              sports!inner (
                name
              )
            )
          )
        `)
        .order("confirmed_at", { ascending: false })
        .limit(3);

      if (matchResultsData && matchResultsData.length > 0) {
        // Obtener todos los IDs de equipos únicos
        const allTeamIds = [
          ...matchResultsData.map((mr: any) => mr.matches?.team_a),
          ...matchResultsData.map((mr: any) => mr.matches?.team_b),
        ];
        const teamIds = Array.from(new Set(allTeamIds)).filter(
          (id): id is number => id !== undefined && typeof id === "number"
        );

        // Obtener nombres de equipos
        const { data: teamsForResults } = await supabase
          .from("teams")
          .select("id, name")
          .in("id", teamIds);

        const teamsMap = new Map(
          teamsForResults?.map((t: any) => [t.id, t.name]) || []
        );

        results = matchResultsData.map((mr: any) => {
          const match = mr.matches;
          const scheduledAt = match?.scheduled_at 
            ? new Date(match.scheduled_at)
            : null;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          let dateLabel = "Sin fecha";
          if (scheduledAt) {
            if (scheduledAt.toDateString() === today.toDateString()) {
              dateLabel = "Hoy";
            } else if (scheduledAt.toDateString() === yesterday.toDateString()) {
              dateLabel = "Ayer";
            } else {
              dateLabel = scheduledAt.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              });
            }
          }

          const time = scheduledAt
            ? scheduledAt.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return {
            id: mr.match_id,
            sport: match?.tournaments?.sports?.name || "Deporte",
            category: "General",
            team1: teamsMap.get(match?.team_a) || "Equipo A",
            team2: teamsMap.get(match?.team_b) || "Equipo B",
            score1: mr.score_team_a || 0,
            score2: mr.score_team_b || 0,
            date: dateLabel,
            time: time,
          };
        });
      }

      setRecentResults(results);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return `${date.getDate()} de ${months[date.getMonth()]}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 dark:text-gray-500">
        Cargando torneo...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No hay torneo activo
      </div>
    );
  }

  const progressPartidos = stats.partidosTotales > 0
    ? Math.round((stats.partidosJugados / stats.partidosTotales) * 100)
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {tournament.name}
              </h1>
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  tournament.status === "EN CURSO"
                    ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400"
                }`}
              >
                {tournament.status}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                <span className="break-words">
                  {formatDate(tournament.start_date)} -{" "}
                  {formatDate(tournament.end_date)}
                </span>
              </div>
              <span className="hidden sm:inline">•</span>
              {tournament.location && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{tournament.location}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            {tournament && tournament.id > 0 && (
              <button 
                onClick={() => router.push(`/dashboard/torneos/${tournament.id}`)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition text-sm"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}
            <button 
              onClick={() => router.push("/dashboard/torneos/nuevo")}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Torneo</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <AdvancedStatCard
          icon={<Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
          value={stats.equiposInscritos.toString()}
          label="Equipos Inscritos"
          subtitle={stats.equiposNuevos > 0 ? `+${stats.equiposNuevos} nuevos` : undefined}
        />
        <AdvancedStatCard
          icon={<Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
          value={`${stats.disciplinasActivas} categorías`}
          label="Disciplinas Activas"
        />
        <AdvancedStatCard
          icon={<Square className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
          value={`${stats.partidosJugados} / ${stats.partidosTotales}`}
          label="Partidos Jugados"
          progress={progressPartidos}
          progressColor="orange"
        />
        <AdvancedStatCard
          icon={<TrendingUp className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
          value={`${stats.progresoGeneral}%`}
          label="Progreso General"
          progress={stats.progresoGeneral}
          progressColor="green"
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <ActionCard
          icon={<Network className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          title="Generar Brackets"
          description="Crear llaves de eliminación automática"
          variant="blue"
        />
        <ActionCard
          icon={<Calendar className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
          title="Programar Partidos"
          description="Asignar fechas y canchas pendientes"
        />
        <ActionCard
          icon={<Upload className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
          title="Publicar Resultados"
          description="Actualizar marcadores de la jornada"
        />
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Equipos Recientes */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
              Equipos Recientes
            </h3>
            <a
              href="#"
              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todos
            </a>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    EQUIPO
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    FACULTAD
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CAPITÁN
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ESTADO
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ACCIÓN
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {recentTeams.length > 0 ? (
                  recentTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition"
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {team.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {team.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {team.faculty}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {team.captain}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400">
                          {team.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No hay equipos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resultados Recientes y Documentos */}
        <div className="space-y-4 sm:space-y-6">
          {/* Resultados Recientes */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                Resultados Recientes
              </h3>
              <a
                href="#"
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver todo
              </a>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {recentResults.length > 0 ? (
                recentResults.map((result) => (
                  <div
                    key={result.id}
                    className="pb-4 border-b border-gray-200 dark:border-neutral-800 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.sport} - {result.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {result.date} {result.time && `, ${result.time}`}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{result.team1}</span>{" "}
                      <span className="font-bold">{result.score1}</span> -{" "}
                      <span className="font-bold">{result.score2}</span>{" "}
                      <span className="font-medium">{result.team2}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No hay resultados recientes disponibles
                </div>
              )}
            </div>
          </div>

          {/* Documentos */}
          <ActionCard
            icon={
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-700 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
            }
            title="Documentos"
            description="Descarga el reporte completo del torneo"
          />
        </div>
      </div>
    </div>
  );
}
