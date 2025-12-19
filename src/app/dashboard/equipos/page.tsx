"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type TeamRow = {
  id: number;
  name: string;
  faculty: string;
  captain: string;
  status: string;
  image_url?: string;
};

export default function EquiposPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeams = async () => {
    setLoading(true);

    try {
      // Cargar equipos con sus carreras
      const { data: teamsData } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          image_url,
          created_at,
          careers (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (teamsData && teamsData.length > 0) {
        // Obtener todos los career_ids únicos
        const careerIds = teamsData
          .flatMap((team: any) => team.careers || [])
          .map((career: any) => career.id)
          .filter((id: number) => id);

        // Obtener todos los capitanes de una vez
        const { data: captainsData } = await supabase
          .from("players")
          .select("career_id, full_name")
          .in("career_id", careerIds)
          .eq("is_captain", true);

        // Crear un mapa de career_id -> captain name
        const captainsMap = new Map(
          captainsData?.map((c: any) => [c.career_id, c.full_name]) || []
        );

        // Mapear equipos con sus detalles
        const teamsWithDetails = teamsData.map((team: any) => {
          const faculty = team.careers && team.careers.length > 0 
            ? team.careers[0].name 
            : "Sin facultad";

          const careerId = team.careers && team.careers.length > 0 
            ? team.careers[0].id 
            : null;

          const captain = careerId && captainsMap.has(careerId)
            ? captainsMap.get(careerId)!
            : "Sin capitán";

          return {
            id: team.id,
            name: team.name,
            faculty: faculty,
            captain: captain,
            status: "Verificado",
            image_url: team.image_url || null,
          };
        });

        setTeams(teamsWithDetails);
      } else {
        setTeams([]);
      }
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
                  <th className="px-4 sm:px-6 py-3 text-center">Estado</th>
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
                        {team.image_url ? (
                          <img
                            src={team.image_url}
                            alt={team.name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {team.name.charAt(0).toUpperCase()}
                          </div>
                        )}
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

                    <td className="px-4 sm:px-6 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400">
                        {team.status}
                      </span>
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

