import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook para suscribirse a cambios en tiempo real de Supabase
 * Invalida las queries de React Query cuando hay cambios en la BD
 */
export function useRealtimeSubscription() {
  const queryClient = useQueryClient();

  // Función para notificar actualizaciones (opcional, para UI feedback)
  const notifyUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("realtime-update"));
    }
  };

  useEffect(() => {
    console.log("🔥 Realtime subscriptions ACTIVADAS");

    // Suscripción a cambios en PARTIDOS (matches)
    const matchesChannel = supabase
      .channel("matches-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "matches",
        },
        (payload) => {
          console.log("⚽ Cambio en PARTIDOS:", payload);
          // Invalidar todas las queries relacionadas con partidos
          queryClient.invalidateQueries({ queryKey: ["matches"] });
          queryClient.invalidateQueries({ queryKey: ["teamMatches"] });
          queryClient.invalidateQueries({ queryKey: ["viewersData"] });
          queryClient.invalidateQueries({ queryKey: ["teamStats"] });
          queryClient.invalidateQueries({ queryKey: ["standings"] });
          notifyUpdate();
        }
      )
      .subscribe();

    // Suscripción a cambios en RESULTADOS (match_results) - GOLES, TARJETAS, SETS, ETC
    const resultsChannel = supabase
      .channel("results-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "match_results",
        },
        (payload) => {
          console.log("🎯 Cambio en RESULTADOS (goles/tarjetas):", payload.eventType);
          
          // Invalidar TODAS las queries que muestran resultados
          queryClient.invalidateQueries({ queryKey: ["matches"] });
          queryClient.invalidateQueries({ queryKey: ["teamMatches"] });
          queryClient.invalidateQueries({ queryKey: ["viewersData"] });
          queryClient.invalidateQueries({ queryKey: ["teamStats"] });
          queryClient.invalidateQueries({ queryKey: ["standings"] });
          queryClient.invalidateQueries({ queryKey: ["results"] });
          
          notifyUpdate();
        }
      )
      .subscribe();

    // Suscripción a cambios en EQUIPOS (teams)
    const teamsChannel = supabase
      .channel("teams-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["teams"] });
          queryClient.invalidateQueries({ queryKey: ["standings"] });
          queryClient.invalidateQueries({ queryKey: ["teamLeader"] });
          notifyUpdate();
        }
      )
      .subscribe();

    // Suscripción a cambios en TORNEOS (tournaments)
    const tournamentsChannel = supabase
      .channel("tournaments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournaments",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tournaments"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["viewersData"] });
          notifyUpdate();
        }
      )
      .subscribe();

    // Suscripción a cambios en INSCRIPCIONES (team_registrations)
    const registrationsChannel = supabase
      .channel("registrations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_registrations",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["teamRegistrations"] });
          queryClient.invalidateQueries({ queryKey: ["registrationForms"] });
          notifyUpdate();
        }
      )
      .subscribe();

    // Suscripción a cambios en FORMULARIOS (registration_forms)
    const formsChannel = supabase
      .channel("forms-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "registration_forms",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["registrationForms"] });
          queryClient.invalidateQueries({ queryKey: ["teamRegistrations"] });
          notifyUpdate();
        }
      )
      .subscribe();

    // Suscripción a cambios en BRACKETS/DRAWS
    const drawsChannel = supabase
      .channel("draws-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "draws",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["brackets"] });
          queryClient.invalidateQueries({ queryKey: ["standings"] });
          notifyUpdate();
        }
      )
      .subscribe();

    // Suscripción a cambios en USUARIOS (profiles, user_roles)
    const usersChannel = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
          notifyUpdate();
        }
      )
      .subscribe();

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      console.log("🔴 Realtime subscriptions DESACTIVADAS");
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(tournamentsChannel);
      supabase.removeChannel(registrationsChannel);
      supabase.removeChannel(formsChannel);
      supabase.removeChannel(drawsChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [queryClient]);
}
