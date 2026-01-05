"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type TeamRow = {
  id: number;
  name: string;
  faculty: string;
  captain: string;
  leaders: string;
};

export default function EquiposPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeams = async () => {
    setLoading(true);

    try {
      // Cargar todos los equipos básicos
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });

      if (teamsError) {
        console.error("Error cargando equipos:", teamsError);
        setTeams([]);
        setLoading(false);
        return;
      }

      if (!teamsData) {
        setTeams([]);
        setLoading(false);
        return;
      }

      // Si no hay equipos, mostrar lista vacía
      if (teamsData.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
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

        if (teamLeadersError) {
          console.warn("Error cargando team_leaders:", teamLeadersError);
        } else if (teamLeadersData && teamLeadersData.length > 0) {
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

      setTeams(teamsWithDetails);
    } catch (error) {
      console.error("Error cargando equipos:", error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const deleteTeam = async (id: number) => {
    if (!confirm("¿Eliminar este equipo? Esta acción no se puede deshacer.")) return;

    try {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", id);

      if (error) {
        alert("Error al eliminar equipo: " + error.message);
        return;
      }

      loadTeams();
    } catch (error) {
      console.error("Error eliminando equipo:", error);
      alert("Error al eliminar equipo");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 dark:text-gray-500">
        Cargando equipos…
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Equipos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona los equipos inscritos en el torneo
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/equipos/nuevoequipo")}
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 sm:px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
        >
          + Nuevo equipo
        </button>
      </div>

      {/* Empty state */}
      {teams.length === 0 && (
        <div className="bg-gray-100 border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg p-10 text-center text-gray-500 dark:text-gray-400">
          No hay equipos registrados todavía.
        </div>
      )}

      {/* Table */}
      {teams.length > 0 && (
        <div className="bg-white border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left">Equipo</th>
                  <th className="px-4 sm:px-6 py-3 text-left">Facultad</th>
                  <th className="px-4 sm:px-6 py-3 text-left">Capitán</th>
                  <th className="px-4 sm:px-6 py-3 text-left">Líderes</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {teams.map((team) => (
                  <tr
                    key={team.id}
                    className="border-t border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/40 transition"
                  >
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {team.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 sm:px-6 py-3 text-gray-700 dark:text-gray-300">
                      {team.faculty}
                    </td>

                    <td className="px-4 sm:px-6 py-3 text-gray-700 dark:text-gray-300">
                      {team.captain}
                    </td>

                    <td className="px-4 sm:px-6 py-3 text-gray-700 dark:text-gray-300">
                      {team.leaders}
                    </td>

                    <td className="px-4 sm:px-6 py-3 text-right space-x-2 sm:space-x-3">
                      <button
                        onClick={() => router.push(`/dashboard/equipos/${team.id}`)}
                        className="text-yellow-400 hover:text-yellow-300 transition text-xs sm:text-sm"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => deleteTeam(team.id)}
                        className="text-red-400 hover:text-red-300 transition text-xs sm:text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

