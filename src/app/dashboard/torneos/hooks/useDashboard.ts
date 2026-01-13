// Hook para cargar datos del dashboard con TanStack Query
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";
import { Tournament, Team, RecentResult, TournamentStats } from "../types";

const DASHBOARD_QUERY_KEY = ["dashboard"];

const loadDashboardData = async (): Promise<{
  tournament: Tournament | null;
  stats: TournamentStats;
  recentTeams: Team[];
  recentResults: RecentResult[];
}> => {
  // Cargar torneo activo (el más reciente)
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, start_date, end_date")
    .order("id", { ascending: false })
    .limit(1);

  let tournament: Tournament | null = null;
  if (tournaments && tournaments.length > 0) {
    const t = tournaments[0];
    tournament = {
      id: t.id,
      name: t.name || "Torneo",
      start_date: t.start_date || "",
      end_date: t.end_date || "",
      location: undefined,
      status: "EN CURSO",
    };
  } else {
    tournament = {
      id: 0,
      name: "Sin torneo activo",
      start_date: "",
      end_date: "",
      location: undefined,
      status: "SIN INICIAR",
    };
  }

  // Contar TODOS los equipos
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

  // Contar partidos finalizados
  const { count: finishedMatchesCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("status", "finished");

  // Contar todos los partidos
  const { count: totalMatchesCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true });

  const partidosJugadosCount = finishedMatchesCount || 0;
  const partidosTotales = totalMatchesCount || 0;
  const progreso = partidosTotales > 0 
    ? Math.round((partidosJugadosCount / partidosTotales) * 100)
    : 0;

  const stats: TournamentStats = {
    equiposInscritos: equiposCount || 0,
    equiposNuevos: equiposNuevosCount || 0,
    disciplinasActivas: disciplinasCount || 0,
    partidosJugados: partidosJugadosCount || 0,
    partidosTotales: partidosTotales,
    progresoGeneral: progreso,
  };

  // Cargar equipos recientes
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

  let recentTeams: Team[] = [];
  if (allTeamsData && allTeamsData.length > 0) {
    const careerIds = allTeamsData
      .flatMap((team: any) => team.careers || [])
      .map((career: any) => career.id)
      .filter((id: number) => id);

    const { data: captainsData } = await supabase
      .from("players")
      .select("career_id, full_name")
      .in("career_id", careerIds)
      .eq("is_captain", true);

    const captainsMap = new Map(
      captainsData?.map((c: any) => [c.career_id, c.full_name]) || []
    );

    recentTeams = allTeamsData.map((team: any) => {
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
  }

  // Cargar resultados recientes (solo partidos finalizados)
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
    .order("ended_at", { ascending: false, nullsFirst: false })
    .limit(5);

  let recentResults: RecentResult[] = [];
  if (finishedMatches && finishedMatches.length > 0) {
    const matchIds = finishedMatches.map((m: any) => m.id);
    const { data: resultsData } = await supabase
      .from("match_results")
      .select(`
        match_id,
        score_team_a,
        score_team_b,
        confirmed_at
      `)
      .in("match_id", matchIds);

    const matchResultsData = finishedMatches.map((match: any) => {
      const result = resultsData?.find((r: any) => r.match_id === match.id);
      return {
        match_id: match.id,
        score_team_a: result?.score_team_a || 0,
        score_team_b: result?.score_team_b || 0,
        confirmed_at: result?.confirmed_at || match.ended_at,
        matches: match,
      };
    });

    const allTeamIds = [
      ...matchResultsData.map((mr: any) => mr.matches?.team_a),
      ...matchResultsData.map((mr: any) => mr.matches?.team_b),
    ];
    const teamIds = Array.from(new Set(allTeamIds)).filter(
      (id): id is number => id !== undefined && typeof id === "number"
    );

    const { data: teamsData } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", teamIds);

    const teamsMap = new Map(teamsData?.map((t: any) => [t.id, t.name]) || []);

    recentResults = matchResultsData.map((mr: any) => {
      const match = mr.matches;
      const date = match.ended_at || match.scheduled_at;
      const dateLabel = date
        ? new Date(date).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          })
        : "";
      const time = date
        ? new Date(date).toLocaleTimeString("es-ES", {
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

  return {
    tournament,
    stats,
    recentTeams,
    recentResults,
  };
};

export const useDashboard = () => {
  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: loadDashboardData,
    // staleTime y gcTime se heredan de la configuración global
  });

  return {
    tournament: data?.tournament || null,
    stats: data?.stats || {
      equiposInscritos: 0,
      equiposNuevos: 0,
      disciplinasActivas: 0,
      partidosJugados: 0,
      partidosTotales: 0,
      progresoGeneral: 0,
    },
    recentTeams: data?.recentTeams || [],
    recentResults: data?.recentResults || [],
    loading: isLoading, // Solo true en primera carga
  };
};
