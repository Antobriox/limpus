// Hook para cargar datos de la página de viewers con TanStack Query
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

export type Sport = {
  id: number;
  name: string;
};

export type LiveMatch = {
  id: number;
  team_a_name: string;
  team_b_name: string;
  score_a: number;
  score_b: number;
  sport_name: string;
  status: string;
};

export type UpcomingMatch = {
  id: number;
  team_a_name: string;
  team_b_name: string;
  scheduled_at: string;
  field: string | null;
  sport_name: string;
};

const VIEWERS_DATA_QUERY_KEY = ["viewersData"];

const loadViewersData = async (): Promise<{
  tournamentName: string;
  sports: Sport[];
  liveMatches: LiveMatch[];
  upcomingMatches: UpcomingMatch[];
}> => {
  // Cargar torneo activo
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("name")
    .order("id", { ascending: false })
    .limit(1);

  const tournamentName = tournaments && tournaments.length > 0
    ? tournaments[0].name || "Olimpiadas Universitarias"
    : "Olimpiadas Universitarias";

  // Cargar deportes
  const { data: sportsData } = await supabase
    .from("sports")
    .select("id, name")
    .order("name", { ascending: true });

  const sports: Sport[] = sportsData || [];

  // Cargar partidos en vivo (status = "in_progress")
  const { data: liveMatchesData } = await supabase
    .from("matches")
    .select(`
      id,
      team_a,
      team_b,
      status,
      tournaments!inner (
        sports!inner (
          name
        )
      ),
      match_results (
        score_team_a,
        score_team_b
      )
    `)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(10);

  let liveMatches: LiveMatch[] = [];
  if (liveMatchesData && liveMatchesData.length > 0) {
    const teamIds = [
      ...liveMatchesData.map((m: any) => m.team_a),
      ...liveMatchesData.map((m: any) => m.team_b),
    ].filter((id): id is number => id !== null && id !== undefined);

    const { data: teamsData } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", teamIds);

    const teamsMap = new Map(teamsData?.map((t: any) => [t.id, t.name]) || []);

    liveMatches = liveMatchesData.map((m: any) => ({
      id: m.id,
      team_a_name: teamsMap.get(m.team_a) || "Equipo A",
      team_b_name: teamsMap.get(m.team_b) || "Equipo B",
      score_a: m.match_results?.[0]?.score_team_a || 0,
      score_b: m.match_results?.[0]?.score_team_b || 0,
      sport_name: m.tournaments?.sports?.name || "Deporte",
      status: m.status,
    }));
  }

  // Cargar próximos partidos (status = "scheduled" y scheduled_at en el futuro)
  const now = new Date().toISOString();
  const { data: upcomingMatchesData } = await supabase
    .from("matches")
    .select(`
      id,
      team_a,
      team_b,
      scheduled_at,
      field,
      tournaments!inner (
        sports!inner (
          name
        )
      )
    `)
    .eq("status", "scheduled")
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(20);

  let upcomingMatches: UpcomingMatch[] = [];
  if (upcomingMatchesData && upcomingMatchesData.length > 0) {
    const teamIds = [
      ...upcomingMatchesData.map((m: any) => m.team_a),
      ...upcomingMatchesData.map((m: any) => m.team_b),
    ].filter((id): id is number => id !== null && id !== undefined);

    const { data: teamsData } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", teamIds);

    const teamsMap = new Map(teamsData?.map((t: any) => [t.id, t.name]) || []);

    upcomingMatches = upcomingMatchesData.map((m: any) => ({
      id: m.id,
      team_a_name: teamsMap.get(m.team_a) || "Equipo A",
      team_b_name: teamsMap.get(m.team_b) || "Equipo B",
      scheduled_at: m.scheduled_at,
      field: m.field,
      sport_name: m.tournaments?.sports?.name || "Deporte",
    }));
  }

  return {
    tournamentName,
    sports,
    liveMatches,
    upcomingMatches,
  };
};

export const useViewersData = () => {
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: VIEWERS_DATA_QUERY_KEY,
    queryFn: loadViewersData,
    // staleTime y gcTime se heredan de la configuración global (10min y 30min)
  });

  return {
    tournamentName: data?.tournamentName || "Olimpiadas Universitarias",
    sports: data?.sports || [],
    liveMatches: data?.liveMatches || [],
    upcomingMatches: data?.upcomingMatches || [],
    loading: isLoading, // Solo true en primera carga
    isFetching, // true cuando está refetching en background
    error,
  };
};
