"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useRegistrationForms } from "./hooks/useRegistrationForms";
import { useDashboard } from "../torneos/hooks/useDashboard";
import ViewRegistrationsModal from "./components/ViewRegistrationsModal";
import { Eye, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export default function InscripcionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editionParam = searchParams.get("edition");
  const editionId = editionParam ? parseInt(editionParam, 10) : undefined;

  const { tournament, currentEditionId } = useDashboard(editionId);
  const { forms, loading, toggleStatus, deleteForm } = useRegistrationForms(currentEditionId);
  const [selectedForm, setSelectedForm] = useState<{ id: number; name: string } | null>(null);

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
            Formularios de Inscripción
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona las inscripciones por deporte
          </p>
        </div>

        {!editionId && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/dashboard/inscripciones/nueva"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition text-white px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shadow-lg hover:shadow-xl"
            >
              + Nueva inscripción
            </Link>
          </motion.div>
        )}
      </motion.div>

      {editionId && tournament && (
        <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50 p-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Vista de torneo finalizado: <strong>{tournament.name}</strong>. Las inscripciones mostradas corresponden al período del torneo.
        </div>
      )}

      {/* Empty state */}
      {forms.length === 0 && (
        <div className="bg-gray-100 border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-lg p-10 text-center text-gray-500 dark:text-gray-400">
          No hay formularios creados todavía.
        </div>
      )}

      {/* Table */}
      {forms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-xl overflow-hidden shadow-lg"
        >
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 sm:px-6 py-3 text-center font-semibold">Género</th>
                  <th className="px-4 sm:px-6 py-3 text-center font-semibold">Jugadores</th>
                  <th className="px-4 sm:px-6 py-3 text-center font-semibold">Editable hasta</th>
                  <th className="px-4 sm:px-6 py-3 text-center font-semibold">Estado</th>
                  <th className="px-4 sm:px-6 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>

            <tbody ref={listRef}>
              {forms.map((f, index) => (
                <motion.tr
                  key={f.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 font-medium text-gray-900 dark:text-white">
                    {f.name}
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-center">
                    {f.genero ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        f.genero === "masculino"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                          : "bg-pink-100 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400"
                      }`}>
                        {f.genero === "masculino" ? "Masculino" : "Femenino"}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600 text-xs">No asignado</span>
                    )}
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
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedForm({ id: f.id, name: f.name })}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition text-xs sm:text-sm font-medium cursor-pointer"
                      title="Ver equipos inscritos"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </motion.button>

                    {!editionId && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleStatus(f.id, f.is_locked)}
                          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition text-xs sm:text-sm font-medium cursor-pointer"
                        >
                          {f.is_locked ? "Abrir" : "Cerrar"}
                        </motion.button>
                        <motion.a
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          href={`/dashboard/inscripciones/${f.id}`}
                          className="text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300 transition text-xs sm:text-sm font-medium cursor-pointer"
                        >
                          Editar
                        </motion.a>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteForm(f.id)}
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

      {/* Modal para ver inscripciones */}
      {selectedForm && (
        <ViewRegistrationsModal
          formId={selectedForm.id}
          formName={selectedForm.name}
          isOpen={!!selectedForm}
          onClose={() => setSelectedForm(null)}
          tournamentStart={tournament?.start_date || null}
          tournamentEnd={tournament?.end_date || null}
        />
      )}
    </div>
  );
}
