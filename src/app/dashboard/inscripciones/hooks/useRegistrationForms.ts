// Hook para cargar formularios de inscripción con TanStack Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

export type Form = {
  id: number;
  name: string;
  min_players: number;
  max_players: number;
  editable_until: string | null;
  is_locked: boolean;
  created_at: string | null;
};

const REGISTRATION_FORMS_QUERY_KEY = ["registrationForms"];

const loadFormsQuery = async (): Promise<Form[]> => {
  const { data } = await supabase
    .from("registration_forms")
    .select(`
      id,
      name,
      min_players,
      max_players,
      editable_until,
      is_locked,
      created_at
    `)
    .order("id", { ascending: false });

  return data || [];
};

export const useRegistrationForms = () => {
  const queryClient = useQueryClient();

  const {
    data: forms = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: REGISTRATION_FORMS_QUERY_KEY,
    queryFn: loadFormsQuery,
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
    } catch (error: any) {
      alert("Error al cambiar estado: " + error.message);
    }
  };

  const deleteForm = async (id: number) => {
    if (!confirm("¿Eliminar este formulario? Esta acción no se puede deshacer.")) return;

    try {
      await deleteFormMutation.mutateAsync(id);
    } catch (error: any) {
      alert("Error al eliminar formulario: " + error.message);
    }
  };

  return {
    forms,
    loading: isLoading, // Solo true en primera carga
    toggleStatus,
    deleteForm,
  };
};
