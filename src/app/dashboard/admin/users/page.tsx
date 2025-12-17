"use client";

import { useState } from "react";

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("lider_equipo");

  const createUser = async () => {
    // ⚠️ Esto se hará vía API route con service_role
    alert("Esto se implementa vía API segura (siguiente paso)");
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Gestión de Usuarios</h1>

      <div className="bg-white p-4 rounded border w-full max-w-md space-y-4">
        <div>
          <label className="text-sm">Correo</label>
          <input
            className="border w-full p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Rol</label>
          <select
            className="border w-full p-2 rounded"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="administrador">Administrador</option>
            <option value="lider_equipo">Líder de equipo</option>
            <option value="arbitro">Árbitro</option>
            <option value="asistente">Asistente</option>
          </select>
        </div>

        <button
          onClick={createUser}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Crear usuario
        </button>
      </div>
    </div>
  );
}
