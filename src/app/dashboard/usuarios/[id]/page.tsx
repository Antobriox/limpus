"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "../../../../lib/utils";
import { toast } from "sonner";

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
        // alert eliminada"Usuario no encontrado");
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
      toast.error(data.error || "Error al actualizar el usuario");
      return;
    }

    // Invalidar la query de usuarios para que se actualice la lista
    queryClient.invalidateQueries({ queryKey: ["users"] });
    
    // Usuario actualizado
    router.push("/dashboard/usuarios");
  };

  // 🗑️ Eliminar usuario
  const deleteUser = async () => {
    // Confirmación eliminada

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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <motion.button
        type="button"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push("/dashboard/usuarios")}
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
          Editar Usuario
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Modifica los datos del usuario
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 sm:p-6 space-y-4 max-w-2xl shadow-lg"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Nombre completo
          </label>
          <input
            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            value={email}
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Rol
          </label>
          <select
            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            value={roleId}
            onChange={(e) => setRoleId(Number(e.target.value))}
          >
            <option value={1}>Administrador</option>
            <option value={2}>Líder de equipo</option>
            <option value={3}>Árbitro</option>
          </select>
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.05 }}
            whileTap={{ scale: saving ? 1 : 0.95 }}
            onClick={saveChanges}
            disabled={saving}
            className={cn(
              "bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all font-semibold shadow-lg hover:shadow-xl cursor-pointer",
              saving && "cursor-not-allowed"
            )}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={deleteUser}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl cursor-pointer"
          >
            Eliminar usuario
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
