"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function AdminUsersPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("lider_equipo");

  const createUser = async () => {
    // ⚠️ Esto se hará vía API route con service_role
    // Funcionalidad pendiente
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
          Gestión de Usuarios
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-neutral-800 w-full max-w-md space-y-4 shadow-lg"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Correo
          </label>
          <input
            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Rol
          </label>
          <select
            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="administrador">Administrador</option>
            <option value="lider_equipo">Líder de equipo</option>
            <option value="arbitro">Árbitro</option>
            <option value="asistente">Asistente</option>
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={createUser}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-xl cursor-pointer"
        >
          Crear usuario
        </motion.button>
      </motion.div>
    </div>
  );
}
