// Hook para cargar datos de la página de viewers con TanStack Query
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

export type Sport = {
  id: number;
  name: string;
};

export type LiveMatch = {
  id: number;
  team_a_id: number | null;
  team_b_id: number | null;
  team_a_name: string;
  team_b_name: string;
  score_a: number | null;
  score_b: number | null;
  sport_name: string;
  status: string;
  genero: string | null;
  field: string | null;
};

export type UpcomingMatch = {
  id: number;
  team_a_name: string;
  team_b_name: string;
  scheduled_at: string | null;
  field: string | null;
  sport_name: string;
  status: string;
  genero: string | null;
  referee: string | null;
};

export type PastMatch = {
  id: number;
  team_a_id: number | null;
  team_b_id: number | null;
  team_a_name: string;
  team_b_name: string;
  scheduled_at: string | null;
  ended_at: string | null;
  field: string | null;
  sport_name: string;
  genero: string | null;
  score_a: number | null;
  score_b: number | null;
};

const VIEWERS_DATA_QUERY_KEY = ["viewersData"];

// Tipos para datos de Supabase
type SupabaseMatch = {
  id: number;
  team_a: number | null;
  team_b: number | null;
  scheduled_at: string | null;
  ended_at: string | null;
  field: string | null;
  genero: string | null;
  status: string;
  tournament_id: number | null;
  tournaments?: {
    sports?: {
      name: string;
    };
  };
  match_results?: {
    score_team_a: number | null;
    score_team_b: number | null;
  } | Array<{
    score_team_a: number | null;
    score_team_b: number | null;
  }>;
};

type SupabaseTeam = {
  id: number;
  name: string;
};

type SupabaseTournament = {
  id: number;
  sport_id: number | null;
};

type SupabaseProfile = {
  id: string;
  full_name: string | null;
};

const loadViewersData = async (): Promise<{
  tournamentName: string;
  sports: Sport[];
  liveMatches: LiveMatch[];
  upcomingMatches: UpcomingMatch[];
  pastMatches: PastMatch[];
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

  // Crear un mapa de sports para búsqueda rápida
  const sportsMap = new Map(sports.map((s) => [s.id, s.name]));

  // Cargar partidos en vivo (status = "in_progress" o "suspended" para entretiempo)
  const { data: liveMatchesData } = await supabase
    .from("matches")
    .select(`
      id,
      team_a,
      team_b,
      status,
      field,
      genero,
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
    .in("status", ["in_progress", "suspended"])
    .order("started_at", { ascending: false })
    .limit(10);

  let liveMatches: LiveMatch[] = [];
  if (liveMatchesData && liveMatchesData.length > 0) {
    const teamIds = [
      ...liveMatchesData.map((m: SupabaseMatch) => m.team_a),
      ...liveMatchesData.map((m: SupabaseMatch) => m.team_b),
    ].filter((id): id is number => id !== null && id !== undefined);

    const { data: teamsData } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", teamIds);

    const teamsMap = new Map((teamsData as SupabaseTeam[] | null)?.map((t: SupabaseTeam) => [t.id, t.name]) || []);

    liveMatches = liveMatchesData.map((m: SupabaseMatch) => {
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

      return {
        id: m.id,
        team_a_id: m.team_a,
        team_b_id: m.team_b,
        team_a_name: teamsMap.get(m.team_a || 0) || "Equipo A",
        team_b_name: teamsMap.get(m.team_b || 0) || "Equipo B",
        score_a: scoreA,
        score_b: scoreB,
        sport_name: m.tournaments?.sports?.name || "Deporte",
        status: m.status,
        genero: m.genero,
        field: m.field,
      };
    });
  }

  // Cargar próximos partidos (status = "scheduled" o "pending" con scheduled_at en el futuro)
  const now = new Date().toISOString();
  
  // Cargar TODOS los partidos programados (sin filtrar por equipo)
  // Primero intentar con los filtros estrictos
  const { data: upcomingMatchesData, error: upcomingError } = await supabase
    .from("matches")
    .select(`
      id,
      team_a,
      team_b,
      scheduled_at,
      field,
      status,
      genero,
      tournament_id,
      referee
    `)
    .in("status", ["scheduled", "pending"])
    .not("scheduled_at", "is", null)
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(100);

  // Si no hay resultados, intentar sin el filtro de fecha para debug
  let finalUpcomingMatchesData = upcomingMatchesData;
  if (!upcomingMatchesData || upcomingMatchesData.length === 0) {
    console.log("No se encontraron partidos con filtros estrictos, intentando sin filtro de fecha...");
    const { data: allMatches, error: allError } = await supabase
      .from("matches")
      .select(`
        id,
        team_a,
        team_b,
        scheduled_at,
        field,
        status,
        genero,
        tournament_id,
        referee
      `)
      .in("status", ["scheduled", "pending"])
      .order("scheduled_at", { ascending: true })
      .limit(100);
    
    if (allMatches && allMatches.length > 0) {
      console.log(`Encontrados ${allMatches.length} partidos sin filtro de fecha`);
      // Filtrar manualmente los que tienen fecha futura
      finalUpcomingMatchesData = allMatches.filter((m: SupabaseMatch) => {
        if (!m.scheduled_at) return false;
        const matchDate = new Date(m.scheduled_at);
        const nowDate = new Date();
        return matchDate >= nowDate;
      });
      console.log(`Después de filtrar por fecha: ${finalUpcomingMatchesData.length} partidos`);
    } else {
      if (allError) {
        console.error("Error en consulta alternativa:", allError);
      }
      console.log("No se encontraron partidos con status scheduled o pending");
    }
  }

  if (upcomingError) {
    console.error("Error cargando próximos partidos:", upcomingError);
  }

  console.log("Partidos cargados de la BD:", finalUpcomingMatchesData?.length || 0);
  console.log("Fecha actual (now):", now);
  if (finalUpcomingMatchesData && finalUpcomingMatchesData.length > 0) {
    console.log("Primer partido:", {
      id: finalUpcomingMatchesData[0].id,
      scheduled_at: finalUpcomingMatchesData[0].scheduled_at,
      status: finalUpcomingMatchesData[0].status
    });
  }

  let upcomingMatches: UpcomingMatch[] = [];
  if (finalUpcomingMatchesData && finalUpcomingMatchesData.length > 0) {
    // Obtener IDs únicos de equipos y torneos
    const teamIds = [
      ...finalUpcomingMatchesData.map((m: SupabaseMatch) => m.team_a),
      ...finalUpcomingMatchesData.map((m: SupabaseMatch) => m.team_b),
    ].filter((id): id is number => id !== null && id !== undefined);

    const tournamentIds = finalUpcomingMatchesData
      .map((m: SupabaseMatch) => m.tournament_id)
      .filter((id): id is number => id !== null && id !== undefined);

    const refereeIds = (finalUpcomingMatchesData as Array<SupabaseMatch & { referee?: string | null }>)
      .map((m) => m.referee)
      .filter((id): id is string => id !== null && id !== undefined);

    // Cargar equipos
    const { data: teamsData } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", teamIds);

    const teamsMap = new Map((teamsData as SupabaseTeam[] | null)?.map((t: SupabaseTeam) => [t.id, t.name]) || []);

    // Cargar torneos con sus deportes
    let tournamentsMap = new Map<number, { sport_id: number | null }>();
    if (tournamentIds.length > 0) {
      const { data: tournamentsData } = await supabase
        .from("tournaments")
        .select("id, sport_id")
        .in("id", tournamentIds);

      if (tournamentsData) {
        tournamentsMap = new Map(
          (tournamentsData as SupabaseTournament[]).map((t: SupabaseTournament) => [t.id, { sport_id: t.sport_id }])
        );
      }
    }

    // Cargar nombres de árbitros
    let refereesMap = new Map<string, string>();
    if (refereeIds.length > 0) {
      const { data: refereesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", refereeIds);

      refereesMap = new Map(
        (refereesData as SupabaseProfile[] | null)?.map((r: SupabaseProfile) => [r.id, r.full_name || "Sin nombre"]) || []
      );
    }

    // Mapear partidos con información completa
    upcomingMatches = finalUpcomingMatchesData
      .filter((m: SupabaseMatch) => m.scheduled_at !== null) // Filtrar solo los que tienen fecha
      .map((m: SupabaseMatch & { referee?: string | null }) => {
        // Obtener el nombre del deporte
        let sportName = "Deporte";
        const tournament = tournamentsMap.get(m.tournament_id);
        if (tournament?.sport_id && sportsMap.has(tournament.sport_id)) {
          sportName = sportsMap.get(tournament.sport_id)!;
        }

        return {
          id: m.id,
          team_a_name: teamsMap.get(m.team_a) || "Equipo A",
          team_b_name: teamsMap.get(m.team_b) || "Equipo B",
          scheduled_at: m.scheduled_at,
          field: m.field,
          sport_name: sportName,
          status: m.status,
          genero: m.genero || null,
          referee: m.referee ? refereesMap.get(m.referee) || null : null,
        };
      })
      .filter((m: UpcomingMatch) => {
        // Filtrar solo los que tienen fecha en el futuro
        if (!m.scheduled_at) return false;
        const matchDate = new Date(m.scheduled_at);
        return matchDate >= new Date();
      })
      .sort((a: UpcomingMatch, b: UpcomingMatch) => {
        // Ordenar por fecha ascendente
        if (!a.scheduled_at || !b.scheduled_at) return 0;
        return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
      });

    console.log("Partidos procesados para mostrar:", upcomingMatches.length);
  }

  // Cargar partidos finalizados (historial) - TODOS los partidos de todas las disciplinas y equipos
  // Usar la misma estrategia que funciona en el líder: cargar con tournaments!inner
  const { data: pastMatchesData, error: pastMatchesError } = await supabase
    .from("matches")
    .select(`
      id,
      team_a,
      team_b,
      scheduled_at,
      ended_at,
      field,
      genero,
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
    .eq("status", "finished")
    .order("ended_at", { ascending: false, nullsFirst: false })
    .order("scheduled_at", { ascending: false });

  if (pastMatchesError) {
    console.error("❌ Error cargando partidos finalizados:", pastMatchesError);
  }

  console.log("📊 Partidos finalizados encontrados en BD:", pastMatchesData?.length || 0);

  let pastMatches: PastMatch[] = [];
  
  if (pastMatchesError) {
    // Si hay error, retornar array vacío
    console.error("Error en consulta de partidos finalizados, retornando array vacío");
  } else if (pastMatchesData && pastMatchesData.length > 0) {
    // Obtener IDs de equipos únicos usando Set (como en el líder)
    const teamIds = new Set<number>();
    pastMatchesData.forEach((m: SupabaseMatch) => {
      if (m.team_a) teamIds.add(m.team_a);
      if (m.team_b) teamIds.add(m.team_b);
    });

    // Cargar nombres de equipos
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", Array.from(teamIds));

    if (teamsError) {
      console.error("❌ Error cargando equipos:", teamsError);
    }

    const teamsMap = new Map((teamsData as SupabaseTeam[] | null)?.map((t: SupabaseTeam) => [t.id, t.name]) || []);

    // Procesar partidos (usando la misma lógica que el líder)
    pastMatches = pastMatchesData.map((m: SupabaseMatch) => {
      // Obtener el resultado del partido
      let scoreA = null;
      let scoreB = null;
      
      if (m.match_results) {
        const result = Array.isArray(m.match_results) ? m.match_results[0] : m.match_results;
        if (result) {
          scoreA = result.score_team_a ?? null;
          scoreB = result.score_team_b ?? null;
        }
      }

      // Obtener nombre del deporte directamente desde tournaments!inner
      const sportName = m.tournaments?.sports?.name || "Deporte";

      return {
        id: m.id,
        team_a_id: m.team_a,
        team_b_id: m.team_b,
        team_a_name: teamsMap.get(m.team_a) || "Equipo A",
        team_b_name: teamsMap.get(m.team_b) || "Equipo B",
        scheduled_at: m.scheduled_at,
        ended_at: m.ended_at,
        field: m.field || null,
        sport_name: sportName,
        genero: m.genero || null,
        score_a: scoreA,
        score_b: scoreB,
      };
    })
    // Ordenar por ended_at (si existe) o scheduled_at (como fallback), más recientes primero
    .sort((a, b) => {
      const dateA = a.ended_at ? new Date(a.ended_at).getTime() : (a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0);
      const dateB = b.ended_at ? new Date(b.ended_at).getTime() : (b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0);
      return dateB - dateA; // Orden descendente (más recientes primero)
    });
  }

  console.log("✅ Partidos finalizados procesados para mostrar:", pastMatches.length);
  if (pastMatches.length > 0) {
    console.log("✅ Primer partido procesado:", pastMatches[0]);
  }

  return {
    tournamentName,
    sports,
    liveMatches,
    upcomingMatches,
    pastMatches,
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
    staleTime: 30 * 1000, // 30 segundos - refrescar más frecuentemente
    refetchInterval: 60 * 1000, // Refrescar cada minuto automáticamente
  });

  return {
    tournamentName: data?.tournamentName || "Olimpiadas Universitarias",
    sports: data?.sports || [],
    liveMatches: data?.liveMatches || [],
    upcomingMatches: data?.upcomingMatches || [],
    pastMatches: data?.pastMatches || [],
    loading: isLoading, // Solo true en primera carga
    isFetching, // true cuando está refetching en background
    error,
  };
};
