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

  const formatted =
    data?.map((u: any) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      roles: u.user_roles.map((r: any) => r.roles),
    })) ?? [];

  return formatted;
};

export const useUsers = () => {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    isFetching,
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
    } catch (error: any) {
      console.error(error.message || "Error al eliminar usuario");
    }
  };

  return {
    users,
    loading: isLoading, // Solo true en primera carga
    deleteUser,
  };
};
