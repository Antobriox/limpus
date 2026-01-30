import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

// Tipos para datos de Supabase
type SupabaseRegistrationForm = {
  id: number;
  name: string;
  sport_id: number;
  genero: string | null;
  min_players: number;
  max_players: number;
  editable_until: string | null;
  is_locked: boolean;
  sports?: {
    name: string;
  } | Array<{
    name: string;
  }>;
};

type SupabaseTeamRegistration = {
  id: number;
  form_id: number;
  submitted_at: string | null;
  approved: boolean | null;
  registration_forms?: {
    name: string;
    sports?: {
      name: string;
    } | Array<{
      name: string;
    }>;
  } | Array<{
    name: string;
    sports?: {
      name: string;
    } | Array<{
      name: string;
    }>;
  }>;
};

export type RegistrationForm = {
  id: number;
  name: string;
  sport_id: number;
  sport_name: string;
  min_players: number;
  max_players: number;
  editable_until: string | null;
  is_locked: boolean;
  genero: string | null;
};

export type TeamRegistration = {
  id: number;
  form_id: number;
  form_name: string;
  sport_name: string;
  submitted_at: string | null;
  approved: boolean | null;
  players_count: number;
};

const REGISTRATION_FORMS_QUERY_KEY = ["teamRegistrationForms"];
const TEAM_REGISTRATIONS_QUERY_KEY = ["teamRegistrations"];

// Cargar formularios de inscripción disponibles
const loadRegistrationForms = async (editionId: number | null): Promise<RegistrationForm[]> => {
  let query = supabase
    .from("registration_forms")
    .select(`
      id,
      name,
      sport_id,
      min_players,
      max_players,
      editable_until,
      is_locked,
      genero,
      sports!inner (
        name
      )
    `)
    .eq("is_locked", false);

  // Filtrar por edición si se proporciona
  if (editionId != null && editionId > 0) {
    query = query.eq("edition_id", editionId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;

  return (
    (data as SupabaseRegistrationForm[] | null)?.map((f: SupabaseRegistrationForm) => {
      // Manejar sports como objeto o array
      const sportsData = Array.isArray(f.sports) ? f.sports[0] : f.sports;
      return {
        id: f.id,
        name: f.name,
        sport_id: f.sport_id,
        sport_name: sportsData?.name || "Desconocido",
        min_players: f.min_players,
        max_players: f.max_players,
        editable_until: f.editable_until,
        is_locked: f.is_locked,
        genero: f.genero || null,
      };
    }) || []
  );
};

// Cargar inscripciones del equipo
const loadTeamRegistrations = async (teamId: number): Promise<TeamRegistration[]> => {
  const { data, error } = await supabase
    .from("team_registrations")
    .select(`
      id,
      form_id,
      submitted_at,
      approved,
      registration_forms!inner (
        name,
        sports!inner (
          name
        )
      )
    `)
    .eq("team_id", teamId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  // Contar jugadores por inscripción
  const registrationsWithPlayers = await Promise.all(
    ((data || []) as SupabaseTeamRegistration[]).map(async (tr: SupabaseTeamRegistration) => {
      const { count } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("team_registration_id", tr.id);

      // Manejar registration_forms como objeto o array
      const registrationForm = Array.isArray(tr.registration_forms)
        ? tr.registration_forms[0]
        : tr.registration_forms;

      // Manejar sports como objeto o array
      const sportsData = registrationForm?.sports
        ? (Array.isArray(registrationForm.sports) ? registrationForm.sports[0] : registrationForm.sports)
        : undefined;

      return {
        id: tr.id,
        form_id: tr.form_id,
        form_name: registrationForm?.name || "Sin nombre",
        sport_name: sportsData?.name || "Desconocido",
        submitted_at: tr.submitted_at,
        approved: tr.approved,
        players_count: count || 0,
      };
    })
  );

  return registrationsWithPlayers;
};

export const useTeamRegistrations = (teamId: number | null, editionId: number | null = null) => {
  const queryClient = useQueryClient();

  // Cargar formularios disponibles
  const formsQuery = useQuery({
    queryKey: [...REGISTRATION_FORMS_QUERY_KEY, editionId],
    queryFn: () => loadRegistrationForms(editionId),
    enabled: editionId != null && editionId > 0,
  });

  // Cargar inscripciones del equipo
  const registrationsQuery = useQuery({
    queryKey: [...TEAM_REGISTRATIONS_QUERY_KEY, teamId],
    queryFn: () => {
      if (!teamId) return Promise.resolve([]);
      return loadTeamRegistrations(teamId);
    },
    enabled: !!teamId,
  });

  // Crear nueva inscripción
  const createRegistrationMutation = useMutation({
    mutationFn: async ({ formId, teamId }: { formId: number; teamId: number }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("team_registrations")
        .insert({
          form_id: formId,
          team_id: teamId,
          submitted_by: user?.id || null,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...TEAM_REGISTRATIONS_QUERY_KEY, teamId] });
    },
  });

  return {
    forms: formsQuery.data || [],
    registrations: registrationsQuery.data || [],
    loadingForms: formsQuery.isLoading,
    loadingRegistrations: registrationsQuery.isLoading,
    error: formsQuery.error || registrationsQuery.error,
    createRegistration: createRegistrationMutation.mutateAsync,
    isCreating: createRegistrationMutation.isPending,
  };
};
