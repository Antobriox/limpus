"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useTeams } from "./hooks/useTeams";
import { useDashboard } from "../torneos/hooks/useDashboard";
import { motion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export default function EquiposPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editionParam = searchParams.get("edition");
  const editionId = editionParam ? parseInt(editionParam, 10) : undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const { currentEditionId } = useDashboard(editionId);
  const { teams, loading, deleteTeam } = useTeams(currentEditionId);

  // Filtrar equipos basándose en el término de búsqueda
  const filteredTeams = useMemo(() => {
    if (!searchTerm.trim()) {
      return teams;
    }

    const term = searchTerm.toLowerCase().trim();
    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(term) ||
        team.faculty.toLowerCase().includes(term) ||
        team.leaders.toLowerCase().includes(term)
    );
  }, [teams, searchTerm]);

  const [listRef] = useAutoAnimate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 dark:text-gray-500">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {editionId && (
        <motion.button
          type="button"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push(`/dashboard/torneos?edition=${editionId}`)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </motion.button>
      )}
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Equipos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona los equipos inscritos en el torneo
          </p>
        </div>

        {!editionId && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/dashboard/equipos/nuevoequipo")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition text-white px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shadow-lg hover:shadow-xl cursor-pointer"
          >
            + Nuevo equipo
          </motion.button>
        )}
      </motion.div>

      {/* Barra de búsqueda */}
      {teams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
          />
        </motion.div>
      )}

      {/* Empty state */}
      {teams.length === 0 && (
        <div className="bg-gray-100 border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg p-10 text-center text-gray-500 dark:text-gray-400">
          <p className="font-medium">No hay equipos en este torneo todavía.</p>
          <p className="mt-1 text-sm">Crea equipos con el botón &quot;Nuevo equipo&quot; para que aparezcan aquí.</p>
        </div>
      )}

      {/* Empty state para búsqueda */}
      {teams.length > 0 && filteredTeams.length === 0 && (
        <div className="bg-gray-100 border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg p-10 text-center text-gray-500 dark:text-gray-400">
          No se encontraron equipos que coincidan con &quot;{searchTerm}&quot;.
        </div>
      )}

      {/* Table */}
      {filteredTeams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-xl overflow-hidden shadow-lg"
        >
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Equipo</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Facultad</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Líderes</th>
                  <th className="px-4 sm:px-6 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>

              <tbody ref={listRef}>
                {filteredTeams.map((team, index) => (
                  <motion.tr
                    key={team.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
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
                      {team.leaders}
                    </td>

                    <td className="px-4 sm:px-6 py-3 text-right space-x-2 sm:space-x-3">
                      {!editionId && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => router.push(`/dashboard/equipos/${team.id}`)}
                            className="text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300 transition text-xs sm:text-sm font-medium cursor-pointer"
                          >
                            Editar
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteTeam(team.id)}
                            className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition text-xs sm:text-sm font-medium cursor-pointer"
                          >
                            Eliminar
                          </motion.button>
                        </>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

