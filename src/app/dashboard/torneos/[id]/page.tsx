"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";


export default function EditarTorneoPage() {
  const router = useRouter();
  const params = useParams();
  const tournamentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tournamentData, setTournamentData] = useState<any>(null);
  const [allTournamentsWithSameName, setAllTournamentsWithSameName] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  // Cargar datos del torneo
  useEffect(() => {
    const loadTournament = async () => {
      try {
        // Cargar el torneo específico
        const { data: tournament, error: tournamentError } = await supabase
          .from("tournaments")
          .select("id, name, start_date, end_date, sport_id")
          .eq("id", tournamentId)
          .single();

        if (tournamentError || !tournament) {
          alert("Torneo no encontrado");
          router.replace("/dashboard/torneos");
          return;
        }

        setTournamentData(tournament);

        // Cargar todos los torneos con el mismo nombre (mismo torneo, diferentes disciplinas)
        const { data: allTournaments } = await supabase
          .from("tournaments")
          .select("id, name, start_date, end_date, sport_id")
          .eq("name", tournament.name);

        if (allTournaments) {
          setAllTournamentsWithSameName(allTournaments);
          // Usar los datos del primer torneo para el formulario
          const firstTournament = allTournaments[0];
          setForm({
            name: firstTournament.name || "",
            start_date: firstTournament.start_date || "",
            end_date: firstTournament.end_date || "",
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error cargando torneo:", error);
        alert("Error al cargar el torneo");
        router.replace("/dashboard/torneos");
      }
    };

    if (tournamentId) {
      loadTournament();
    }
  }, [tournamentId, router]);


  const updateTournament = async () => {
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

    setSaving(true);

    try {
      // Actualizar todos los torneos con el mismo nombre (todas las disciplinas)
      const tournamentIds = allTournamentsWithSameName.map((t) => t.id);

      const { error: updateError } = await supabase
        .from("tournaments")
        .update({
          name: form.name.trim(),
          start_date: form.start_date,
          end_date: form.end_date,
        })
        .in("id", tournamentIds);

      if (updateError) {
        throw updateError;
      }

      // NO crear ni eliminar matches. Solo actualizar datos del torneo.
      alert("Torneo actualizado correctamente");
      router.push("/dashboard/torneos");
    } catch (error: any) {
      console.error("Error actualizando torneo:", error);
      alert(error.message || "Error al actualizar el torneo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 dark:text-gray-500">
        Cargando torneo...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Editar Torneo
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Modifica los datos del torneo
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
        {allTournamentsWithSameName.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Disciplinas incluidas:</strong> Este torneo incluye {allTournamentsWithSameName.length} disciplina{allTournamentsWithSameName.length !== 1 ? 's' : ''}.
            </p>
          </div>
        )}

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
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={updateTournament}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

