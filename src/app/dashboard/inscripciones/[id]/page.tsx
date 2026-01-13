"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export default function EditInscripcionPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("registration_forms")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setForm(data));
  }, [id]);

  const save = async () => {
    await supabase
      .from("registration_forms")
      .update(form)
      .eq("id", id);

    // Invalidar la query de inscripciones para que se actualice la lista
    queryClient.invalidateQueries({ queryKey: ["registrationForms"] });
    
    router.push("/dashboard/inscripciones");
  };

  if (!form) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 dark:text-gray-500">
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Editar Inscripción
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Modifica los datos del formulario de inscripción
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 sm:p-6 space-y-4 max-w-2xl">
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
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
