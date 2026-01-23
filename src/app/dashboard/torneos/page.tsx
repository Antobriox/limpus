// Página principal de torneos - Refactorizada y organizada
"use client";

import { useState } from "react";
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
  X,
} from "lucide-react";
import { Team, RecentResult } from "./types";
import DocumentsModal from "./components/DocumentsModal";
import { useDashboard } from "./hooks/useDashboard";

export default function TorneosPage() {
  const router = useRouter();
  // Usar el hook con TanStack Query - los datos se cargan automáticamente y se cachean
  const { tournament, stats, recentTeams, recentResults, loading } = useDashboard();
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showAllTeamsModal, setShowAllTeamsModal] = useState(false);
  const [showAllResultsModal, setShowAllResultsModal] = useState(false);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allResults, setAllResults] = useState<RecentResult[]>([]);
  const [loadingAllTeams, setLoadingAllTeams] = useState(false);
  const [loadingAllResults, setLoadingAllResults] = useState(false);

  // Los datos se cargan automáticamente con TanStack Query (caché)
  // No necesitamos la función loadData

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

  const loadAllTeams = async () => {
    setLoadingAllTeams(true);
    try {
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
        .order("created_at", { ascending: false });

      type TeamWithCareers = {
        id: number;
        name: string;
        created_at: string;
        careers?: Array<{
          id: number;
          name: string;
        }>;
      };
      if (allTeamsData && allTeamsData.length > 0) {
        // Obtener los IDs de los equipos
        const teamIds = (allTeamsData as TeamWithCareers[]).map((team: TeamWithCareers) => team.id);

        // Cargar líderes de equipo desde team_leaders
        const { data: teamLeadersData } = await supabase
          .from("team_leaders")
          .select("team_id, user_id")
          .in("team_id", teamIds);

        type TeamLeaderData = {
          team_id: number;
          user_id: string;
        };

        // Obtener todos los user_ids únicos
        const userIds = teamLeadersData 
          ? [...new Set((teamLeadersData as TeamLeaderData[]).map((tl: TeamLeaderData) => tl.user_id))]
          : [];

        // Cargar los perfiles de los líderes
        let profilesMap = new Map<string, string>();
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);

          if (profilesData) {
            profilesMap = new Map(
              (profilesData as Array<{ id: string; full_name: string | null }>).map((p) => [
                p.id,
                p.full_name || "Sin nombre"
              ])
            );
          }
        }

        // Crear un mapa de team_id -> nombres de líderes
        const leadersMap = new Map<number, string[]>();
        if (teamLeadersData) {
          (teamLeadersData as TeamLeaderData[]).forEach((tl: TeamLeaderData) => {
            const leaderName = profilesMap.get(tl.user_id);
            if (leaderName) {
              if (!leadersMap.has(tl.team_id)) {
                leadersMap.set(tl.team_id, []);
              }
              leadersMap.get(tl.team_id)!.push(leaderName);
            }
          });
        }

        const teamsWithDetails = (allTeamsData as TeamWithCareers[]).map((team: TeamWithCareers) => {
          const faculty = team.careers && team.careers.length > 0 
            ? team.careers[0].name 
            : "Sin facultad";

          // Obtener los líderes del equipo
          const teamLeaders = leadersMap.get(team.id) || [];
          const captain = teamLeaders.length > 0
            ? teamLeaders.join(", ")
            : "Sin líder de equipo";

          return {
            id: team.id,
            name: team.name,
            faculty: faculty,
            captain: captain,
            status: "Verificado",
          };
        });

        setAllTeams(teamsWithDetails);
      } else {
        setAllTeams([]);
      }
    } catch (error) {
      console.error("Error cargando todos los equipos:", error);
    } finally {
      setLoadingAllTeams(false);
    }
  };

  const loadAllResults = async () => {
    setLoadingAllResults(true);
    try {
      const { data: finishedMatches } = await supabase
        .from("matches")
        .select(`
          id,
          team_a,
          team_b,
          scheduled_at,
          ended_at,
          status,
          tournaments!inner (
            id,
            name,
            sports!inner (
              name
            )
          )
        `)
        .eq("status", "finished")
        .order("ended_at", { ascending: false, nullsFirst: false });

      type FinishedMatch = {
        id: number;
        team_a: number | null;
        team_b: number | null;
        scheduled_at: string | null;
        ended_at: string | null;
        status: string;
        tournaments: {
          id: number;
          name: string;
          sports: {
            name: string;
          };
        };
      };
      type MatchResult = {
        match_id: number;
        score_team_a: number | null;
        score_team_b: number | null;
        confirmed_at: string | null;
      };
      type MatchResultData = {
        match_id: number;
        score_team_a: number | null;
        score_team_b: number | null;
        confirmed_at: string | null;
        matches: FinishedMatch;
      };
      let matchResultsData: MatchResultData[] = [];
      if (finishedMatches && finishedMatches.length > 0) {
        const matchIds = (finishedMatches as FinishedMatch[]).map((m: FinishedMatch) => m.id);
        const { data: resultsData } = await supabase
          .from("match_results")
          .select(`
            match_id,
            score_team_a,
            score_team_b,
            confirmed_at
          `)
          .in("match_id", matchIds);

        matchResultsData = (finishedMatches as FinishedMatch[]).map((match: FinishedMatch) => {
          const result = (resultsData as MatchResult[] | null)?.find((r: MatchResult) => r.match_id === match.id);
          return {
            match_id: match.id,
            score_team_a: result?.score_team_a ?? null,
            score_team_b: result?.score_team_b ?? null,
            confirmed_at: result?.confirmed_at || match.ended_at,
            matches: match,
          };
        });
      }

      let results: RecentResult[] = [];

      if (matchResultsData && matchResultsData.length > 0) {
        const allTeamIds = [
          ...matchResultsData.map((mr: MatchResultData) => mr.matches?.team_a),
          ...matchResultsData.map((mr: MatchResultData) => mr.matches?.team_b),
        ];
        const teamIds = Array.from(new Set(allTeamIds)).filter(
          (id): id is number => id !== undefined && typeof id === "number"
        );

        const { data: teamsForResults } = await supabase
          .from("teams")
          .select("id, name")
          .in("id", teamIds);

        type TeamData = {
          id: number;
          name: string;
        };
        const teamsMap = new Map(
          (teamsForResults as TeamData[] | null)?.map((t: TeamData) => [t.id, t.name]) || []
        );

        results = matchResultsData.map((mr: MatchResultData) => {
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
            score1: mr.score_team_a,
            score2: mr.score_team_b,
            date: dateLabel,
            time: time,
          };
        });
      }

      setAllResults(results);
    } catch (error) {
      console.error("Error cargando todos los resultados:", error);
    } finally {
      setLoadingAllResults(false);
    }
  };

  const handleOpenAllTeams = () => {
    setShowAllTeamsModal(true);
    if (allTeams.length === 0) {
      loadAllTeams();
    }
  };

  const handleOpenAllResults = () => {
    setShowAllResultsModal(true);
    if (allResults.length === 0) {
      loadAllResults();
    }
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
                  {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                </span>
              </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <ActionCard
          icon={<Network className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
          title="Generar Brackets"
          description="Crear llaves de eliminación automática"
          onClick={() => router.push("/dashboard/torneos/brackets")}
        />
        <ActionCard
          icon={<Calendar className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
          title="Programar Partidos"
          description="Asignar fechas y canchas pendientes"
          onClick={() => router.push("/dashboard/torneos/programar")}
        />
        <ActionCard
          icon={<Upload className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
          title="Publicar Resultados"
          description="Actualizar marcadores de la jornada"
          onClick={() => router.push("/dashboard/torneos/resultados")}
        />
        <ActionCard
          icon={<TrendingUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
          title="Tablas de Posiciones"
          description="Ver clasificación por disciplina"
          onClick={() => router.push("/dashboard/torneos/tablas")}
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
            <button
              onClick={handleOpenAllTeams}
              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todos
            </button>
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
                    LÍDER DE EQUIPOS
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
              <button
                onClick={handleOpenAllResults}
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver todo
              </button>
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
            description="Agregar y gestionar documentos PDF del torneo"
            onClick={() => setShowDocumentsModal(true)}
          />
        </div>
      </div>

      {/* Modales */}
      <DocumentsModal
        isOpen={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
        tournament={tournament}
      />

      {/* Modal: Todos los Equipos */}
      {showAllTeamsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col mx-2 sm:mx-0 my-2 sm:my-4">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white pr-2">
                Todos los Equipos
              </h2>
              <button
                onClick={() => setShowAllTeamsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingAllTeams ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Cargando equipos...</p>
                </div>
              ) : allTeams.length > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-gray-50 dark:bg-neutral-800">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          EQUIPO
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          FACULTAD
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          LÍDER DE EQUIPOS
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          ESTADO
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                      {allTeams.map((team) => (
                        <tr
                          key={team.id}
                          className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition"
                        >
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                                {team.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                                {team.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                            {team.faculty}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                            {team.captain}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400">
                              {team.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No hay equipos registrados
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-neutral-800 flex justify-end">
              <button
                onClick={() => setShowAllTeamsModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Todos los Resultados */}
      {showAllResultsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col mx-2 sm:mx-0 my-2 sm:my-4">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white pr-2">
                Todos los Resultados
              </h2>
              <button
                onClick={() => setShowAllResultsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingAllResults ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Cargando resultados...</p>
                </div>
              ) : allResults.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {allResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-3 sm:p-4 border border-gray-200 dark:border-neutral-800 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          {result.sport} - {result.category}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {result.date} {result.time && `, ${result.time}`}
                        </span>
                      </div>
                      <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        <span className="font-medium">{result.team1}</span>{" "}
                        <span className="font-bold text-base sm:text-lg">{result.score1}</span> -{" "}
                        <span className="font-bold text-base sm:text-lg">{result.score2}</span>{" "}
                        <span className="font-medium">{result.team2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  No hay resultados disponibles
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-neutral-800 flex justify-end">
              <button
                onClick={() => setShowAllResultsModal(false)}
                className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors text-sm sm:text-base"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
