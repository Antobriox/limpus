"use client";

import { useState, useEffect, useCallback } from "react";

// Tipos para datos de Supabase
type SupabaseTeamRegistration = {
  id: number;
  team_id: number;
  teams?: {
    name: string;
  };
};

type SupabasePlayer = {
  id: number;
  full_name: string;
  email: string | null;
  cedula: string | null;
  phone: string | null;
  semester: number | null;
  jersey_number: number | null;
  is_captain: boolean;
  careers?: {
    name: string;
  };
};
import { supabase } from "../../../../lib/supabaseClient";
import { X, Users, User } from "lucide-react";

type ViewRegistrationsModalProps = {
  formId: number;
  formName: string;
  isOpen: boolean;
  onClose: () => void;
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
      // Cargar todas las inscripciones de equipos para este formulario
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

          return {
            id: reg.id,
            team_id: reg.team_id,
            team_name: (reg.teams as { name: string } | null)?.name || "Equipo desconocido",
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
          careers!inner (
            name
          )
        `)
        .eq("team_registration_id", teamRegistrationId)
        .order("full_name");

      if (error) throw error;

      setPlayers(
        ((playersData || []) as SupabasePlayer[]).map((p: SupabasePlayer) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          cedula: p.cedula,
          phone: p.phone,
          semester: p.semester,
          jersey_number: p.jersey_number,
          is_captain: p.is_captain || false,
          career_name: p.careers?.name || null,
        }))
      );
    } catch (error: unknown) {
      console.error("Error cargando jugadores:", error);
    } finally {
      setLoadingPlayers(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Inscripciones: {formName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Equipos y jugadores inscritos
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Lista de equipos */}
          <div className="w-1/3 border-r border-gray-200 dark:border-neutral-800 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                <div className="space-y-2">
                  {teamRegistrations.map((reg) => (
                    <button
                      key={reg.id}
                      onClick={() => setSelectedTeamId(reg.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        selectedTeamId === reg.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                          : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600"
                      }`}
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
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lista de jugadores */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {!selectedTeamId ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona un equipo para ver sus jugadores</p>
                </div>
              ) : loadingPlayers ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Cargando jugadores...
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Este equipo no tiene jugadores inscritos</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Jugadores ({players.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-neutral-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Nombre
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Cédula
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Teléfono
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Carrera
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Semestre
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Número
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                            Capitán
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                        {players.map((player) => (
                          <tr
                            key={player.id}
                            className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                              {player.full_name}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {player.cedula || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {player.email || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {player.phone || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                              {player.career_name || "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                              {player.semester || "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                              {player.jersey_number || "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {player.is_captain ? (
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                                  Sí
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-600">-</span>
                              )}
                            </td>
                          </tr>
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
    </div>
  );
}
