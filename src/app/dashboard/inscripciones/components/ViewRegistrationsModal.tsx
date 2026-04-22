"use client";

import { useState, useEffect, useCallback } from "react";

// Tipos para datos de Supabase
type SupabaseTeamRegistration = {
  id: number;
  team_id: number;
  approved: boolean | null;
  teams?: {
    id: number;
    name: string;
  } | Array<{
    id: number;
    name: string;
  }> | null;
};

import { supabase } from "../../../../lib/supabaseClient";
import { X, Users, User, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "../../../../lib/utils";
import { openCedulaPhotoInNewTab } from "../../../../lib/openCedulaPhoto";

type ViewRegistrationsModalProps = {
  formId: number;
  formName: string;
  isOpen: boolean;
  onClose: () => void;
  /** @deprecated Ya no se usa: filtrar por fechas del torneo ocultaba inscripciones hechas antes del inicio del torneo */
  tournamentStart?: string | null;
  tournamentEnd?: string | null;
};

type TeamRegistration = {
  id: number;
  team_id: number;
  team_name: string;
  players_count: number;
  approved: boolean | null;
};

type Player = {
  id: number;
  full_name: string;
  email: string | null;
  cedula: string | null;
  phone: string | null;
  semester: number | null;
  jersey_number: number | null;
  is_captain: boolean;
  career_name: string | null;
  cedula_photo_url?: string | null;
};

export default function ViewRegistrationsModal({
  formId,
  formName,
  isOpen,
  onClose,
}: ViewRegistrationsModalProps) {
  const [teamRegistrations, setTeamRegistrations] = useState<TeamRegistration[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const loadTeamRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      // Todas las inscripciones del formulario (sin filtrar por fechas del torneo):
      // start_date/end_date del torneo suelen ser las fechas de competencia; las inscripciones
      // ocurren antes y quedaban excluidas con gte/lte sobre submitted_at → el admin veía 0 equipos.
      const { data: registrations, error } = await supabase
        .from("team_registrations")
        .select(`
          id,
          team_id,
          approved,
          teams!inner (
            id,
            name
          )
        `)
        .eq("form_id", formId)
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      // Contar jugadores para cada inscripción
      const registrationsWithCounts = await Promise.all(
        ((registrations || []) as SupabaseTeamRegistration[]).map(async (reg: SupabaseTeamRegistration) => {
          const { count } = await supabase
            .from("players")
            .select("*", { count: "exact", head: true })
            .eq("team_registration_id", reg.id);

          // Manejar teams como objeto único o array
          let teamName = "Equipo desconocido";
          if (reg.teams) {
            if (Array.isArray(reg.teams) && reg.teams.length > 0) {
              teamName = reg.teams[0].name;
            } else if (!Array.isArray(reg.teams) && reg.teams.name) {
              teamName = reg.teams.name;
            }
          }

          return {
            id: reg.id,
            team_id: reg.team_id,
            team_name: teamName,
            players_count: count || 0,
            approved: reg.approved,
          };
        })
      );

      setTeamRegistrations(registrationsWithCounts);
    } catch (error: unknown) {
      console.error("Error cargando inscripciones:", error);
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    if (isOpen && formId) {
      loadTeamRegistrations();
    }
  }, [isOpen, formId, loadTeamRegistrations]);

  useEffect(() => {
    if (selectedTeamId) {
      loadPlayers(selectedTeamId);
    } else {
      setPlayers([]);
    }
  }, [selectedTeamId]);

  const loadPlayers = async (teamRegistrationId: number) => {
    setLoadingPlayers(true);
    try {
      // Primero obtener los jugadores con su career_id
      const { data: playersData, error } = await supabase
        .from("players")
        .select(`
          id,
          full_name,
          email,
          cedula,
          phone,
          semester,
          jersey_number,
          is_captain,
          cedula_photo_url,
          career_id
        `)
        .eq("team_registration_id", teamRegistrationId)
        .order("full_name");

      if (error) throw error;

      // Obtener todos los career_id únicos
      const careerIds = Array.from(
        new Set(
          ((playersData || []) as Array<{ career_id: number | null }>)
            .map((p) => p.career_id)
            .filter((id): id is number => id !== null && id !== undefined)
        )
      );

      // Cargar los nombres de las carreras
      const careersMap = new Map<number, string>();
      if (careerIds.length > 0) {
        const { data: careersData } = await supabase
          .from("careers")
          .select("id, name")
          .in("id", careerIds);

        if (careersData) {
          careersData.forEach((career: { id: number; name: string }) => {
            careersMap.set(career.id, career.name);
          });
        }
      }

      const mappedPlayers = ((playersData || []) as Array<{
        id: number;
        full_name: string;
        email: string | null;
        cedula: string | null;
        phone: string | null;
        semester: number | null;
        jersey_number: number | null;
        is_captain: boolean;
        cedula_photo_url: string | null;
        career_id: number | null;
      }>).map((p) => {
        return {
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          cedula: p.cedula,
          phone: p.phone,
          semester: p.semester,
          jersey_number: p.jersey_number,
          is_captain: p.is_captain || false,
          career_name: p.career_id ? (careersMap.get(p.career_id) || null) : null,
          cedula_photo_url: p.cedula_photo_url || null,
        };
      });

      setPlayers(mappedPlayers);
    } catch (error: unknown) {
      console.error("Error cargando jugadores:", error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const [listRef] = useAutoAnimate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto pointer-events-none"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-0 my-2 sm:my-4 pointer-events-auto border border-gray-200 dark:border-neutral-700">
              {/* Header */}
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                    Inscripciones: {formName}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Equipos y jugadores inscritos
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
              </motion.div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
          {/* Lista de equipos */}
          <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-neutral-800 overflow-y-auto">
            <div className="p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Equipos Inscritos ({teamRegistrations.length})
              </h3>

              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Cargando equipos...
                </div>
              ) : teamRegistrations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay equipos inscritos
                </div>
              ) : (
                <div className="space-y-2" ref={listRef}>
                  {teamRegistrations.map((reg, index) => {
                    return (
                      <motion.button
                        key={reg.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedTeamId(reg.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border-2 transition-all shadow-sm hover:shadow-md",
                          selectedTeamId === reg.id
                            ? "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700"
                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {reg.team_name}
                          </p>
                          {reg.approved && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              Aprobado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{reg.players_count} jugadores</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Lista de jugadores */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 sm:p-4 md:p-6">
              {!selectedTeamId ? (
                <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                  <User className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">Selecciona un equipo para ver sus jugadores</p>
                </div>
              ) : loadingPlayers ? (
                <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-sm sm:text-base">Cargando jugadores...</p>
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                  <User className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">Este equipo no tiene jugadores inscritos</p>
                </div>
              ) : (
                <>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    Jugadores ({players.length})
                  </h3>
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-[800px]">
                      <thead className="bg-gray-50 dark:bg-neutral-800">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Nombre
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Cédula
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Email
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Teléfono
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Carrera
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Semestre
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Número
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Capitán
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Foto Cédula
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-neutral-800" ref={listRef}>
                        {players.map((player, index) => (
                          <motion.tr
                            key={player.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                              {player.full_name}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                              {player.cedula || "-"}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 text-xs sm:text-sm break-all">
                              {player.email || "-"}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                              {player.phone || "-"}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                              {player.career_name || "-"}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                              {player.semester || "-"}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                              {player.jersey_number || "-"}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                              {player.is_captain ? (
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                                  Sí
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600">-</span>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                              {player.cedula_photo_url && player.cedula_photo_url.trim() !== "" ? (
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={async () => {
                                    try {
                                      await openCedulaPhotoInNewTab(player.cedula_photo_url!);
                                    } catch (e) {
                                      console.error(e);
                                      alert("No se pudo abrir la foto de la cédula. Comprueba permisos del bucket en Supabase.");
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all cursor-pointer"
                                  title="Ver foto de cédula"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Ver cédula</span>
                                </motion.button>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600 text-xs">-</span>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
