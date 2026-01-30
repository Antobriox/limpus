// Hook para cargar equipos por edition_id. No depende de partidos.
// Torneo activo = equipos con edition_id = activeEditionId. Torneo nuevo = lista vacía hasta que se creen equipos.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

type SupabaseTeam = {
  id: number;
  name: string;
  created_at: string | null;
};

type SupabaseCareer = {
  id: number;
  name: string;
  team_id: number;
};

type SupabasePlayer = {
  career_id: number;
  full_name: string;
};

type SupabaseTeamLeader = {
  user_id: string;
  team_id: number;
};

type SupabaseProfile = {
  id: string;
  full_name: string | null;
};

export type TeamRow = {
  id: number;
  name: string;
  faculty: string;
  captain: string;
  leaders: string;
};

const TEAMS_QUERY_KEY = ["teams"];

const loadTeamsQuery = async (editionId: number | null): Promise<TeamRow[]> => {
  if (editionId == null || editionId <= 0) {
    return [];
  }

  const { data: teamsRaw, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, created_at")
    .eq("edition_id", editionId)
    .order("created_at", { ascending: false });

  if (teamsError) {
    throw teamsError;
  }

  const teamsData = (teamsRaw ?? []) as SupabaseTeam[];
  if (teamsData.length === 0) {
    return [];
  }

  const teamsWithDetails = teamsData.map((team: SupabaseTeam) => ({
    id: team.id,
    name: team.name,
    faculty: "Sin facultad",
    captain: "Sin capitán",
    leaders: "Sin líderes",
  }));

  const teamIds = teamsData.map((t) => t.id);

  try {
    const { data: careersData } = await supabase
      .from("careers")
      .select("id, name, team_id")
      .in("team_id", teamIds);

    if (careersData && careersData.length > 0) {
      const careersMap = new Map<number, SupabaseCareer[]>();
      (careersData as SupabaseCareer[]).forEach((career) => {
        if (!careersMap.has(career.team_id)) careersMap.set(career.team_id, []);
        careersMap.get(career.team_id)!.push(career);
      });
      teamsWithDetails.forEach((team) => {
        const teamCareers = careersMap.get(team.id) || [];
        if (teamCareers.length > 0) {
          team.faculty = teamCareers.map((c: SupabaseCareer) => c.name).join(", ");
        }
      });

      const careerIds = careersData.map((c) => c.id);
      const { data: captainsData } = await supabase
        .from("players")
        .select("career_id, full_name")
        .in("career_id", careerIds)
        .eq("is_captain", true);

      if (captainsData && captainsData.length > 0) {
        const captainsMap = new Map(
          (captainsData as SupabasePlayer[]).map((c: SupabasePlayer) => [c.career_id, c.full_name])
        );
        teamsWithDetails.forEach((team) => {
          const teamCareers = careersMap.get(team.id) || [];
          if (teamCareers.length > 0 && captainsMap.has(teamCareers[0].id)) {
            team.captain = captainsMap.get(teamCareers[0].id)!;
          }
        });
      }
    }
  } catch (e) {
    console.warn("Error cargando carreras:", e);
  }

  try {
    const { data: teamLeadersData } = await supabase
      .from("team_leaders")
      .select("team_id, user_id")
      .in("team_id", teamIds);

    if (teamLeadersData && teamLeadersData.length > 0) {
      const userIds = [...new Set((teamLeadersData as SupabaseTeamLeader[]).map((tl) => tl.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesData) {
        const profilesMap = new Map(
          (profilesData as SupabaseProfile[]).map((p) => [p.id, p.full_name || "Sin nombre"])
        );
        const leadersMap = new Map<number, string[]>();
        (teamLeadersData as SupabaseTeamLeader[]).forEach((tl) => {
          const name = profilesMap.get(tl.user_id);
          if (name) {
            if (!leadersMap.has(tl.team_id)) leadersMap.set(tl.team_id, []);
            leadersMap.get(tl.team_id)!.push(name);
          }
        });
        teamsWithDetails.forEach((team) => {
          const leaders = leadersMap.get(team.id) || [];
          if (leaders.length > 0) team.leaders = leaders.join(", ");
        });
      }
    }
  } catch (e) {
    console.warn("Error cargando líderes:", e);
  }

  return teamsWithDetails;
};

export const useTeams = (editionId: number | null) => {
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: [...TEAMS_QUERY_KEY, editionId],
    queryFn: () => loadTeamsQuery(editionId),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteTeam = async (id: number) => {
    try {
      await deleteTeamMutation.mutateAsync(id);
    } catch (error: unknown) {
      console.error("Error al eliminar equipo:", error instanceof Error ? error.message : String(error));
    }
  };

  return {
    teams,
    loading: isLoading,
    deleteTeam,
  };
};
