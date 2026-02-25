"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "../../../../lib/utils";
import { toast } from "sonner";
import { useDashboard } from "../../torneos/hooks/useDashboard";

type Sport = {
  id: number;
  name: string;
};

export default function NuevaInscripcionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentEditionId } = useDashboard();

  const [loading, setLoading] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);

  const [form, setForm] = useState({
    name: "",
    sport_id: "",
    genero: "",
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
      toast.error("El nombre del formulario es requerido");
      return;
    }

    if (!form.sport_id) {
      toast.error("Debes seleccionar un deporte");
      return;
    }

    if (!form.genero) {
      toast.error("Debes seleccionar un género");
      return;
    }

    if (form.min_players > form.max_players) {
      toast.error("El mínimo no puede ser mayor al máximo");
      return;
    }

    if (currentEditionId == null || currentEditionId <= 0) {
      toast.error("No hay torneo activo. Crea un torneo primero.");
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
        genero: form.genero,
        editable_until: form.editable_until || null,
        min_players: form.min_players,
        max_players: form.max_players,
        is_locked: false,
        created_by: user?.id,
        edition_id: currentEditionId,
      });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Invalidar la query de inscripciones para que se actualice la lista
    queryClient.invalidateQueries({ queryKey: ["registrationForms"] });
    
    // Inscripción creada
    router.push("/dashboard/inscripciones");
  };

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
          Nueva Inscripción
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Crea un formulario de inscripción para un deporte
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
            Nombre del formulario <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            placeholder="Nombre del formulario"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Deporte <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Género <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            value={form.genero}
            onChange={(e) => setForm({ ...form, genero: e.target.value })}
          >
            <option value="">Selecciona un género</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Editable hasta (opcional)
          </label>
          <input
            type="datetime-local"
            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Mínimo de jugadores
            </label>
            <input
              type="number"
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Máximo de jugadores
            </label>
            <input
              type="number"
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            Cancelar
          </motion.button>

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            onClick={createInscripcion}
            disabled={loading}
            className={cn(
              "bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all font-semibold shadow-lg hover:shadow-xl cursor-pointer",
              loading && "cursor-not-allowed"
            )}
          >
            {loading ? "Creando..." : "Crear inscripción"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
