"use client";

import { useRegistrationForms } from "./hooks/useRegistrationForms";

export default function InscripcionesPage() {
  // Usar el hook con TanStack Query - los datos se cargan automáticamente y se cachean
  const { forms, loading, toggleStatus, deleteForm } = useRegistrationForms();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        Cargando formularios…
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Formularios de Inscripción
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona las inscripciones por deporte
          </p>
        </div>

        <a
          href="/dashboard/inscripciones/nueva"
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 sm:px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
        >
          + Nueva inscripción
        </a>
      </div>

      {/* Empty state */}
      {forms.length === 0 && (
        <div className="bg-gray-100 border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg p-10 text-center text-gray-500 dark:text-gray-400">
          No hay formularios creados todavía.
        </div>
      )}

      {/* Table */}
      {forms.length > 0 && (
        <div className="bg-white border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left">Nombre</th>
                  <th className="px-4 sm:px-6 py-3 text-center">Jugadores</th>
                  <th className="px-4 sm:px-6 py-3 text-center">Editable hasta</th>
                  <th className="px-4 sm:px-6 py-3 text-center">Estado</th>
                  <th className="px-4 sm:px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>

            <tbody>
              {forms.map((f) => (
                <tr
                  key={f.id}
                  className="border-t border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/40 transition"
                >
                  <td className="px-4 sm:px-6 py-3 font-medium text-gray-900 dark:text-white">
                    {f.name}
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-center text-gray-700 dark:text-gray-300">
                    {f.min_players} – {f.max_players}
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                    {f.editable_until 
                      ? new Date(f.editable_until).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Sin límite"}
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-center">
                    {f.is_locked ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        Cerrada
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                        Abierta
                      </span>
                    )}
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-right space-x-2 sm:space-x-3">
                    <button
                      onClick={() => toggleStatus(f.id, f.is_locked)}
                      className="text-blue-400 hover:text-blue-300 transition text-xs sm:text-sm"
                    >
                      {f.is_locked ? "Abrir" : "Cerrar"}
                    </button>

                    <a
                      href={`/dashboard/inscripciones/${f.id}`}
                      className="text-yellow-400 hover:text-yellow-300 transition text-xs sm:text-sm"
                    >
                      Editar
                    </a>

                    <button
                      onClick={() => deleteForm(f.id)}
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
