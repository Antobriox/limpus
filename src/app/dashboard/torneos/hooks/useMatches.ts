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
          assistant
        `)
        .eq("tournament_id", tournament.id)
        .order("scheduled_at", { ascending: true, nullsFirst: true });

      if (error) {
        console.error("Error cargando partidos:", error);
        return;
      }

      if (matches && matches.length > 0) {
        // Obtener todos los IDs de equipos únicos
        const teamIds = [
          ...matches.map((m: any) => m.team_a),
          ...matches.map((m: any) => m.team_b),
        ];
        const uniqueTeamIds = Array.from(new Set(teamIds)).filter(
          (id): id is number => id !== undefined && typeof id === "number"
        );

        // Obtener los nombres de los equipos
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, name")
          .in("id", uniqueTeamIds);

        // Crear un mapa de team_id -> team name
        const teamsMap = new Map(
          teamsData?.map((t: any) => [t.id, { id: t.id, name: t.name }]) || []
        );

        // Enriquecer los partidos con los nombres de los equipos
        const enrichedMatches = matches.map((match: any) => ({
          ...match,
          teams: teamsMap.get(match.team_a) || { id: match.team_a, name: "Equipo A" },
          teams1: teamsMap.get(match.team_b) || { id: match.team_b, name: "Equipo B" },
        }));

        const pending = enrichedMatches.filter((m: any) => !m.scheduled_at);
        const scheduled = enrichedMatches.filter((m: any) => m.scheduled_at);
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

      const refereeRole = rolesData?.find(
        (r: any) =>
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

      if (userRoles && userRoles.length > 0) {
        const userIds = userRoles.map((ur: any) => ur.user_id);
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

      const adminRole = rolesData?.find(
        (r: any) =>
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

      if (userRoles && userRoles.length > 0) {
        const userIds = userRoles.map((ur: any) => ur.user_id);
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
      alert("Debes ingresar la fecha y hora del partido");
      return false;
    }

    setSavingSchedule(true);
    try {
      const updateData: any = {
        scheduled_at: form.scheduled_at,
      };

      if (form.referee) updateData.referee = form.referee;
      if (form.assistant) updateData.assistant = form.assistant;
      
      // Manejar el estado: los valores válidos según el constraint de la base de datos
      // Valores válidos: "pending", "scheduled", "in_progress", "finished", "cancelled", "postponed", "suspended"
      const validStatuses = ["pending", "scheduled", "in_progress", "finished", "cancelled", "postponed", "suspended"];
      if (form.status && form.status.trim() !== "" && validStatuses.includes(form.status.toLowerCase())) {
        updateData.status = form.status.toLowerCase();
      } else {
        // Si el estado no es válido o está vacío, establecerlo como null
        // Esto evita errores del check constraint si el partido tenía un estado inválido anterior
        updateData.status = null;
      }

      console.log("Actualizando partido con datos:", JSON.stringify(updateData, null, 2));

      const { error } = await supabase
        .from("matches")
        .update(updateData)
        .eq("id", matchId);

      if (error) {
        console.error("Error programando partido:", error);
        console.error("Detalles del error:", error.message, error.details);
        alert(`Error al programar el partido: ${error.message}`);
        return false;
      }

      alert("Partido programado correctamente");
      await loadMatches();
      return true;
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
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

