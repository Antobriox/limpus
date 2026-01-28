"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useUsers } from "./hooks/useUsers";
import { motion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // Usar el hook con TanStack Query - los datos se cargan automáticamente y se cachean
  const { users, loading, deleteUser } = useUsers();

  // Filtrar usuarios basándose en el término de búsqueda
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

    const term = searchTerm.toLowerCase().trim();
    return users.filter(
      (user) =>
        (user.full_name || "").toLowerCase().includes(term) ||
        (user.email || "").toLowerCase().includes(term) ||
        user.roles.some((role) => role.name.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Usuarios
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href="/dashboard/usuarios/nuevo"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition text-white px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shadow-lg hover:shadow-xl"
          >
            + Nuevo usuario
          </Link>
        </motion.div>
      </motion.div>

      {/* Barra de búsqueda */}
      {users.length > 0 && (
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
      {users.length === 0 && (
        <div className="bg-gray-100 border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg p-10 text-center text-gray-500 dark:text-gray-400">
          No hay usuarios registrados todavía.
        </div>
      )}

      {/* Empty state para búsqueda */}
      {users.length > 0 && filteredUsers.length === 0 && (
        <div className="bg-gray-100 border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg p-10 text-center text-gray-500 dark:text-gray-400">
          No se encontraron usuarios que coincidan con &quot;{searchTerm}&quot;.
        </div>
      )}

      {/* Table */}
      {filteredUsers.length > 0 && (
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
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 sm:px-6 py-3 text-center font-semibold">Rol</th>
                  <th className="px-4 sm:px-6 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>

            <tbody ref={listRef}>
              {filteredUsers.map((u, index) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 font-medium text-gray-900 dark:text-white">
                    {u.full_name || "Sin nombre"}
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-gray-700 dark:text-gray-300">
                    <span className="break-all">{u.email}</span>
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-center">
                    {u.roles && u.roles.length > 0 ? (
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-500/10 dark:to-blue-500/5 text-blue-600 dark:text-blue-400"
                      >
                        {u.roles.map((r) => r.name).join(", ")}
                      </motion.span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400">
                        Sin rol
                      </span>
                    )}
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-right space-x-2 sm:space-x-3">
                    <motion.a
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      href={`/dashboard/usuarios/${u.id}`}
                      className="text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300 transition text-xs sm:text-sm font-medium"
                    >
                      Editar
                    </motion.a>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteUser(u.id)}
                      className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition text-xs sm:text-sm font-medium cursor-pointer"
                    >
                      Eliminar
                    </motion.button>
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
