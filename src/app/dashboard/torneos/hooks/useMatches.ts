// Hook para manejar la lógica de partidos
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { Tournament, Match, Referee, ScheduleForm } from "../types";

export const useMatches = (tournament: Tournament | null) => {
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [administrators, setAdministrators] = useState<Referee[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const loadMatches = async () => {
    if (!tournament || tournament.id === 0) return;

    try {
      // Primero obtener los partidos sin los joins
      const { data: matches, error } = await supabase
        .from("matches")
        .select(`
          id,
          team_a,
          team_b,
          scheduled_at,
          status,
          referee,
          assistant,
          tournament_id,
          field,
          genero
        `)
        .eq("tournament_id", tournament.id)
        .order("scheduled_at", { ascending: true, nullsFirst: true });

      if (error) {
        console.error("Error cargando partidos:", error);
        return;
      }

      if (matches && matches.length > 0) {
        type SupabaseMatch = {
          team_a: number | null;
          team_b: number | null;
          referee: string | null;
          assistant: string | null;
          tournament_id: number | null;
        };

        // Obtener todos los IDs de equipos únicos
        const teamIds = [
          ...(matches as SupabaseMatch[]).map((m: SupabaseMatch) => m.team_a),
          ...(matches as SupabaseMatch[]).map((m: SupabaseMatch) => m.team_b),
        ];
        const uniqueTeamIds = Array.from(new Set(teamIds)).filter(
          (id): id is number => id !== undefined && typeof id === "number"
        );

        // Obtener los nombres de los equipos
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, name")
          .in("id", uniqueTeamIds);

        type TeamData = {
          id: number;
          name: string;
        };

        // Crear un mapa de team_id -> team name
        const teamsMap = new Map(
          (teamsData as TeamData[] | null)?.map((t: TeamData) => [t.id, { id: t.id, name: t.name }]) || []
        );

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

        // Obtener información de disciplinas de los torneos
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

        // Enriquecer los partidos con los nombres de los equipos, árbitros, asistentes, disciplinas y canchas
        type EnrichedMatch = SupabaseMatch & {
          teams?: { id: number; name: string };
          teams1?: { id: number; name: string };
          refereeName?: string | null;
          assistantName?: string | null;
          sportName?: string | null;
          field?: string | null;
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
          };
        });

        const pending = enrichedMatches.filter((m: EnrichedMatch) => !m.scheduled_at);
        const scheduled = enrichedMatches.filter((m: EnrichedMatch) => m.scheduled_at);
        setPendingMatches(pending);
        setScheduledMatches(scheduled);
      } else {
        setPendingMatches([]);
        setScheduledMatches([]);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const loadReferees = async () => {
    try {
      const { data: rolesData } = await supabase
        .from("roles")
        .select("id, name");

      type SupabaseRole = {
        id: number;
        name: string;
      };
      const refereeRole = rolesData?.find(
        (r: SupabaseRole) =>
          r.name.toLowerCase().includes("arbitro") ||
          r.name.toLowerCase().includes("árbitro") ||
          r.name.toLowerCase() === "arbitro"
      );

      if (!refereeRole) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .order("full_name");
        setReferees(profiles || []);
        return;
      }

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_id", refereeRole.id);

      type SupabaseUserRole = {
        user_id: string;
      };
      if (userRoles && userRoles.length > 0) {
        const userIds = (userRoles as SupabaseUserRole[]).map((ur: SupabaseUserRole) => ur.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
          .order("full_name");
        setReferees(profiles || []);
      } else {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .order("full_name");
        setReferees(profiles || []);
      }
    } catch (error) {
      console.error("Error cargando árbitros:", error);
    }
  };

  const loadAdministrators = async () => {
    try {
      const { data: rolesData } = await supabase
        .from("roles")
        .select("id, name");

      type SupabaseRole = {
        id: number;
        name: string;
      };
      const adminRole = rolesData?.find(
        (r: SupabaseRole) =>
          r.name.toLowerCase().includes("admin") ||
          r.name.toLowerCase().includes("administrador") ||
          r.name.toLowerCase() === "admin"
      );

      if (!adminRole) {
        console.warn("No se encontró el rol de administrador");
        setAdministrators([]);
        return;
      }

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_id", adminRole.id);

      type SupabaseUserRole = {
        user_id: string;
      };
      if (userRoles && userRoles.length > 0) {
        const userIds = (userRoles as SupabaseUserRole[]).map((ur: SupabaseUserRole) => ur.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
          .order("full_name");
        setAdministrators(profiles || []);
      } else {
        setAdministrators([]);
      }
    } catch (error) {
      console.error("Error cargando administradores:", error);
      setAdministrators([]);
    }
  };

  const scheduleMatch = async (matchId: number, form: ScheduleForm) => {
    if (!form.scheduled_at) {
      // alert eliminada"Debes ingresar la fecha y hora del partido");
      return false;
    }

    setSavingSchedule(true);
    try {
      type UpdateData = {
        scheduled_at: string;
        referee?: string;
        assistant?: string;
        field?: string;
        genero?: string;
        status: string;
      };
      const updateData: UpdateData = {
        scheduled_at: form.scheduled_at,
        status: "",
      };

      if (form.referee) updateData.referee = form.referee;
      if (form.assistant) updateData.assistant = form.assistant;
      if (form.field) updateData.field = form.field;
      if (form.genero) updateData.genero = form.genero;
      
      // Determinar el estado automáticamente:
      // Si todos los campos están completos (fecha, árbitro, asistente, cancha), el estado es "scheduled"
      // Si falta algún campo, el estado es "pending"
      const hasAllFields = form.scheduled_at && 
                           form.referee && form.referee.trim() !== "" &&
                           form.assistant && form.assistant.trim() !== "" &&
                           form.field && form.field.trim() !== "";

      if (hasAllFields) {
        // Si todos los campos están completos, el estado es automáticamente "scheduled"
        updateData.status = "scheduled";
      } else {
        // Si falta algún campo, el estado es "pending"
        updateData.status = "pending";
      }

      console.log("Actualizando partido con datos:", JSON.stringify(updateData, null, 2));

      const { error } = await supabase
        .from("matches")
        .update(updateData)
        .eq("id", matchId);

      if (error) {
        console.error("Error programando partido:", error);
        console.error("Detalles del error:", error.message, error.details);
        // alert eliminada`Error al programar el partido: ${error.message}`);
        return false;
      }

      // alert eliminada"Partido programado correctamente");
      await loadMatches();
      return true;
    } catch (error: unknown) {
      console.error("Error:", error);
      if (error instanceof Error) {
        // alert eliminada`Error: ${error.message}`);
      }
      return false;
    } finally {
      setSavingSchedule(false);
    }
  };

  return {
    pendingMatches,
    scheduledMatches,
    referees,
    administrators,
    savingSchedule,
    loadMatches,
    loadReferees,
    loadAdministrators,
    scheduleMatch,
  };
};

