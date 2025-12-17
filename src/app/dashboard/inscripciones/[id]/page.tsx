"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

export default function EditInscripcionPage() {
  const { id } = useParams();
  const router = useRouter();
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

    router.push("/dashboard/inscripciones");
  };

  if (!form) return <p>Cargando...</p>;

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Editar Inscripción</h1>

      <input
        className="border p-2 w-full"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <div className="flex gap-4">
        <input
          type="number"
          className="border p-2 w-full"
          value={form.min_players}
          onChange={(e) =>
            setForm({ ...form, min_players: Number(e.target.value) })
          }
        />
        <input
          type="number"
          className="border p-2 w-full"
          value={form.max_players}
          onChange={(e) =>
            setForm({ ...form, max_players: Number(e.target.value) })
          }
        />
      </div>

      <button
        onClick={save}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Guardar cambios
      </button>
    </div>
  );
}
