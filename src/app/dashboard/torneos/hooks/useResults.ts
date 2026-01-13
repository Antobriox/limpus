// Hook para manejar la lógica de resultados de partidos con TanStack Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";
import { Match, Tournament } from "../types";

export type MatchResultForm = {
  score_team_a: number;
  score_team_b: number;
  goals_team_a: Array<{ player_id: number; minute: number }>;
  goals_team_b: Array<{ player_id: number; minute: number }>;
  yellow_cards_team_a: Array<{ player_id: number; minute: number }>;
  yellow_cards_team_b: Array<{ player_id: number; minute: number }>;
  red_cards_team_a: Array<{ player_id: number; minute: number }>;
  red_cards_team_b: Array<{ player_id: number; minute: number }>;
  // Para Vóley: sets individuales con puntajes
  sets: Array<{ set_number: number; score_team_a: number; score_team_b: number }>;
};

export type Player = {
  id: number;
  full_name: string;
  jersey_number: number | null;
};

// Query key para los partidos programados
const SCHEDULED_MATCHES_QUERY_KEY = ["scheduledMatches"];

// Función para cargar partidos programados
const loadScheduledMatchesQuery = async (): Promise<Match[]> => {
  // Obtener la fecha de hoy (inicio y fin del día)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Inicio del día (00:00:00)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Fin del día (00:00:00 del día siguiente)

  const todayStart = today.toISOString();
  const todayEnd = tomorrow.toISOString();

  console.log("📅 Filtrando partidos para hoy:", {
    fecha: today.toLocaleDateString("es-ES"),
    inicio: todayStart,
    fin: todayEnd,
  });

  // Cargar solo los partidos programados para HOY
  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id,
      team_a,
      team_b,
      scheduled_at,
      started_at,
      ended_at,
      status,
      referee,
      assistant,
      tournament_id,
      field,
      genero
    `)
    .not("scheduled_at", "is", null)
    .gte("scheduled_at", todayStart)
    .lt("scheduled_at", todayEnd)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Error cargando partidos:", error);
    throw error;
  }

  console.log("Partidos programados para hoy encontrados:", matches?.length || 0);

  if (!matches || matches.length === 0) {
    return [];
  }

  const teamIds = [...matches.map((m: any) => m.team_a), ...matches.map((m: any) => m.team_b)];
  const uniqueTeamIds = Array.from(new Set(teamIds)).filter((id): id is number => id !== undefined && typeof id === "number");

  const { data: teamsData } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", uniqueTeamIds);

  const teamsMap = new Map(teamsData?.map((t: any) => [t.id, { id: t.id, name: t.name }]) || []);

  // Obtener IDs de árbitros y asistentes
  const userIds = [
    ...matches.map((m: any) => m.referee),
    ...matches.map((m: any) => m.assistant),
  ].filter(Boolean);
  const uniqueUserIds = Array.from(new Set(userIds));

  let profilesMap = new Map<string, string>();
  if (uniqueUserIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", uniqueUserIds);
    profilesMap = new Map(profilesData?.map((p: any) => [p.id, p.full_name]) || []);
  }

  // Obtener información del torneo para la disciplina
  const tournamentIds = Array.from(new Set(matches.map((m: any) => m.tournament_id).filter(Boolean)));
  const tournamentsMap = new Map<number, number>(); // tournament_id -> sport_id
  
  if (tournamentIds.length > 0) {
    const { data: tournamentsData } = await supabase
      .from("tournaments")
      .select("id, sport_id")
      .in("id", tournamentIds);
    
    if (tournamentsData) {
      tournamentsData.forEach((t: any) => {
        tournamentsMap.set(t.id, t.sport_id);
      });
    }
  }

  // Obtener nombres de deportes
  const sportIds = Array.from(new Set(Array.from(tournamentsMap.values()).filter(Boolean)));
  const sportsMap = new Map<number, string>();
  
  if (sportIds.length > 0) {
    const { data: sportsData } = await supabase
      .from("sports")
      .select("id, name")
      .in("id", sportIds);
    
    if (sportsData) {
      sportsData.forEach((s: any) => {
        sportsMap.set(s.id, s.name);
      });
    }
  }

  const enrichedMatches = matches.map((match: any) => {
    const tournamentSportId = tournamentsMap.get(match.tournament_id);
    const sportName = tournamentSportId ? (sportsMap.get(tournamentSportId) || null) : null;
    
    return {
      ...match,
      teams: teamsMap.get(match.team_a) || { id: match.team_a, name: "Equipo A" },
      teams1: teamsMap.get(match.team_b) || { id: match.team_b, name: "Equipo B" },
      refereeName: profilesMap.get(match.referee) || null,
      assistantName: profilesMap.get(match.assistant) || null,
      sportName: sportName,
      field: match.field || null,
      genero: match.genero || null,
    };
  });

  return enrichedMatches;
};

export const useResults = (tournament: Tournament | null) => {
  const queryClient = useQueryClient();

  // Query para partidos programados - usa caché automáticamente
  const {
    data: scheduledMatches = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: SCHEDULED_MATCHES_QUERY_KEY,
    queryFn: loadScheduledMatchesQuery,
    // staleTime y gcTime se heredan de la configuración global (10min y 30min)
  });

  // Mutación para guardar resultado
  const saveMatchResultMutation = useMutation({
    mutationFn: async ({ matchId, form }: { matchId: number; form: MatchResultForm }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Debes estar autenticado para guardar resultados");
      }

      // Obtener el partido para saber los equipos
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("team_a, team_b")
        .eq("id", matchId)
        .single();

      if (matchError || !match) {
        throw new Error("Error al obtener información del partido");
      }

      // Determinar el ganador (null si es empate)
      let winnerTeam: number | null = null;
      const scoreA = Number(form.score_team_a) || 0;
      const scoreB = Number(form.score_team_b) || 0;
      
      if (scoreA > scoreB) {
        winnerTeam = match.team_a;
      } else if (scoreB > scoreA) {
        winnerTeam = match.team_b;
      }

      console.log(`Guardando resultado: ${scoreA}-${scoreB}, ganador: ${winnerTeam || "Empate"}`);

      // Guardar o actualizar el resultado del partido
      const { error: resultError } = await supabase
        .from("match_results")
        .upsert({
          match_id: matchId,
          score_team_a: scoreA,
          score_team_b: scoreB,
          winner_team: winnerTeam,
          confirmed_by: user.id,
          confirmed_at: new Date().toISOString(),
        }, {
          onConflict: "match_id",
        });

      if (resultError) {
        console.error("Error guardando resultado:", resultError);
        throw new Error("Error al guardar el resultado del partido");
      }

      // Guardar eventos del partido (goles, tarjetas)
      const events: any[] = [];

      // Goles del equipo A
      form.goals_team_a.forEach((goal) => {
        events.push({
          match_id: matchId,
          event_type: "goal",
          team_id: match.team_a,
          player_id: goal.player_id,
          value: goal.minute,
          created_by: user.id,
        });
      });

      // Goles del equipo B
      form.goals_team_b.forEach((goal) => {
        events.push({
          match_id: matchId,
          event_type: "goal",
          team_id: match.team_b,
          player_id: goal.player_id,
          value: goal.minute,
          created_by: user.id,
        });
      });

      // Tarjetas amarillas del equipo A
      form.yellow_cards_team_a.forEach((card) => {
        events.push({
          match_id: matchId,
          event_type: "yellow_card",
          team_id: match.team_a,
          player_id: card.player_id,
          value: card.minute,
          created_by: user.id,
        });
      });

      // Tarjetas amarillas del equipo B
      form.yellow_cards_team_b.forEach((card) => {
        events.push({
          match_id: matchId,
          event_type: "yellow_card",
          team_id: match.team_b,
          player_id: card.player_id,
          value: card.minute,
          created_by: user.id,
        });
      });

      // Tarjetas rojas del equipo A
      form.red_cards_team_a.forEach((card) => {
        events.push({
          match_id: matchId,
          event_type: "red_card",
          team_id: match.team_a,
          player_id: card.player_id,
          value: card.minute,
          created_by: user.id,
        });
      });

      // Tarjetas rojas del equipo B
      form.red_cards_team_b.forEach((card) => {
        events.push({
          match_id: matchId,
          event_type: "red_card",
          team_id: match.team_b,
          player_id: card.player_id,
          value: card.minute,
          created_by: user.id,
        });
      });

      // Sets individuales (para Vóley y Pádel)
      // Guardamos cada set como dos eventos separados (uno por equipo)
      // Usamos event_type: "set_team_a" y "set_team_b", value: score, y el número del set en el event_type
      form.sets.forEach((set) => {
        // Evento para equipo A: guardamos el score en value y el número del set en el event_type
        events.push({
          match_id: matchId,
          event_type: `set_${set.set_number}_team_a`, // Incluimos el número del set en el event_type
          team_id: match.team_a,
          player_id: null, // No usamos player_id (tiene foreign key constraint)
          value: set.score_team_a, // Score del equipo A
          created_by: user.id,
        });
        
        // Evento para equipo B: guardamos el score en value y el número del set en el event_type
        events.push({
          match_id: matchId,
          event_type: `set_${set.set_number}_team_b`, // Incluimos el número del set en el event_type
          team_id: match.team_b,
          player_id: null, // No usamos player_id (tiene foreign key constraint)
          value: set.score_team_b, // Score del equipo B
          created_by: user.id,
        });
      });

      // Insertar todos los eventos
      if (events.length > 0) {
        const { error: eventsError } = await supabase
          .from("match_events")
          .insert(events);

        if (eventsError) {
          console.error("Error guardando eventos:", eventsError);
          throw new Error("Error al guardar algunos eventos del partido");
        }
      }

      // Guardar sets individuales de forma más estructurada
      // Si hay sets, los guardamos en match_results o en una tabla separada
      // Por ahora, guardamos los sets como eventos y los puntajes individuales se pueden recuperar
      // Nota: Para una mejor estructura, podríamos crear una tabla match_sets

      // Actualizar el estado del partido a "finished"
      await supabase
        .from("matches")
        .update({
          status: "finished",
          ended_at: new Date().toISOString(),
        })
        .eq("id", matchId);
    },
    onSuccess: () => {
      // Invalidar las queries relacionadas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: SCHEDULED_MATCHES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["standings"] });
    },
  });

  // Mutación para actualizar estado del partido
  const updateMatchStatusMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: number; status: string }) => {
      const updateData: any = { status };
      
      if (status === "in_progress") {
        updateData.started_at = new Date().toISOString();
      } else if (status === "finished") {
        updateData.ended_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("matches")
        .update(updateData)
        .eq("id", matchId);

      if (error) {
        console.error("Error actualizando estado:", error);
        throw new Error("Error al actualizar el estado del partido");
      }
    },
    onSuccess: () => {
      // Invalidar las queries relacionadas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: SCHEDULED_MATCHES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["standings"] });
    },
  });

  const loadPlayersForTeam = async (teamId: number): Promise<Player[]> => {
    try {
      // Obtener las carreras del equipo
      const { data: careers, error: careersError } = await supabase
        .from("careers")
        .select("id")
        .eq("team_id", teamId);

      if (careersError || !careers || careers.length === 0) {
        return [];
      }

      const careerIds = careers.map((c) => c.id);

      // Obtener los jugadores de esas carreras
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("id, full_name, jersey_number")
        .in("career_id", careerIds)
        .order("jersey_number", { ascending: true, nullsFirst: false });

      if (playersError || !players) {
        return [];
      }

      return players.map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        jersey_number: p.jersey_number,
      }));
    } catch (error) {
      console.error("Error cargando jugadores:", error);
      return [];
    }
  };

  const saveMatchResult = async (matchId: number, form: MatchResultForm) => {
    try {
      await saveMatchResultMutation.mutateAsync({ matchId, form });
      alert("Resultado guardado correctamente");
      return true;
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
      return false;
    }
  };

  const updateMatchStatus = async (matchId: number, status: string) => {
    try {
      await updateMatchStatusMutation.mutateAsync({ matchId, status });
      return true;
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
      return false;
    }
  };

  return {
    scheduledMatches,
    loading: isLoading, // Solo true en primera carga
    saving: saveMatchResultMutation.isPending,
    loadScheduledMatches: () => queryClient.invalidateQueries({ queryKey: SCHEDULED_MATCHES_QUERY_KEY }),
    loadPlayersForTeam,
    saveMatchResult,
    updateMatchStatus,
  };
};
