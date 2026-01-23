"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import { Eye, EyeOff, GraduationCap, Mail } from "lucide-react";

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
      <div className="relative hidden md:flex flex-col justify-center bg-[#0d0f15] p-8 lg:p-10 text-white">
        <div className="absolute inset-0">
          <Image
            src="/img/login-bg.png"
            fill
            className="object-cover opacity-20"
            alt="Olimpiadas Universitarias"
          />
        </div>

        <div className="relative z-10 max-w-md space-y-4 lg:space-y-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 lg:w-10 lg:h-10" />
            <span className="text-xl lg:text-2xl font-bold tracking-tight">
              Olimpiadas Universitarias
            </span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black leading-tight">
            La plataforma para la próxima generación de líderes.
          </h1>

          <p className="text-gray-300 text-sm lg:text-base">
            Accede a tus eventos, gestiona equipos y compite al más alto nivel
            académico y deportivo.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex items-center justify-center bg-white dark:bg-[#18181B] px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
              Accede a la Plataforma de Olimpiadas Universitarias
            </p>
          </div>

          {/* Form */}
          <form onSubmit={login} className="space-y-4 sm:space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Correo Electrónico
              </label>
              <div className="flex rounded-lg border border-gray-300 dark:border-neutral-700 overflow-hidden focus-within:border-blue-600 dark:focus-within:border-blue-500">
                <input
                  type="email"
                  required
                  placeholder="correo@universidad.edu"
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex items-center px-3 sm:px-4 text-gray-400 dark:text-gray-500">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Contraseña
              </label>
              <div className="flex rounded-lg border border-gray-300 dark:border-neutral-700 overflow-hidden focus-within:border-blue-600 dark:focus-within:border-blue-500">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Ingresa tu contraseña"
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 sm:px-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-neutral-700 text-blue-600 dark:text-blue-500"
                />
                Recordarme
              </label>

              <a
                href="#"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
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
              className="w-full rounded-lg bg-blue-600 py-3 sm:py-4 font-bold text-white hover:bg-blue-700 transition text-sm sm:text-base disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            ¿No tienes una cuenta?{" "}
            <a href="/registro" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Regístrate aquí
            </a>
          </div>

          <footer className="pt-4 sm:pt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            © 2025 Limpus
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:gap-4">
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
