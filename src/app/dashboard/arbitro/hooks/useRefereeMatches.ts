import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

type SupabaseMatch = {
  id: number;
  team_a: number | null;
  team_b: number | null;
  scheduled_at: string | null;
  field: string | null;
  status: string;
  referee: string | null;
  assistant: string | null;
  genero: string | null;
  tournament_id: number | null;
  tournaments?: {
    sports?: { name: string };
  };
  match_results?: {
    score_team_a: number | null;
    score_team_b: number | null;
  } | Array<{ score_team_a: number | null; score_team_b: number | null }>;
};

type SupabaseTeam = { id: number; name: string };
type SupabaseProfile = { id: string; full_name: string | null };

export type RefereeMatch = {
  id: number;
  team_a_id: number | null;
  team_b_id: number | null;
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
  miRol: "árbitro" | "asistente";
};

const REFEREE_MATCHES_QUERY_KEY = ["refereeMatches"];

async function loadActiveTournamentIds(): Promise<number[]> {
  const { data: activeEdition } = await supabase
    .from("tournament_editions")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!activeEdition) return [];
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id")
    .eq("edition_id", activeEdition.id);
  return (tournaments || []).map((t: { id: number }) => t.id);
}

async function loadRefereeMatches(userId: string | null): Promise<{
  upcoming: RefereeMatch[];
  live: RefereeMatch[];
  past: RefereeMatch[];
}> {
  if (!userId) return { upcoming: [], live: [], past: [] };

  const tournamentIds = await loadActiveTournamentIds();
  if (tournamentIds.length === 0) return { upcoming: [], live: [], past: [] };

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
      genero,
      tournament_id,
      tournaments (
        sports ( name )
      ),
      match_results ( score_team_a, score_team_b )
    `)
    .or(`referee.eq.${userId},assistant.eq.${userId}`)
    .in("tournament_id", tournamentIds)
    .order("scheduled_at", { ascending: false });

  if (matchesError || !matchesData) {
    return { upcoming: [], live: [], past: [] };
  }

  const teamIds = new Set<number>();
  (matchesData as SupabaseMatch[]).forEach((m: SupabaseMatch) => {
    if (m.team_a) teamIds.add(m.team_a);
    if (m.team_b) teamIds.add(m.team_b);
  });

  const { data: teamsData } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", Array.from(teamIds));
  const teamsMap = new Map((teamsData as SupabaseTeam[] | null)?.map((t) => [t.id, t.name]) || []);

  const refereeIds = (matchesData as SupabaseMatch[])
    .map((m) => m.referee)
    .filter((id): id is string => id != null);
  let refereesMap = new Map<string, string>();
  if (refereeIds.length > 0) {
    const { data: refData } = await supabase.from("profiles").select("id, full_name").in("id", refereeIds);
    refereesMap = new Map((refData as SupabaseProfile[] | null)?.map((r) => [r.id, r.full_name || "Sin nombre"]) || []);
  }

  const assistantIds = (matchesData as SupabaseMatch[])
    .map((m) => m.assistant)
    .filter((id): id is string => id != null);
  let assistantsMap = new Map<string, string>();
  if (assistantIds.length > 0) {
    const { data: astData } = await supabase.from("profiles").select("id, full_name").in("id", assistantIds);
    assistantsMap = new Map((astData as SupabaseProfile[] | null)?.map((a) => [a.id, a.full_name || "Sin nombre"]) || []);
  }

  const upcoming: RefereeMatch[] = [];
  const live: RefereeMatch[] = [];
  const past: RefereeMatch[] = [];

  (matchesData as SupabaseMatch[]).forEach((m: SupabaseMatch) => {
    let scoreA: number | null = null;
    let scoreB: number | null = null;
    if (m.match_results) {
      const r = Array.isArray(m.match_results) ? m.match_results[0] : m.match_results;
      if (r) {
        scoreA = r.score_team_a ?? null;
        scoreB = r.score_team_b ?? null;
      }
    }
    const sportName = (m.tournaments as { sports?: { name: string } } | null)?.sports?.name || "Deporte";
    const match: RefereeMatch = {
      id: m.id,
      team_a_id: m.team_a,
      team_b_id: m.team_b,
      team_a_name: m.team_a != null ? (teamsMap.get(m.team_a) || "Equipo A") : "Equipo A",
      team_b_name: m.team_b != null ? (teamsMap.get(m.team_b) || "Equipo B") : "Equipo B",
      scheduled_at: m.scheduled_at,
      field: m.field,
      status: m.status,
      sport_name: sportName,
      score_a: scoreA,
      score_b: scoreB,
      referee: m.referee ? refereesMap.get(m.referee) || null : null,
      assistant: m.assistant ? assistantsMap.get(m.assistant) || null : null,
      genero: m.genero || null,
      miRol: m.referee === userId ? "árbitro" : "asistente",
    };

    if (m.status === "in_progress" || m.status === "suspended") {
      live.push(match);
    } else if (m.status === "scheduled" && m.scheduled_at) {
      upcoming.push(match);
    } else if (m.status === "finished") {
      past.push(match);
    }
  });

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
}

export function useRefereeMatches(userId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: [...REFEREE_MATCHES_QUERY_KEY, userId],
    queryFn: () => loadRefereeMatches(userId),
    enabled: !!userId,
  });

  return {
    upcomingMatches: data?.upcoming ?? [],
    liveMatches: data?.live ?? [],
    pastMatches: data?.past ?? [],
    loading: isLoading,
    error,
  };
}
