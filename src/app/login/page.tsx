"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos");
      setLoading(false);
      return;
    }

    // 👉 una vez logeado, vamos a /
    router.replace("/");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-display">
      {/* LEFT PANEL */}
      <div className="relative hidden md:flex flex-col justify-center bg-[#0d0f15] p-10 text-white">
        <div className="absolute inset-0">
          <img
            src="img/login-bg.png" // pon tu imagen aquí
            className="h-full w-full object-cover opacity-20"
            alt="Olimpiadas Universitarias"
          />
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎓</span>
            <span className="text-2xl font-bold tracking-tight">
              Olimpiadas Universitarias
            </span>
          </div>

          <h1 className="text-4xl font-black leading-tight">
            La plataforma para la próxima generación de líderes.
          </h1>

          <p className="text-gray-300">
            Accede a tus eventos, gestiona equipos y compite al más alto nivel
            académico y deportivo.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center bg-white dark:bg-[#18181B] px-6">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white">
              Bienvenido de nuevo
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Accede a la Plataforma de Olimpiadas Universitarias
            </p>
          </div>

          {/* Form */}
          <form onSubmit={login} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Correo Electrónico
              </label>
              <div className="flex rounded-lg border overflow-hidden focus-within:border-blue-600">
                <input
                  type="email"
                  required
                  placeholder="correo@universidad.edu"
                  className="flex-1 px-4 py-3 outline-none bg-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex items-center px-4 text-gray-400">
                  ✉️
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="flex rounded-lg border overflow-hidden focus-within:border-blue-600">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Ingresa tu contraseña"
                  className="flex-1 px-4 py-3 outline-none bg-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-4 text-gray-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600"
                />
                Recordarme
              </label>

              <a
                href="#"
                className="text-sm text-blue-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-4 font-bold text-white hover:bg-blue-700 transition"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            ¿No tienes una cuenta?{" "}
            <a href="#" className="text-blue-600 font-medium hover:underline">
              Regístrate aquí
            </a>
          </div>

          <footer className="pt-6 text-center text-xs text-gray-400">
            © 2025 Limpus
            <div className="mt-2 flex justify-center gap-4">
              <a href="#" className="hover:underline">
                Términos
              </a>
              <span>•</span>
              <a href="#" className="hover:underline">
                Soporte Técnico
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
