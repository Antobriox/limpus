// Hook para cargar usuarios con TanStack Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

export type UserRow = {
  id: string;
  full_name: string;
  email: string;
  roles: { name: string }[];
};

const USERS_QUERY_KEY = ["users"];

const loadUsersQuery = async (): Promise<UserRow[]> => {
  const { data } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      user_roles (
        roles (name)
      )
    `)
    .order("full_name", { ascending: true });

  type SupabaseProfile = {
    id: string;
    full_name: string | null;
    email: string | null;
    user_roles: Array<{
      roles: {
        name: string;
      } | null;
    }>;
  };
  const formatted =
    (data as SupabaseProfile[] | null)?.map((u: SupabaseProfile) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      roles: u.user_roles.map((r) => r.roles).filter((role): role is { name: string } => role !== null),
    })) ?? [];

  return formatted;
};

export const useUsers = () => {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
  } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: loadUsersQuery,
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
