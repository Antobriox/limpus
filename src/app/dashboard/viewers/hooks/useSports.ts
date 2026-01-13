// Hook para cargar deportes con TanStack Query
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../lib/supabaseClient";

export type Sport = {
  id: number;
  name: string;
};

const SPORTS_QUERY_KEY = ["sports"];

const loadSports = async (): Promise<Sport[]> => {
  const { data, error } = await supabase
    .from("sports")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
};

export const useSports = () => {
  const {
    data: sports = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: SPORTS_QUERY_KEY,
    queryFn: loadSports,
    // staleTime y gcTime se heredan de la configuración global
  });

  return {
    sports,
    loading: isLoading, // Solo true en primera carga
    isFetching, // true cuando está refetching en background
    error,
  };
};
