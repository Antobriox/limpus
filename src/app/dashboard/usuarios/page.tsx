"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  roles: { name: string }[];
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        user_roles (
          roles (name)
        )
      `);

    const formatted =
      data?.map((u: any) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        roles: u.user_roles.map((r: any) => r.roles),
      })) ?? [];

    setUsers(formatted);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return <p>Cargando usuarios...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <a
          href="/dashboard/usuarios/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Nuevo usuario
        </a>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.full_name}</td>
              <td>{u.email}</td>
              <td>{u.roles.map((r) => r.name).join(", ")}</td>
              <td className="p-2">
                <a
                  href={`/dashboard/usuarios/${u.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </a>
              </td>
            </tr>
          ))}

          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No hay usuarios registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
