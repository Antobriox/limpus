// Hook para cargar datos del dashboard con TanStack Query
// Regla: todo se basa en edition_id. Torneo activo = tournament_editions.status = 'active'.
// activeTournamentIds = tournaments donde edition_id = X. Stats/equipos/partidos filtran por esos IDs.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";
import { Tournament, Team, RecentResult, TournamentStats } from "../types";

const DASHBOARD_QUERY_KEY = ["dashboard"];

type EditionRow = {
  id: number;
  name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  created_at?: string | null;
};

const loadDashboardData = async (editionId?: number): Promise<{
  currentEditionId: number | null;
  currentEditionCreatedAt: string | null;
  tournament: Tournament | null;
  activeTournamentIds: number[];
  stats: TournamentStats;
  recentTeams: Team[];
  recentResults: RecentResult[];
}> => {
  let tournament: Tournament | null = null;
  let activeTournamentIds: number[] = [];
  let currentEditionId: number | null = null;

  // Resolver la edición: por parámetro (historial) o por status = 'active' (torneo actual)
  let edition: EditionRow | null = null;

  if (editionId != null && editionId > 0) {
    const { data: editionData } = await supabase
      .from("tournament_editions")
      .select("id, name, start_date, end_date, status, created_at")
      .eq("id", editionId)
      .single();
    edition = editionData as EditionRow | null;
  } else {
    const { data: activeEdition } = await supabase
      .from("tournament_editions")
      .select("id, name, start_date, end_date, status, created_at")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    edition = activeEdition as EditionRow | null;
  }

  if (edition) {
    currentEditionId = edition.id;
    const { data: tournamentRows } = await supabase
      .from("tournaments")
      .select("id")
      .eq("edition_id", edition.id);
    activeTournamentIds = (tournamentRows as Array<{ id: number }> | null)?.map((r) => r.id) ?? [];

    const isActive = edition.status === "active";
    tournament = {
      id: edition.id, // Usar el ID de la edición, no del torneo
      name: edition.name ?? "Torneo",
      start_date: edition.start_date ?? "",
      end_date: edition.end_date ?? "",
      location: undefined,
      status: isActive ? "EN CURSO" : "FINALIZADO",
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

  // Stats y listas: solo datos de activeTournamentIds. Si no hay edición, todo en 0 / vacío.
  let equiposCount = 0;
  let equiposNuevosCount = 0;
  const { count: disciplinasCount } = await supabase
    .from("sports")
    .select("*", { count: "exact", head: true });

  let finishedMatchesCount = 0;
  let totalMatchesCount = 0;

  if (currentEditionId != null && currentEditionId > 0) {
    // Equipos inscritos = equipos de esta edición (por edition_id, no por partidos)
    const { count: teamsCount } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("edition_id", currentEditionId);
    equiposCount = teamsCount ?? 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: newTeamsCount } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("edition_id", currentEditionId)
      .gte("created_at", sevenDaysAgo.toISOString());
    equiposNuevosCount = newTeamsCount ?? 0;
  }

  if (activeTournamentIds.length > 0) {
    const { count: finished } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .in("tournament_id", activeTournamentIds)
      .eq("status", "finished");
    finishedMatchesCount = finished || 0;

    const { count: total } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .in("tournament_id", activeTournamentIds);
    totalMatchesCount = total || 0;
  }

  const partidosJugadosCount = finishedMatchesCount || 0;
  const partidosTotales = totalMatchesCount || 0;
  const progreso = partidosTotales > 0
    ? Math.round((partidosJugadosCount / partidosTotales) * 100)
    : 0;

  const stats: TournamentStats = {
    equiposInscritos: equiposCount,
    equiposNuevos: equiposNuevosCount,
    disciplinasActivas: disciplinasCount || 0,
    partidosJugados: partidosJugadosCount,
    partidosTotales,
    progresoGeneral: progreso,
  };

  // Equipos recientes: equipos de esta edición por edition_id (no dependen de partidos)
  let recentTeams: Team[] = [];
  if (currentEditionId != null && currentEditionId > 0) {
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
      .eq("edition_id", currentEditionId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (allTeamsData && allTeamsData.length > 0) {
      type TeamWithCareers = {
        id: number;
        name: string;
        careers?: Array<{ id: number; name: string }>;
      };
      const teamIds = (allTeamsData as TeamWithCareers[]).map((t: TeamWithCareers) => t.id);

      const { data: teamLeadersData } = await supabase
        .from("team_leaders")
        .select("team_id, user_id")
        .in("team_id", teamIds);

      type TeamLeaderData = { team_id: number; user_id: string };
      const userIds = teamLeadersData
        ? [...new Set((teamLeadersData as TeamLeaderData[]).map((tl: TeamLeaderData) => tl.user_id))]
        : [];

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
              p.full_name || "Sin nombre",
            ])
          );
        }
      }

      const leadersMap = new Map<number, string[]>();
      if (teamLeadersData) {
        (teamLeadersData as TeamLeaderData[]).forEach((tl: TeamLeaderData) => {
          const leaderName = profilesMap.get(tl.user_id);
          if (leaderName) {
            if (!leadersMap.has(tl.team_id)) leadersMap.set(tl.team_id, []);
            leadersMap.get(tl.team_id)!.push(leaderName);
          }
        });
      }

      recentTeams = (allTeamsData as TeamWithCareers[]).map((team: TeamWithCareers) => {
        const faculty = team.careers && team.careers.length > 0 ? team.careers[0].name : "Sin facultad";
        const teamLeaders = leadersMap.get(team.id) || [];
        const captain = teamLeaders.length > 0 ? teamLeaders.join(", ") : "Sin líder de equipo";
        return {
          id: team.id,
          name: team.name,
          faculty,
          captain,
          status: "Verificado",
        };
      }).slice(0, 5);
    }
  }

  // Resultados recientes: solo partidos finalizados de esta edición
  let finishedMatches: Array<{
    id: number;
    team_a: number | null;
    team_b: number | null;
    scheduled_at: string | null;
    ended_at: string | null;
    status: string;
    tournament_id: number | null;
  }> = [];

  if (activeTournamentIds.length > 0) {
    const { data: editionMatches } = await supabase
      .from("matches")
      .select(`
        id,
        team_a,
        team_b,
        scheduled_at,
        ended_at,
        status,
        tournament_id
      `)
      .in("tournament_id", activeTournamentIds)
      .or("status.eq.finished,ended_at.not.is.null")
      .order("ended_at", { ascending: false, nullsFirst: false })
      .limit(5);
    if (editionMatches && editionMatches.length > 0) {
      finishedMatches = editionMatches as typeof finishedMatches;
    }
  }

  // Obtener información de torneos y deportes por separado
  const tournamentsMap = new Map<number, { name: string; sport_id: number | null }>();
  const sportsMap = new Map<number, string>();
  
  if (finishedMatches && finishedMatches.length > 0) {
    const tournamentIds = Array.from(
      new Set(
        (finishedMatches as Array<{ tournament_id: number | null }>)
          .map((m) => m.tournament_id)
          .filter((id): id is number => id !== null && id !== undefined)
      )
    );
    
    if (tournamentIds.length > 0) {
      const { data: tournamentsData } = await supabase
        .from("tournaments")
        .select("id, name, sport_id")
        .in("id", tournamentIds);
      
      if (tournamentsData) {
        type TournamentData = {
          id: number;
          name: string;
          sport_id: number | null;
        };
        (tournamentsData as TournamentData[]).forEach((t: TournamentData) => {
          tournamentsMap.set(t.id, { name: t.name, sport_id: t.sport_id });
        });
        
        const sportIds = Array.from(
          new Set(
            (tournamentsData as TournamentData[])
              .map((t) => t.sport_id)
              .filter((id): id is number => id !== null && id !== undefined)
          )
        );
        
        if (sportIds.length > 0) {
          const { data: sportsData } = await supabase
            .from("sports")
            .select("id, name")
            .in("id", sportIds);
          
          if (sportsData) {
            type SportData = {
              id: number;
              name: string;
            };
            (sportsData as SportData[]).forEach((s: SportData) => {
              sportsMap.set(s.id, s.name);
            });
          }
        }
      }
    }
  }

  let recentResults: RecentResult[] = [];
  if (finishedMatches && finishedMatches.length > 0) {
    type FinishedMatch = {
      id: number;
      team_a: number | null;
      team_b: number | null;
      scheduled_at: string | null;
      ended_at: string | null;
      status: string;
      tournament_id: number | null;
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
        confirmed_at: result?.confirmed_at || match.ended_at || match.scheduled_at,
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
      
      // Obtener información del torneo y deporte
      const tournamentInfo = match.tournament_id ? tournamentsMap.get(match.tournament_id) : null;
      const sportName = tournamentInfo?.sport_id ? (sportsMap.get(tournamentInfo.sport_id) || "Deporte") : "Deporte";

      return {
        id: mr.match_id,
        sport: sportName,
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
    currentEditionId,
    currentEditionCreatedAt: edition?.created_at ?? null,
    tournament,
    activeTournamentIds,
    stats,
    recentTeams,
    recentResults,
  };
};

export const useDashboard = (editionId?: number) => {
  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, editionId],
    queryFn: () => loadDashboardData(editionId),
    staleTime: 30 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    currentEditionId: data?.currentEditionId ?? null,
    currentEditionCreatedAt: data?.currentEditionCreatedAt ?? null,
    tournament: data?.tournament || null,
    activeTournamentIds: data?.activeTournamentIds ?? [],
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
    loading: isLoading,
  };
};
