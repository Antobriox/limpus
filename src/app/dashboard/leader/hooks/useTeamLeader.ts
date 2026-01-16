import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";
import { useUser } from "../../../../hooks/useUser";

export type TeamInfo = {
  id: number;
  name: string;
  faculty: string;
  careers: string[];
  leaders: string[];
  captain: string | null;
};

const TEAM_LEADER_QUERY_KEY = ["teamLeader"];

const loadTeamLeader = async (userId: string): Promise<TeamInfo | null> => {
  // 1. Obtener el team_id del líder desde team_leaders
  const { data: teamLeaderData, error: teamLeaderError } = await supabase
    .from("team_leaders")
    .select("team_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (teamLeaderError || !teamLeaderData) {
    return null;
  }

  const teamId = teamLeaderData.team_id;

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

  const careers = careersData?.map((c: any) => c.name) || [];

  // 4. Cargar líderes del equipo
  const { data: teamLeadersData } = await supabase
    .from("team_leaders")
    .select("user_id")
    .eq("team_id", teamId);

  const leaderIds = teamLeadersData?.map((tl: any) => tl.user_id) || [];
  
  let leaders: string[] = [];
  if (leaderIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("full_name")
      .in("id", leaderIds);

    leaders = profilesData?.map((p: any) => p.full_name || "Sin nombre") || [];
  }

  // 5. Obtener facultad (primera carrera o "Sin facultad")
  const faculty = careers.length > 0 ? careers[0] : "Sin facultad";

  // 6. Obtener capitán (si existe)
  // El capitán se obtiene de la tabla players donde is_captain = true
  // y está asociado a una carrera del equipo
  let captain: string | null = null;
  if (careersData && careersData.length > 0) {
    const careerIds = careersData
      .map((c: any) => c.id)
      .filter((id: any): id is number => id !== null && id !== undefined && typeof id === 'number');
    
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
