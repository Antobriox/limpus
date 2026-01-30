"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";


export default function EditarTorneoPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  // Cargar datos de la edición del torneo
  useEffect(() => {
    const loadTournamentEdition = async () => {
      try {
        // Cargar la edición del torneo (tournament_editions)
        const { data: edition, error: editionError } = await supabase
          .from("tournament_editions")
          .select("id, name, start_date, end_date")
          .eq("id", tournamentId)
          .single();

        if (editionError || !edition) {
          console.error("Edición no encontrada. ID:", tournamentId, "Error:", editionError);
          router.replace("/dashboard/torneos");
          return;
        }

        // Cargar datos en el formulario
        setForm({
          name: edition.name || "",
          start_date: edition.start_date || "",
          end_date: edition.end_date || "",
        });

        setLoading(false);
      } catch (error) {
        console.error("Error cargando edición del torneo:", error);
        router.replace("/dashboard/torneos");
      }
    };

    if (tournamentId) {
      loadTournamentEdition();
    }
  }, [tournamentId, router]);


  const updateTournament = async () => {
    if (!form.name.trim()) {
      // alert eliminada"El nombre del torneo es requerido");
      return;
    }

    if (!form.start_date || !form.end_date) {
      // alert eliminada"Debes ingresar las fechas de inicio y fin");
      return;
    }

    if (new Date(form.start_date) > new Date(form.end_date)) {
      // alert eliminada"La fecha de inicio no puede ser posterior a la fecha de fin");
      return;
    }

    setSaving(true);

    try {
      // Actualizar la edición del torneo (tournament_editions)
      const { error: updateError } = await supabase
        .from("tournament_editions")
        .update({
          name: form.name.trim(),
          start_date: form.start_date,
          end_date: form.end_date,
        })
        .eq("id", tournamentId);

      if (updateError) {
        throw updateError;
      }

      // alert eliminada"Torneo actualizado correctamente");
      router.push("/dashboard/torneos");
    } catch (error: unknown) {
      console.error("Error actualizando edición del torneo:", error);
      // alert eliminada(error instanceof Error ? error.message : "Error al actualizar el torneo");
    } finally {
      setSaving(false);
    }
  };

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
      <motion.button
        type="button"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push("/dashboard/torneos")}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </motion.button>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Editar Torneo
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Modifica los datos del torneo
        </p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 sm:p-6 space-y-6 max-w-2xl shadow-lg"
      >
        {/* Nombre del Torneo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Torneo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            placeholder="Ej: Copa Universitaria 2024"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Inicio <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Fin <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
              value={form.end_date}
              onChange={(e) =>
                setForm({ ...form, end_date: e.target.value })
              }
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.05 }}
            whileTap={{ scale: saving ? 1 : 0.95 }}
            onClick={() => router.back()}
            className="px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md"
            disabled={saving}
          >
            Cancelar
          </motion.button>
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.05 }}
            whileTap={{ scale: saving ? 1 : 0.95 }}
            onClick={updateTournament}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all font-semibold shadow-lg hover:shadow-xl"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

