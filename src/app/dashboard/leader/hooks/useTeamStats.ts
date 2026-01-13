import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

export type TeamStats = {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  byDiscipline: Record<string, {
    matches: number;
    wins: number;
    losses: number;
    draws: number;
    points: number;
  }>;
};

const TEAM_STATS_QUERY_KEY = ["teamStats"];

const loadTeamStats = async (teamId: number): Promise<TeamStats> => {
  // Cargar todos los partidos finalizados del equipo
  const { data: matchesData, error: matchesError } = await supabase
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
    .or(`team_a.eq.${teamId},team_b.eq.${teamId}`)
    .eq("status", "finished");

  if (matchesError || !matchesData) {
    return {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      byDiscipline: {},
    };
  }

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  const byDiscipline: Record<string, {
    matches: number;
    wins: number;
    losses: number;
    draws: number;
    points: number;
  }> = {};

  matchesData.forEach((m: any) => {
    const sportName = m.tournaments?.sports?.name || "Desconocido";
    const scoreA = m.match_results?.[0]?.score_team_a || 0;
    const scoreB = m.match_results?.[0]?.score_team_b || 0;

    const isTeamA = m.team_a === teamId;
    const teamScore = isTeamA ? scoreA : scoreB;
    const opponentScore = isTeamA ? scoreB : scoreA;

    goalsFor += teamScore;
    goalsAgainst += opponentScore;

    // Inicializar disciplina si no existe
    if (!byDiscipline[sportName]) {
      byDiscipline[sportName] = {
        matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
      };
    }

    byDiscipline[sportName].matches += 1;

    // Determinar resultado
    if (teamScore > opponentScore) {
      wins += 1;
      byDiscipline[sportName].wins += 1;
      byDiscipline[sportName].points += 3; // Fútbol: 3 puntos por victoria
    } else if (teamScore < opponentScore) {
      losses += 1;
      byDiscipline[sportName].losses += 1;
    } else {
      draws += 1;
      byDiscipline[sportName].draws += 1;
      byDiscipline[sportName].points += 1; // Fútbol: 1 punto por empate
    }
  });

  // Calcular puntos totales (fútbol: 3 por victoria, 1 por empate)
  const points = wins * 3 + draws;

  return {
    totalMatches: matchesData.length,
    wins,
    losses,
    draws,
    goalsFor,
    goalsAgainst,
    points,
    byDiscipline,
  };
};

export const useTeamStats = (teamId: number | null) => {
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: [...TEAM_STATS_QUERY_KEY, teamId],
    queryFn: () => {
      if (!teamId) {
        return Promise.resolve({
          totalMatches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          byDiscipline: {},
        });
      }
      return loadTeamStats(teamId);
    },
    enabled: !!teamId,
  });

  return {
    stats: data || {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      byDiscipline: {},
    },
    loading: isLoading,
    isFetching,
    error,
  };
};
