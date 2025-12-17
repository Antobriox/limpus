"use client";

import { useState } from "react";

export default function NuevoUsuarioPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(2); // ✅ number
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);

    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        role_id: roleId, // ✅ number
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert("Usuario creado correctamente");
  };

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-bold">Crear Usuario</h1>

      <input
        className="w-full p-2 border rounded"
        placeholder="Nombre completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      <input
        className="w-full p-2 border rounded"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full p-2 border rounded"
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select
        className="w-full p-2 border rounded"
        value={roleId}
        onChange={(e) => setRoleId(Number(e.target.value))} // 🔑 CLAVE
      >
        <option value={1}>Administrador</option>
        <option value={2}>Líder de equipo</option>
        <option value={3}>Árbitro</option>
      </select>

      <button
        onClick={submit}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Creando..." : "Crear usuario"}
      </button>
    </div>
  );
}
