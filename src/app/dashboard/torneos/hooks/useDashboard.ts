// Hook para cargar datos del dashboard con TanStack Query
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";
import { Tournament, Team, RecentResult, TournamentStats } from "../types";

const DASHBOARD_QUERY_KEY = ["dashboard"];

const loadDashboardData = async (tournamentId?: number): Promise<{
  tournament: Tournament | null;
  stats: TournamentStats;
  recentTeams: Team[];
  recentResults: RecentResult[];
}> => {
  let tournament: Tournament | null = null;

  if (tournamentId) {
    // Cargar el torneo específico solicitado
    const { data: tournamentData } = await supabase
      .from("tournaments")
      .select("id, name, start_date, end_date")
      .eq("id", tournamentId)
      .single();

    if (tournamentData) {
      tournament = {
        id: tournamentData.id,
        name: tournamentData.name || "Torneo",
        start_date: tournamentData.start_date || "",
        end_date: tournamentData.end_date || "",
        location: undefined,
        status: "FINALIZADO", // Los torneos del historial están finalizados
      };
    } else {
      // Si no se encuentra, cargar el más reciente
      const { data: tournaments } = await supabase
        .from("tournaments")
        .select("id, name, start_date, end_date")
        .order("id", { ascending: false })
        .limit(1);

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
      }
    }
  } else {
    // Cargar torneo activo (el más reciente por ID máximo)
    // Agrupar por nombre para identificar el grupo más reciente
    const { data: allTournaments } = await supabase
      .from("tournaments")
      .select("id, name, start_date, end_date")
      .order("id", { ascending: false });

    if (allTournaments && allTournaments.length > 0) {
      // Agrupar por nombre
      type TournamentBasic = {
        id: number;
        name: string;
        start_date: string | null;
        end_date: string | null;
      };
      const tournamentsTyped: TournamentBasic[] = allTournaments as TournamentBasic[];
      const tournamentsGroupedByName = new Map<string, TournamentBasic[]>();
      tournamentsTyped.forEach((t) => {
        if (!tournamentsGroupedByName.has(t.name)) {
          tournamentsGroupedByName.set(t.name, []);
        }
        tournamentsGroupedByName.get(t.name)!.push(t);
      });

      // Encontrar el grupo con el ID más alto
      let latestTournament: TournamentBasic | null = null;
      let maxId = 0;

      for (const tournaments of tournamentsGroupedByName.values()) {
        const maxIdInGroup = Math.max(...tournaments.map(t => t.id));
        if (maxIdInGroup > maxId) {
          maxId = maxIdInGroup;
          const found = tournaments.find(t => t.id === maxIdInGroup);
          if (found) {
            latestTournament = found;
          }
        }
      }

      if (latestTournament) {
        tournament = {
          id: latestTournament.id,
          name: latestTournament.name || "Torneo",
          start_date: latestTournament.start_date || "",
          end_date: latestTournament.end_date || "",
          location: undefined,
          status: "EN CURSO",
        };
      }
    }
  }

  if (!tournament) {
    tournament = {
      id: 0,
      name: "Sin torneo activo",
      start_date: "",
      end_date: "",
      location: undefined,
      status: "SIN INICIAR",
    };
  }

  // Obtener el ID del torneo activo (una sola vez)
  const activeTournamentId = tournamentId || tournament?.id;

  // Contar equipos (si hay un torneo específico, contar solo los que participan en ese torneo)
  let equiposCount = 0;
  
  if (activeTournamentId && activeTournamentId > 0) {
    // Contar equipos que participan en partidos de este torneo
    const { data: matchesData } = await supabase
      .from("matches")
      .select("team_a, team_b")
      .eq("tournament_id", activeTournamentId);
    
    if (matchesData) {
      const teamIds = new Set<number>();
      matchesData.forEach((match) => {
        if (match.team_a) teamIds.add(match.team_a);
        if (match.team_b) teamIds.add(match.team_b);
      });
      equiposCount = teamIds.size;
    }
  } else {
    // Si no hay torneo activo, no hay equipos
    equiposCount = 0;
  }

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

  // Contar partidos (filtrar por torneo activo)
  let finishedMatchesCount = 0;
  let totalMatchesCount = 0;
  
  if (activeTournamentId && activeTournamentId > 0) {
    // Contar partidos finalizados del torneo activo
    const { count: finished } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", activeTournamentId)
      .eq("status", "finished");
    finishedMatchesCount = finished || 0;

    // Contar todos los partidos del torneo activo
    const { count: total } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", activeTournamentId);
    totalMatchesCount = total || 0;
  } else {
    // Si no hay torneo activo, no hay partidos
    finishedMatchesCount = 0;
    totalMatchesCount = 0;
  }

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
    type TeamWithCareers = {
      id: number;
      name: string;
      careers?: Array<{ id: number; name: string }>;
    };
    
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

    recentTeams = (allTeamsData as TeamWithCareers[]).map((team: TeamWithCareers) => {
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
  }

  // Cargar resultados recientes (solo partidos finalizados del torneo activo)
  let query = supabase
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

  if (activeTournamentId && activeTournamentId > 0) {
    query = query.eq("tournament_id", activeTournamentId);
  } else {
    // Si no hay torneo activo, no mostrar resultados
    query = query.eq("id", -1); // Query que no devuelve nada
  }

  const { data: finishedMatches } = await query;

  let recentResults: RecentResult[] = [];
  if (finishedMatches && finishedMatches.length > 0) {
    type FinishedMatch = {
      id: number;
      team_a: number | null;
      team_b: number | null;
      scheduled_at: string | null;
      ended_at: string | null;
      status: string;
      tournaments?: {
        id: number;
        name: string;
        sports?: {
          name: string;
        } | Array<{
          name: string;
        }>;
      } | Array<{
        id: number;
        name: string;
        sports?: {
          name: string;
        } | Array<{
          name: string;
        }>;
      }>;
    };

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

    const matchResultsData: MatchResultData[] = (finishedMatches as FinishedMatch[]).map((match: FinishedMatch) => {
      const result = (resultsData as MatchResult[] | null)?.find((r: MatchResult) => r.match_id === match.id);
      return {
        match_id: match.id,
        score_team_a: result?.score_team_a ?? null,
        score_team_b: result?.score_team_b ?? null,
        confirmed_at: result?.confirmed_at || match.ended_at,
        matches: match,
      };
    });

    const allTeamIds = [
      ...matchResultsData.map((mr: MatchResultData) => mr.matches?.team_a),
      ...matchResultsData.map((mr: MatchResultData) => mr.matches?.team_b),
    ];
    const teamIds = Array.from(new Set(allTeamIds)).filter(
      (id): id is number => id !== undefined && typeof id === "number"
    );

    const { data: teamsData } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", teamIds);

    type TeamData = {
      id: number;
      name: string;
    };

    const teamsMap = new Map((teamsData as TeamData[] | null)?.map((t: TeamData) => [t.id, t.name]) || []);

    recentResults = matchResultsData.map((mr: MatchResultData) => {
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

      // Manejar tournaments como objeto o array
      const tournamentsData = Array.isArray(match?.tournaments) ? match.tournaments[0] : match?.tournaments;
      const sportsData = Array.isArray(tournamentsData?.sports) ? tournamentsData?.sports[0] : tournamentsData?.sports;

      return {
        id: mr.match_id,
        sport: sportsData?.name || "Deporte",
        category: "General",
        team1: match?.team_a !== null && match?.team_a !== undefined ? (teamsMap.get(match.team_a) || "Equipo A") : "Equipo A",
        team2: match?.team_b !== null && match?.team_b !== undefined ? (teamsMap.get(match.team_b) || "Equipo B") : "Equipo B",
        score1: mr.score_team_a,
        score2: mr.score_team_b,
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

export const useDashboard = (tournamentId?: number) => {
  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, tournamentId],
    queryFn: () => loadDashboardData(tournamentId),
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
