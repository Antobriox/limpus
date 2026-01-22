// Hook para manejar la lógica de resultados de partidos con TanStack Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";
import { Match } from "../types";

export type MatchResultForm = {
  score_team_a: number;
  score_team_b: number;
  goals_team_a: Array<{ player_id: number; minute: number; points?: number }>;
  goals_team_b: Array<{ player_id: number; minute: number; points?: number }>;
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

  type SupabaseMatch = {
    team_a: number | null;
    team_b: number | null;
    referee: string | null;
    assistant: string | null;
    tournament_id: number | null;
  };
  const teamIds = [...(matches as SupabaseMatch[]).map((m: SupabaseMatch) => m.team_a), ...(matches as SupabaseMatch[]).map((m: SupabaseMatch) => m.team_b)];
  const uniqueTeamIds = Array.from(new Set(teamIds)).filter((id): id is number => id !== undefined && typeof id === "number");

  const { data: teamsData } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", uniqueTeamIds);

  type TeamData = {
    id: number;
    name: string;
  };
  const teamsMap = new Map((teamsData as TeamData[] | null)?.map((t: TeamData) => [t.id, { id: t.id, name: t.name }]) || []);

  // Obtener IDs de árbitros y asistentes
  const userIds = [
    ...(matches as SupabaseMatch[]).map((m: SupabaseMatch) => m.referee),
    ...(matches as SupabaseMatch[]).map((m: SupabaseMatch) => m.assistant),
  ].filter((id): id is string => id !== null && id !== undefined);
  const uniqueUserIds = Array.from(new Set(userIds));

  let profilesMap = new Map<string, string>();
  if (uniqueUserIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", uniqueUserIds);
    type ProfileData = {
      id: string;
      full_name: string | null;
    };
    profilesMap = new Map((profilesData as ProfileData[] | null)?.map((p: ProfileData) => [p.id, p.full_name || ""]) || []);
  }

  // Obtener información del torneo para la disciplina
  const tournamentIds = Array.from(new Set((matches as SupabaseMatch[]).map((m: SupabaseMatch) => m.tournament_id).filter((id): id is number => id !== null && id !== undefined)));
  const tournamentsMap = new Map<number, number>(); // tournament_id -> sport_id
  
  if (tournamentIds.length > 0) {
    const { data: tournamentsData } = await supabase
      .from("tournaments")
      .select("id, sport_id")
      .in("id", tournamentIds);
    
    type SupabaseTournament = {
      id: number;
      sport_id: number;
    };
    if (tournamentsData) {
      (tournamentsData as SupabaseTournament[]).forEach((t: SupabaseTournament) => {
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
    
    type SupabaseSport = {
      id: number;
      name: string;
    };
    if (sportsData) {
      (sportsData as SupabaseSport[]).forEach((s: SupabaseSport) => {
        sportsMap.set(s.id, s.name);
      });
    }
  }

  type EnrichedMatch = SupabaseMatch & {
    teams?: { id: number; name: string };
    teams1?: { id: number; name: string };
    refereeName?: string | null;
    assistantName?: string | null;
    sportName?: string | null;
    field?: string | null;
    genero?: string | null;
    scheduled_at?: string | null;
  };
  const enrichedMatches = matches.map((match: SupabaseMatch): EnrichedMatch => {
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

export const useResults = () => {
  const queryClient = useQueryClient();

  // Query para partidos programados - usa caché automáticamente
  const {
    data: scheduledMatches = [],
    isLoading,
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
      type MatchEvent = {
        match_id: number;
        event_type: string;
        team_id: number;
        player_id: number | null;
        value: number;
        created_by: string;
      };
      const events: MatchEvent[] = [];

      // Determinar si es básquet para guardar correctamente los puntos
      const { data: tournamentData } = await supabase
        .from("matches")
        .select(`
          tournaments!inner (
            sports!inner (
              name
            )
          )
        `)
        .eq("id", matchId)
        .single();
      
      const sportName = tournamentData?.tournaments?.sports?.name || "";
      const isBasketball = sportName.toLowerCase().includes("basket") || 
                          sportName.toLowerCase().includes("básquet");

      // Goles/Puntos del equipo A
      form.goals_team_a.forEach((goal) => {
        // Para básquet: value = puntos * 1000 + minuto (para poder extraer ambos)
        // Para fútbol: value = minuto
        const eventValue = isBasketball 
          ? ((goal.points || 1) * 1000 + goal.minute)
          : goal.minute;
        events.push({
          match_id: matchId,
          event_type: "goal",
          team_id: match.team_a,
          player_id: goal.player_id,
          value: eventValue,
          created_by: user.id,
        });
      });

      // Goles/Puntos del equipo B
      form.goals_team_b.forEach((goal) => {
        // Para básquet: value = puntos * 1000 + minuto (para poder extraer ambos)
        // Para fútbol: value = minuto
        const eventValue = isBasketball 
          ? ((goal.points || 1) * 1000 + goal.minute)
          : goal.minute;
        events.push({
          match_id: matchId,
          event_type: "goal",
          team_id: match.team_b,
          player_id: goal.player_id,
          value: eventValue,
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
      queryClient.invalidateQueries({ queryKey: ["teamMatches"] }); // Invalidar para actualizar vista del líder
    },
  });

  // Mutación para actualizar estado del partido
  const updateMatchStatusMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: number; status: string }) => {
      type UpdateData = {
        status: string;
        started_at?: string;
        ended_at?: string;
      };
      const updateData: UpdateData = { status };
      
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
      queryClient.invalidateQueries({ queryKey: ["teamMatches"] }); // Invalidar para actualizar vista del líder
    },
  });

  const loadPlayersForTeam = async (
    teamId: number, 
    sportId?: number, 
    genero?: string | null
  ): Promise<Player[]> => {
    try {
      console.log(`Cargando jugadores para equipo ${teamId}, deporte ${sportId}, género ${genero}`);
      
      // Si tenemos sportId y genero, buscar la inscripción específica
      if (sportId && genero) {
        // Buscar la inscripción del equipo que corresponde a esta disciplina y género
        const { data: teamRegistrations, error: regError } = await supabase
          .from("team_registrations")
          .select(`
            id,
            form_id,
            registration_forms!inner (
              sport_id,
              genero
            )
          `)
          .eq("team_id", teamId)
          .eq("registration_forms.sport_id", sportId)
          .eq("registration_forms.genero", genero);

        if (regError) {
          console.error("Error buscando inscripción:", regError);
        }

        if (teamRegistrations && teamRegistrations.length > 0) {
          // Encontramos la inscripción específica, cargar jugadores de esa inscripción
          const registrationId = teamRegistrations[0].id;
          console.log(`Inscripción encontrada: ${registrationId} para equipo ${teamId}, deporte ${sportId}, género ${genero}`);

          const { data: players, error: playersError } = await supabase
            .from("players")
            .select("id, full_name, jersey_number")
            .eq("team_registration_id", registrationId)
            .order("jersey_number", { ascending: true, nullsFirst: false });

          if (playersError) {
            console.error("Error cargando jugadores de inscripción:", playersError);
            return [];
          }

          console.log(`Jugadores encontrados: ${players?.length || 0} para inscripción ${registrationId}`);
          type SupabasePlayer = {
            id: number;
            full_name: string;
            jersey_number: number | null;
          };
          return ((players as SupabasePlayer[] | null) || []).map((p: SupabasePlayer) => ({
            id: p.id,
            full_name: p.full_name,
            jersey_number: p.jersey_number,
          }));
        } else {
          console.log(`No se encontró inscripción para equipo ${teamId}, deporte ${sportId}, género ${genero}`);
          return [];
        }
      }

      // Fallback: si no tenemos sportId y genero, cargar todos los jugadores del equipo (comportamiento anterior)
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

      type SupabasePlayer = {
        id: number;
        full_name: string;
        jersey_number: number | null;
      };
      return (players as SupabasePlayer[]).map((p: SupabasePlayer) => ({
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
      // Resultado guardado correctamente
      return true;
    } catch (error: unknown) {
      console.error("Error:", error);
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      return false;
    }
  };

  const updateMatchStatus = async (matchId: number, status: string) => {
    try {
      await updateMatchStatusMutation.mutateAsync({ matchId, status });
      return true;
    } catch (error: unknown) {
      console.error("Error:", error);
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
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
