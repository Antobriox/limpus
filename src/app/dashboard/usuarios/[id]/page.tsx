"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

export default function EditarUsuarioPage() {
  const { id } = useParams();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔄 Cargar datos del usuario
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          full_name,
          email,
          id_rol,
          user_roles (
            role_id
          )
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("Usuario no encontrado");
        router.replace("/dashboard/usuarios");
        return;
      }

      setFullName(data.full_name);
      setEmail(data.email);
      setRoleId(data.id_rol ?? data.user_roles?.[0]?.role_id ?? 2);
      setLoading(false);
    };

    loadUser();
  }, [id, router]);

  // 💾 Guardar cambios
  const saveChanges = async () => {
    setSaving(true);

    const res = await fetch("/api/admin/update-user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: id,
        full_name: fullName,
        role_id: roleId,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }

    alert("Usuario actualizado");
    router.push("/dashboard/usuarios");
  };

  // 🗑️ Eliminar usuario
  const deleteUser = async () => {
    if (!confirm("¿Eliminar este usuario definitivamente?")) return;

    await fetch("/api/admin/delete-user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id }),
    });

    router.push("/dashboard/usuarios");
  };

  if (loading) {
    return <p>Cargando usuario...</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Editar Usuario</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nombre completo</label>
          <input
            className="w-full p-2 border rounded"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            className="w-full p-2 border rounded bg-gray-100"
            value={email}
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Rol</label>
          <select
            className="w-full p-2 border rounded"
            value={roleId}
            onChange={(e) => setRoleId(Number(e.target.value))}
          >
            <option value={1}>Administrador</option>
            <option value={2}>Líder de equipo</option>
            <option value={3}>Árbitro</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={saveChanges}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        <button
          onClick={deleteUser}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Eliminar usuario
        </button>
      </div>
    </div>
  );
}
