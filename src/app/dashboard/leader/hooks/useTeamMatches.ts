import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

export type TeamMatch = {
  id: number;
  team_a_id: number;
  team_b_id: number;
  team_a_name: string;
  team_b_name: string;
  scheduled_at: string | null;
  field: string | null;
  status: string;
  sport_name: string;
  score_a: number | null;
  score_b: number | null;
  referee: string | null;
  assistant: string | null;
  genero: string | null;
};

const TEAM_MATCHES_QUERY_KEY = ["teamMatches"];

const loadTeamMatches = async (teamId: number): Promise<{
  upcoming: TeamMatch[];
  live: TeamMatch[];
  past: TeamMatch[];
}> => {
  // Cargar todos los partidos donde el equipo participa (como team_a o team_b)
  const { data: matchesData, error: matchesError } = await supabase
    .from("matches")
    .select(`
      id,
      team_a,
      team_b,
      scheduled_at,
      field,
      status,
      referee,
      assistant,
      tournaments!inner (
        sports!inner (
          name
        )
      ),
      genero,
      match_results (
        score_team_a,
        score_team_b
      )
    `)
    .or(`team_a.eq.${teamId},team_b.eq.${teamId}`)
    .order("scheduled_at", { ascending: false });

  if (matchesError) {
    console.error("Error cargando partidos:", matchesError);
    return { upcoming: [], live: [], past: [] };
  }

  if (!matchesData) {
    return { upcoming: [], live: [], past: [] };
  }

  // Obtener IDs de equipos únicos
  const teamIds = new Set<number>();
  matchesData.forEach((m: any) => {
    if (m.team_a) teamIds.add(m.team_a);
    if (m.team_b) teamIds.add(m.team_b);
  });

  // Cargar nombres de equipos
  const { data: teamsData } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", Array.from(teamIds));

  const teamsMap = new Map(teamsData?.map((t: any) => [t.id, t.name]) || []);

  // Cargar nombres de árbitros
  const refereeIds = matchesData
    .map((m: any) => m.referee)
    .filter((id): id is string => id !== null && id !== undefined);
  
  let refereesMap = new Map<string, string>();
  if (refereeIds.length > 0) {
    const { data: refereesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", refereeIds);

    refereesMap = new Map(
      refereesData?.map((r: any) => [r.id, r.full_name || "Sin nombre"]) || []
    );
  }

  // Cargar nombres de asistentes
  const assistantIds = matchesData
    .map((m: any) => m.assistant)
    .filter((id): id is string => id !== null && id !== undefined);
  
  let assistantsMap = new Map<string, string>();
  if (assistantIds.length > 0) {
    const { data: assistantsData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", assistantIds);

    assistantsMap = new Map(
      assistantsData?.map((a: any) => [a.id, a.full_name || "Sin nombre"]) || []
    );
  }

  // Procesar partidos
  const now = new Date().toISOString();
  const upcoming: TeamMatch[] = [];
  const live: TeamMatch[] = [];
  const past: TeamMatch[] = [];

  matchesData.forEach((m: any) => {
    // Obtener el resultado del partido (puede ser un array o un objeto)
    let scoreA = null;
    let scoreB = null;
    
    if (m.match_results) {
      // Si es un array, tomar el primer elemento
      const result = Array.isArray(m.match_results) ? m.match_results[0] : m.match_results;
      if (result) {
        scoreA = result.score_team_a ?? null;
        scoreB = result.score_team_b ?? null;
      }
    }
    
    const match: TeamMatch = {
      id: m.id,
      team_a_id: m.team_a,
      team_b_id: m.team_b,
      team_a_name: teamsMap.get(m.team_a) || "Equipo A",
      team_b_name: teamsMap.get(m.team_b) || "Equipo B",
      scheduled_at: m.scheduled_at,
      field: m.field,
      status: m.status,
      sport_name: m.tournaments?.sports?.name || "Deporte",
      score_a: scoreA,
      score_b: scoreB,
      referee: m.referee ? refereesMap.get(m.referee) || null : null,
      assistant: m.assistant ? assistantsMap.get(m.assistant) || null : null,
      genero: m.genero || null,
    };

    if (m.status === "in_progress" || m.status === "suspended") {
      // Partidos en curso o en entretiempo van a partidos en vivo
      live.push(match);
    } else if (m.status === "scheduled" && m.scheduled_at && m.scheduled_at >= now) {
      upcoming.push(match);
    } else if (m.status === "finished") {
      // Solo partidos finalizados van al historial
      past.push(match);
    } else if (m.status === "scheduled" && m.scheduled_at && m.scheduled_at < now) {
      // Partidos programados cuya fecha ya pasó pero no se han jugado, van a próximos
      // (pueden haberse pospuesto o cancelado)
      upcoming.push(match);
    }
  });

  // Ordenar: próximos por fecha ascendente, pasados por fecha descendente
  upcoming.sort((a, b) => {
    if (!a.scheduled_at) return 1;
    if (!b.scheduled_at) return -1;
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
  });

  past.sort((a, b) => {
    if (!a.scheduled_at) return 1;
    if (!b.scheduled_at) return -1;
    return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
  });

  return { upcoming, live, past };
};

export const useTeamMatches = (teamId: number | null) => {
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: [...TEAM_MATCHES_QUERY_KEY, teamId],
    queryFn: () => {
      if (!teamId) {
        return Promise.resolve({ upcoming: [], live: [], past: [] });
      }
      return loadTeamMatches(teamId);
    },
    enabled: !!teamId,
  });

  return {
    upcomingMatches: data?.upcoming || [],
    liveMatches: data?.live || [],
    pastMatches: data?.past || [],
    loading: isLoading,
    isFetching,
    error,
  };
};
