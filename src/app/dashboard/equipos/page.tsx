"use client";

import { useRouter } from "next/navigation";
import { useTeams } from "./hooks/useTeams";

export default function EquiposPage() {
  const router = useRouter();
  // Usar el hook con TanStack Query - los datos se cargan automáticamente y se cachean
  const { teams, loading, deleteTeam } = useTeams();

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

