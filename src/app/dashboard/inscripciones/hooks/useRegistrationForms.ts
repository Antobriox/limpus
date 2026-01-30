// Hook para cargar formularios de inscripción con TanStack Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

export type Form = {
  id: number;
  name: string;
  genero: string | null;
  min_players: number;
  max_players: number;
  editable_until: string | null;
  is_locked: boolean;
  created_at: string | null;
};

const REGISTRATION_FORMS_QUERY_KEY = ["registrationForms"];

const loadFormsQuery = async (editionId: number | null): Promise<Form[]> => {
  if (editionId == null || editionId <= 0) {
    return [];
  }
  const { data } = await supabase
    .from("registration_forms")
    .select(`
      id,
      name,
      genero,
      min_players,
      max_players,
      editable_until,
      is_locked,
      created_at
    `)
    .eq("edition_id", editionId)
    .order("id", { ascending: false });

  return data || [];
};

export const useRegistrationForms = (editionId: number | null) => {
  const queryClient = useQueryClient();

  const {
    data: forms = [],
    isLoading,
  } = useQuery({
    queryKey: [...REGISTRATION_FORMS_QUERY_KEY, editionId],
    queryFn: () => loadFormsQuery(editionId),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, locked }: { id: number; locked: boolean }) => {
      const { error } = await supabase
        .from("registration_forms")
        .update({ is_locked: !locked })
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REGISTRATION_FORMS_QUERY_KEY });
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("registration_forms")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REGISTRATION_FORMS_QUERY_KEY });
    },
  });

  const toggleStatus = async (id: number, locked: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({ id, locked });
    } catch {
      // alert eliminada"Error al cambiar estado: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const deleteForm = async (id: number) => {
    // Confirmación eliminada

    try {
      await deleteFormMutation.mutateAsync(id);
    } catch {
      // alert eliminada"Error al eliminar formulario: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  return {
    forms,
    loading: isLoading, // Solo true en primera carga
    toggleStatus,
    deleteForm,
  };
};
