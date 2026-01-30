import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";
import { useUser } from "../../../../hooks/useUser";

// Tipos para datos de Supabase
type SupabaseCareer = {
  id: number;
  name: string;
};

type SupabaseTeamLeader = {
  user_id: string;
};

type SupabaseProfile = {
  full_name: string | null;
};

export type TeamInfo = {
  id: number;
  name: string;
  faculty: string;
  careers: string[];
  leaders: string[];
  captain: string | null;
  edition_id: number | null;
};

const TEAM_LEADER_QUERY_KEY = ["teamLeader"];

const loadTeamLeader = async (userId: string): Promise<TeamInfo | null> => {
  // 1. Primero obtener la edición activa
  const { data: activeEdition } = await supabase
    .from("tournament_editions")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!activeEdition) {
    return null; // No hay torneo activo
  }

  // 2. Buscar si el usuario tiene un equipo asignado en la edición activa
  const { data: teamLeaderData, error: teamLeaderError } = await supabase
    .from("team_leaders")
    .select("team_id, edition_id")
    .eq("user_id", userId)
    .eq("edition_id", activeEdition.id)
    .limit(1)
    .maybeSingle();

  if (teamLeaderError || !teamLeaderData) {
    return null; // El líder no tiene equipo en el torneo activo
  }

  const teamId = teamLeaderData.team_id;
  const editionId = teamLeaderData.edition_id || null;

  // 2. Cargar información del equipo
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .single();

  if (teamError || !teamData) {
    return null;
  }

  // 3. Cargar carreras del equipo
  const { data: careersData } = await supabase
    .from("careers")
    .select("id, name")
    .eq("team_id", teamId);

  const careers = (careersData as SupabaseCareer[] | null)?.map((c: SupabaseCareer) => c.name) || [];

  // 4. Cargar líderes del equipo
  const { data: teamLeadersData } = await supabase
    .from("team_leaders")
    .select("user_id")
    .eq("team_id", teamId);

  const leaderIds = (teamLeadersData as SupabaseTeamLeader[] | null)?.map((tl: SupabaseTeamLeader) => tl.user_id) || [];
  
  let leaders: string[] = [];
  if (leaderIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("full_name")
      .in("id", leaderIds);

    leaders = (profilesData as SupabaseProfile[] | null)?.map((p: SupabaseProfile) => p.full_name || "Sin nombre") || [];
  }

  // 5. Obtener facultad (primera carrera o "Sin facultad")
  const faculty = careers.length > 0 ? careers[0] : "Sin facultad";

  // 6. Obtener capitán (si existe)
  // El capitán se obtiene de la tabla players donde is_captain = true
  // y está asociado a una carrera del equipo
  let captain: string | null = null;
  if (careersData && careersData.length > 0) {
    const careerIds = (careersData as SupabaseCareer[])
      .map((c: SupabaseCareer) => c.id)
      .filter((id): id is number => id !== null && id !== undefined && typeof id === 'number');
    
    if (careerIds.length > 0) {
      const { data: captainData, error: captainError } = await supabase
        .from("players")
        .select("full_name")
        .in("career_id", careerIds)
        .eq("is_captain", true)
        .limit(1)
        .maybeSingle(); // Usar maybeSingle en lugar de single para evitar error si no hay resultados

      if (!captainError && captainData) {
        captain = captainData.full_name || null;
      }
    }
  }

  return {
    id: teamData.id,
    name: teamData.name,
    faculty,
    careers,
    leaders,
    captain,
    edition_id: editionId,
  };
};

export const useTeamLeader = () => {
  const { user } = useUser();

  const {
    data: teamInfo,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: TEAM_LEADER_QUERY_KEY,
    queryFn: () => {
      if (!user?.id) {
        return Promise.resolve(null);
      }
      return loadTeamLeader(user.id);
    },
    enabled: !!user?.id,
  });

  return {
    teamInfo,
    loading: isLoading,
    isFetching,
    error,
  };
};
