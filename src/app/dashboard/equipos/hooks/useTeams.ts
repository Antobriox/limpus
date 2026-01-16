// Hook para cargar equipos con TanStack Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

export type TeamRow = {
  id: number;
  name: string;
  faculty: string;
  captain: string;
  leaders: string;
};

const TEAMS_QUERY_KEY = ["teams"];

const loadTeamsQuery = async (): Promise<TeamRow[]> => {
  // Cargar todos los equipos básicos
  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (teamsError) {
    throw teamsError;
  }

  if (!teamsData || teamsData.length === 0) {
    return [];
  }

  // Mapear equipos básicos primero (sin carreras)
  const teamsWithDetails = teamsData.map((team: any) => ({
    id: team.id,
    name: team.name,
    faculty: "Sin facultad",
    captain: "Sin capitán",
    leaders: "Sin líderes",
  }));

  // Intentar cargar carreras si hay equipos
  try {
    const teamIds = teamsData.map((team) => team.id);
    const { data: careersData } = await supabase
      .from("careers")
      .select("id, name, team_id")
      .in("team_id", teamIds);

    if (careersData && careersData.length > 0) {
      // Crear un mapa de team_id -> carreras
      const careersMap = new Map<number, any[]>();
      careersData.forEach((career) => {
        if (!careersMap.has(career.team_id)) {
          careersMap.set(career.team_id, []);
        }
        careersMap.get(career.team_id)!.push(career);
      });

      // Actualizar equipos con carreras
      teamsWithDetails.forEach((team) => {
        const teamCareers = careersMap.get(team.id) || [];
        if (teamCareers.length > 0) {
          team.faculty = teamCareers.map((c: any) => c.name).join(", ");
        }
      });

      // Intentar cargar capitanes
      const careerIds = careersData.map((c) => c.id);
      if (careerIds.length > 0) {
        const { data: captainsData } = await supabase
          .from("players")
          .select("career_id, full_name")
          .in("career_id", careerIds)
          .eq("is_captain", true);

        if (captainsData && captainsData.length > 0) {
          const captainsMap = new Map(
            captainsData.map((c: any) => [c.career_id, c.full_name])
          );

          // Actualizar equipos con capitanes
          teamsWithDetails.forEach((team) => {
            const teamCareers = careersMap.get(team.id) || [];
            if (teamCareers.length > 0) {
              const careerId = teamCareers[0].id;
              if (captainsMap.has(careerId)) {
                team.captain = captainsMap.get(careerId)!;
              }
            }
          });
        }
      }
    }
  } catch (careersError) {
    // Si hay error cargando carreras, continuar con equipos básicos
    console.warn("Error cargando carreras (continuando sin ellas):", careersError);
  }

  // Cargar líderes de los equipos
  try {
    const teamIds = teamsData.map((team) => team.id);
    
    // Obtener los team_leaders con user_ids
    const { data: teamLeadersData, error: teamLeadersError } = await supabase
      .from("team_leaders")
      .select("team_id, user_id")
      .in("team_id", teamIds);

    if (!teamLeadersError && teamLeadersData && teamLeadersData.length > 0) {
      // Obtener todos los user_ids únicos
      const userIds = [...new Set(teamLeadersData.map((tl: any) => tl.user_id))];
      
      // Obtener los perfiles de esos usuarios
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesData) {
        // Crear un mapa de user_id -> nombre
        const profilesMap = new Map(
          profilesData.map((p: any) => [p.id, p.full_name || "Sin nombre"])
        );

        // Crear un mapa de team_id -> líderes
        const leadersMap = new Map<number, string[]>();
        teamLeadersData.forEach((tl: any) => {
          const teamId = tl.team_id;
          const leaderName = profilesMap.get(tl.user_id);
          if (leaderName) {
            if (!leadersMap.has(teamId)) {
              leadersMap.set(teamId, []);
            }
            leadersMap.get(teamId)!.push(leaderName);
          }
        });

        // Actualizar equipos con líderes
        teamsWithDetails.forEach((team) => {
          const teamLeaders = leadersMap.get(team.id) || [];
          if (teamLeaders.length > 0) {
            team.leaders = teamLeaders.join(", ");
          }
        });
      }
    }
  } catch (leadersError) {
    // Si hay error cargando líderes, continuar sin ellos
    console.warn("Error cargando líderes (continuando sin ellos):", leadersError);
  }

  return teamsWithDetails;
};

export const useTeams = () => {
  const queryClient = useQueryClient();

  const {
    data: teams = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: TEAMS_QUERY_KEY,
    queryFn: loadTeamsQuery,
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteTeam = async (id: number) => {
    // Confirmación eliminada

    try {
      await deleteTeamMutation.mutateAsync(id);
    } catch (error: any) {
      console.error("Error al eliminar equipo: " + error.message);
    }
  };

  return {
    teams,
    loading: isLoading, // Solo true en primera carga
    deleteTeam,
  };
};
