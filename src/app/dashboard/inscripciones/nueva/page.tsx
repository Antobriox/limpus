"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type Sport = {
  id: number;
  name: string;
};

export default function NuevaInscripcionPage() {
  const router = useRouter();

  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sport_id: "",
    start_date: "",
    end_date: "",
    min_players: 5,
    max_players: 12,
  });

  // Cargar deportes
  useEffect(() => {
    supabase
      .from("sports")
      .select("id, name")
      .then(({ data }) => {
        setSports(data || []);
      });
  }, []);

  const createInscripcion = async () => {
    if (
      !form.name ||
      !form.sport_id ||
      !form.start_date ||
      !form.end_date
    ) {
      alert("Completa todos los campos");
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
        sport_id: Number(form.sport_id),
        start_date: form.start_date,
        end_date: form.end_date,
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

    router.push("/dashboard/inscripciones");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nueva Inscripción</h1>
        <p className="text-gray-500">
          Crea un formulario de inscripción para un deporte
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border space-y-4">
        <input
          className="border p-2 w-full rounded"
          placeholder="Nombre del formulario"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <select
          className="border p-2 w-full rounded"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Fecha inicio</label>
            <input
              type="date"
              className="border p-2 w-full rounded"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Fecha fin</label>
            <input
              type="date"
              className="border p-2 w-full rounded"
              value={form.end_date}
              onChange={(e) =>
                setForm({ ...form, end_date: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">
              Mínimo de jugadores
            </label>
            <input
              type="number"
              className="border p-2 w-full rounded"
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
            <label className="text-sm text-gray-600">
              Máximo de jugadores
            </label>
            <input
              type="number"
              className="border p-2 w-full rounded"
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

        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>

          <button
            onClick={createInscripcion}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear inscripción"}
          </button>
        </div>
      </div>
    </div>
  );
}
