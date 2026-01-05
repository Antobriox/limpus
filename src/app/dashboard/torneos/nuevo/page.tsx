"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type Sport = {
  id: number;
  name: string;
};


export default function NuevoTorneoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);

  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  // Cargar deportes para mostrar cuántos se crearán
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


  const createTournament = async () => {
    if (!form.name.trim()) {
      alert("El nombre del torneo es requerido");
      return;
    }

    if (!form.start_date || !form.end_date) {
      alert("Debes ingresar las fechas de inicio y fin");
      return;
    }

    if (new Date(form.start_date) > new Date(form.end_date)) {
      alert("La fecha de inicio no puede ser posterior a la fecha de fin");
      return;
    }

    if (sports.length === 0) {
      alert("No hay deportes registrados. Debes crear al menos un deporte primero.");
      return;
    }

    // Los equipos son opcionales al crear un torneo nuevo
    // Se pueden agregar después editando el torneo

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // NO borramos partidos del torneo anterior. Los partidos son datos históricos que deben mantenerse.
      // Cada torneo es independiente y los partidos se crean cuando se programan los encuentros.

      // Crear un torneo para cada deporte/disciplina
      const tournamentsToInsert = sports.map((sport) => ({
        name: form.name.trim(),
        sport_id: sport.id,
        start_date: form.start_date,
        end_date: form.end_date,
        created_by: user?.id || null,
      }));

      const { data: createdTournaments, error: tournamentsError } = await supabase
        .from("tournaments")
        .insert(tournamentsToInsert)
        .select();

      if (tournamentsError) {
        throw tournamentsError;
      }

      if (!createdTournaments || createdTournaments.length === 0) {
        throw new Error("No se pudieron crear los torneos");
      }

      // NO crear matches ni borrar datos. Solo crear el torneo.
      alert(`Torneo creado para ${sports.length} disciplina(s)`);
      router.push("/dashboard/torneos");
    } catch (error: any) {
      console.error("Error creando torneo:", error);
      alert(error.message || "Error al crear el torneo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Nuevo Torneo
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Crea un nuevo torneo que incluirá todas las disciplinas disponibles
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 sm:p-6 space-y-6 max-w-2xl">
        {/* Nombre del Torneo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Torneo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Copa Universitaria 2024"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Información de disciplinas */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Disciplinas incluidas:</strong> Este torneo incluirá todas las disciplinas registradas ({sports.length} disciplina{sports.length !== 1 ? 's' : ''}).
          </p>
          {sports.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {sports.map((sport) => (
                <span
                  key={sport.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300"
                >
                  {sport.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Inicio <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Fin <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.end_date}
              onChange={(e) =>
                setForm({ ...form, end_date: e.target.value })
              }
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={createTournament}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando..." : "Crear Torneo"}
          </button>
        </div>
      </div>
    </div>
  );
}

