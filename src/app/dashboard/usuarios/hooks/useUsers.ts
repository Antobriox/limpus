// Hook para cargar usuarios con TanStack Query
// Regla: admins/viewers siempre. Líderes/árbitros: asignados a esta edición O "sin asignar" solo si el usuario se creó después del inicio de esta edición (así aparece el líder nuevo sin mostrar los de ediciones anteriores).
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

export type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  roles: { name: string }[];
  created_at?: string | null;
};

const USERS_QUERY_KEY = ["users"];

const loadUsersQuery = async (
  editionId: number | null,
  editionCreatedAt: string | null,
  isHistorical: boolean = false
): Promise<UserRow[]> => {
  const { data } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      created_at,
      user_roles (
        roles (name)
      )
    `)
    .order("full_name", { ascending: true });

  type SupabaseProfile = {
    id: string;
    full_name: string | null;
    email: string | null;
    created_at?: string | null;
    user_roles: Array<{
      roles: {
        name: string;
      } | null;
    }>;
  };
  const allUsers: UserRow[] =
    (data as SupabaseProfile[] | null)?.map((u: SupabaseProfile) => ({
      id: u.id,
      full_name: u.full_name || null,
      email: u.email || null,
      created_at: u.created_at ?? null,
      roles: u.user_roles.map((r) => r.roles).filter((role): role is { name: string } => role !== null),
    })) ?? [];

  const isAdminOrViewer = (u: UserRow) =>
    u.roles.some(
      (r) =>
        r.name.toLowerCase() === "administrador" || r.name.toLowerCase() === "viewers"
    );
  const isLeaderOrReferee = (u: UserRow) =>
    u.roles.some((r) => {
      const name = r.name.toLowerCase();
      const isLeader = name === "lider_equipo" || name.includes("lider") || name.includes("líder");
      const isReferee = name === "arbitro" || name.includes("árbitro");
      return isLeader || isReferee;
    });

  const showAdminViewer = allUsers.filter(isAdminOrViewer);

  // Asignados a ESTA edición (team_leaders o partidos de esta edición)
  const assignedToThisEdition = new Set<string>();
  // Asignados a CUALQUIER edición (para no mostrar "sin asignar" a líderes/árbitros de ediciones anteriores)
  const assignedToAnyEdition = new Set<string>();

  if (editionId != null && editionId > 0) {
    const { data: leadersThis } = await supabase
      .from("team_leaders")
      .select("user_id")
      .eq("edition_id", editionId);
    (leadersThis ?? []).forEach((r: { user_id: string }) => assignedToThisEdition.add(r.user_id));

    const { data: leadersAll } = await supabase
      .from("team_leaders")
      .select("user_id");
    (leadersAll ?? []).forEach((r: { user_id: string }) => assignedToAnyEdition.add(r.user_id));

    const { data: tournamentRows } = await supabase
      .from("tournaments")
      .select("id")
      .eq("edition_id", editionId);
    const tournamentIds = (tournamentRows as Array<{ id: number }> | null)?.map((r) => r.id) ?? [];
    if (tournamentIds.length > 0) {
      const { data: matchesData } = await supabase
        .from("matches")
        .select("referee, assistant")
        .in("tournament_id", tournamentIds);
      (matchesData ?? []).forEach((m: { referee: string | null; assistant: string | null }) => {
        if (m.referee) assignedToThisEdition.add(m.referee);
        if (m.assistant) assignedToThisEdition.add(m.assistant);
      });
    }
    const { data: allTournamentRows } = await supabase
      .from("tournaments")
      .select("id");
    const allTids = (allTournamentRows ?? []).map((t: { id: number }) => t.id);
    if (allTids.length > 0) {
      const { data: allMatches } = await supabase
        .from("matches")
        .select("referee, assistant")
        .in("tournament_id", allTids);
      (allMatches ?? []).forEach((m: { referee: string | null; assistant: string | null }) => {
        if (m.referee) assignedToAnyEdition.add(m.referee);
        if (m.assistant) assignedToAnyEdition.add(m.assistant);
      });
    }
  }

  const leadersAndReferees = allUsers.filter(isLeaderOrReferee);
  const editionDate = editionCreatedAt ? new Date(editionCreatedAt).getTime() : 0;
  const showLeadersReferees = leadersAndReferees.filter((u) => {
    // Si está asignado a esta edición, siempre mostrar
    if (assignedToThisEdition.has(u.id)) return true;
    
    // Si estamos viendo historial, NO mostrar usuarios "sin asignar"
    // Solo mostrar los que fueron efectivamente asignados a esa edición
    if (isHistorical) return false;
    
    // Para el torneo actual: mostrar usuarios sin asignar creados después del inicio de la edición
    const unassigned = !assignedToAnyEdition.has(u.id);
    if (!unassigned) return false;
    const userCreatedAt = u.created_at ? new Date(u.created_at).getTime() : 0;
    return editionDate === 0 || userCreatedAt >= editionDate;
  });

  const shownIds = new Set([
    ...showAdminViewer.map((u) => u.id),
    ...showLeadersReferees.map((u) => u.id),
  ]);
  return allUsers.filter((u) => shownIds.has(u.id));
};

export const useUsers = (
  editionId: number | null,
  editionCreatedAt: string | null = null,
  isHistorical: boolean = false
) => {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
  } = useQuery({
    queryKey: [...USERS_QUERY_KEY, editionId, editionCreatedAt, isHistorical],
    queryFn: () => loadUsersQuery(editionId, editionCreatedAt, isHistorical),
    enabled: editionId != null && editionId > 0, // Solo ejecutar cuando tengamos editionId válido
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar usuario");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const deleteUser = async (id: string) => {
    // Confirmación eliminada

    try {
      await deleteUserMutation.mutateAsync(id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar usuario";
      console.error(errorMessage);
    }
  };

  return {
    users,
    loading: isLoading, // Solo true en primera carga
    deleteUser,
  };
};
