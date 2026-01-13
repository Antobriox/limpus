"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";

export default function EditarUsuarioPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

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

    // Invalidar la query de usuarios para que se actualice la lista
    queryClient.invalidateQueries({ queryKey: ["users"] });
    
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

    // Invalidar la query de usuarios para que se actualice la lista
    queryClient.invalidateQueries({ queryKey: ["users"] });
    
    router.push("/dashboard/usuarios");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 dark:text-gray-500">
        Cargando usuario...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Editar Usuario
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Modifica los datos del usuario
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 sm:p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre completo
          </label>
          <input
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            value={email}
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rol
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={roleId}
            onChange={(e) => setRoleId(Number(e.target.value))}
          >
            <option value={1}>Administrador</option>
            <option value={2}>Líder de equipo</option>
            <option value={3}>Árbitro</option>
          </select>
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            onClick={deleteUser}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Eliminar usuario
          </button>
        </div>
      </div>
    </div>
  );
}
