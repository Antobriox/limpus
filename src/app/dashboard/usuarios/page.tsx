"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useUsers } from "./hooks/useUsers";

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
        user.email.toLowerCase().includes(term) ||
        user.roles.some((role) => role.name.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 dark:text-gray-500">
        Cargando usuarios…
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Usuarios
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona los usuarios del sistema
          </p>
        </div>

        <Link
          href="/dashboard/usuarios/nuevo"
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 sm:px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
        >
          + Nuevo usuario
        </Link>
      </div>

      {/* Barra de búsqueda */}
      {users.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
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
        <div className="bg-white border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left">Nombre</th>
                  <th className="px-4 sm:px-6 py-3 text-left">Email</th>
                  <th className="px-4 sm:px-6 py-3 text-center">Rol</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td className="px-4 sm:px-6 py-3 font-medium text-gray-900 dark:text-white">
                    {u.full_name || "Sin nombre"}
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-gray-700 dark:text-gray-300">
                    <span className="break-all">{u.email}</span>
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-center">
                    {u.roles && u.roles.length > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        {u.roles.map((r) => r.name).join(", ")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400">
                        Sin rol
                      </span>
                    )}
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-right space-x-2 sm:space-x-3">
                    <a
                      href={`/dashboard/usuarios/${u.id}`}
                      className="text-yellow-400 hover:text-yellow-300 transition text-xs sm:text-sm"
                    >
                      Editar
                    </a>

                    <button
                      onClick={() => deleteUser(u.id)}
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
