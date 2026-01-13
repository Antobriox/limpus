import { QueryClient } from "@tanstack/react-query";

// Configuración del QueryClient con caché optimizado
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutos - los datos se consideran frescos
      gcTime: 30 * 60 * 1000, // 30 minutos - tiempo antes de recolectar basura
      refetchOnWindowFocus: true, // Refetch automático cuando la ventana recupera el foco
      refetchOnReconnect: true, // Refetch cuando se reconecta a internet
      retry: 1, // Reintentar una vez en caso de error
    },
  },
});
