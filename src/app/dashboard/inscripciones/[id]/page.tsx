"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function EditInscripcionPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{
    id: number;
    name: string;
    sport_id: number;
    min_players: number;
    max_players: number;
    editable_until: string | null;
    is_locked: boolean;
    genero: string | null;
  } | null>(null);

  useEffect(() => {
    supabase
      .from("registration_forms")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setForm(data));
  }, [id]);

  const save = async () => {
    try {
      const { error } = await supabase
        .from("registration_forms")
        .update(form)
        .eq("id", id);

      if (error) {
        toast.error(error.message || "Error al actualizar la inscripción");
        return;
      }

      // Invalidar la query de inscripciones para que se actualice la lista
      queryClient.invalidateQueries({ queryKey: ["registrationForms"] });
      
      toast.success("Inscripción actualizada correctamente");
      router.push("/dashboard/inscripciones");
    } catch {
      toast.error("Error al guardar los cambios");
    }
  };

  if (!form) {
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
        onClick={() => router.push("/dashboard/inscripciones")}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </motion.button>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Editar Inscripción
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Modifica los datos del formulario de inscripción
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 sm:p-6 space-y-4 max-w-2xl shadow-lg"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del formulario
          </label>
          <input
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mínimo de jugadores
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.min_players}
              onChange={(e) =>
                setForm({ ...form, min_players: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Máximo de jugadores
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.max_players}
              onChange={(e) =>
                setForm({ ...form, max_players: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md font-medium cursor-pointer"
          >
            Cancelar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={save}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-xl cursor-pointer"
          >
            Guardar cambios
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
