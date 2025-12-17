"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Form = {
  id: number;
  name: string;
  min_players: number;
  max_players: number;
  start_date: string;
  end_date: string;
  is_locked: boolean;
  sports: { name: string };
};

export default function InscripcionesPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  const loadForms = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("registration_forms")
      .select(`
        id,
        name,
        min_players,
        max_players,
        start_date,
        end_date,
        is_locked,
        sports(name)
      `)
      .order("id", { ascending: false });

    setForms(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadForms();
  }, []);

  const toggleStatus = async (id: number, locked: boolean) => {
    await supabase
      .from("registration_forms")
      .update({ is_locked: !locked })
      .eq("id", id);

    loadForms();
  };

  const deleteForm = async (id: number) => {
    if (!confirm("¿Eliminar este formulario? Esta acción no se puede deshacer.")) return;

    await supabase.from("registration_forms").delete().eq("id", id);
    loadForms();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        Cargando formularios…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Formularios de Inscripción
          </h1>
          <p className="text-sm text-gray-400">
            Gestiona las inscripciones por deporte
          </p>
        </div>

        <a
          href="/dashboard/inscripciones/nueva"
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded-lg text-sm font-medium"
        >
          + Nueva inscripción
        </a>
      </div>

      {/* Empty state */}
      {forms.length === 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-10 text-center text-gray-400">
          No hay formularios creados todavía.
        </div>
      )}

      {/* Table */}
      {forms.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-800 text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th>Deporte</th>
                <th>Jugadores</th>
                <th>Fechas</th>
                <th>Estado</th>
                <th className="text-right px-4">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {forms.map((f) => (
                <tr
                  key={f.id}
                  className="border-t border-neutral-800 hover:bg-neutral-800/40 transition"
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {f.name}
                  </td>

                  <td className="text-gray-300">{f.sports?.name}</td>

                  <td className="text-gray-300">
                    {f.min_players} – {f.max_players}
                  </td>

                  <td className="text-gray-400">
                    {f.start_date} → {f.end_date}
                  </td>

                  <td>
                    {f.is_locked ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                        Cerrada
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                        Abierta
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      onClick={() => toggleStatus(f.id, f.is_locked)}
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      {f.is_locked ? "Abrir" : "Cerrar"}
                    </button>

                    <a
                      href={`/dashboard/inscripciones/${f.id}`}
                      className="text-yellow-400 hover:text-yellow-300 transition"
                    >
                      Editar
                    </a>

                    <button
                      onClick={() => deleteForm(f.id)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
