"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

type Sport = {
  id: number;
  name: string;
};

export default function NuevaInscripcionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);

  const [form, setForm] = useState({
    name: "",
    sport_id: "",
    editable_until: "",
    min_players: 5,
    max_players: 12,
  });

  // Cargar deportes disponibles
  useEffect(() => {
    const loadSports = async () => {
      const { data } = await supabase
        .from("sports")
        .select("id, name")
        .order("name", { ascending: true });

      if (data) {
        setSports(data);
      }
    };

    loadSports();
  }, []);

  const createInscripcion = async () => {
    if (!form.name) {
      alert("El nombre del formulario es requerido");
      return;
    }

    if (!form.sport_id) {
      alert("Debes seleccionar un deporte");
      return;
    }

    if (form.min_players > form.max_players) {
      alert("El mínimo no puede ser mayor al máximo");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("registration_forms")
      .insert({
        name: form.name,
        sport_id: parseInt(form.sport_id),
        editable_until: form.editable_until || null,
        min_players: form.min_players,
        max_players: form.max_players,
        is_locked: false,
        created_by: user?.id,
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    // Invalidar la query de inscripciones para que se actualice la lista
    queryClient.invalidateQueries({ queryKey: ["registrationForms"] });
    
    router.push("/dashboard/inscripciones");
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Nueva Inscripción
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Crea un formulario de inscripción para un deporte
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 sm:p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del formulario <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nombre del formulario"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deporte <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.sport_id}
            onChange={(e) => setForm({ ...form, sport_id: e.target.value })}
          >
            <option value="">Selecciona un deporte</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Editable hasta (opcional)
          </label>
          <input
            type="datetime-local"
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={form.editable_until}
            onChange={(e) =>
              setForm({ ...form, editable_until: e.target.value })
            }
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Deja vacío si no hay límite de tiempo para editar
          </p>
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
                setForm({
                  ...form,
                  min_players: Number(e.target.value),
                })
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
                setForm({
                  ...form,
                  max_players: Number(e.target.value),
                })
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
            onClick={createInscripcion}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando..." : "Crear inscripción"}
          </button>
        </div>
      </div>
    </div>
  );
}
