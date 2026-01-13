"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, GraduationCap, Mail, User } from "lucide-react";

export default function RegistroPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Todos los campos son requeridos");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta");
        setLoading(false);
        return;
      }

      // Registro exitoso, redirigir al login
      alert("Cuenta creada exitosamente. Por favor inicia sesión.");
      router.push("/login");
    } catch (err: any) {
      setError("Error al crear la cuenta. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-display">
      {/* LEFT PANEL */}
      <div className="relative hidden md:flex flex-col justify-center bg-[#0d0f15] p-10 text-white">
        <div className="absolute inset-0">
          <img
            src="img/login-bg.png"
            className="h-full w-full object-cover opacity-20"
            alt="Olimpiadas Universitarias"
          />
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-10 h-10" />
            <span className="text-2xl font-bold tracking-tight">
              Olimpiadas Universitarias
            </span>
          </div>

          <h1 className="text-4xl font-black leading-tight">
            Únete a la plataforma de líderes.
          </h1>

          <p className="text-gray-300">
            Crea tu cuenta y accede a eventos, equipos y competiciones al más alto nivel
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
              Crear cuenta
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Regístrate para acceder a la Plataforma de Olimpiadas Universitarias
            </p>
          </div>

          {/* Form */}
          <form onSubmit={register} className="space-y-6">
            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Nombre completo
              </label>
              <div className="flex rounded-lg border border-gray-300 dark:border-neutral-700 overflow-hidden focus-within:border-blue-600 dark:focus-within:border-blue-500">
                <input
                  type="text"
                  required
                  placeholder="Juan Pérez"
                  className="flex-1 px-4 py-3 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <div className="flex items-center px-4 text-gray-400 dark:text-gray-500">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </div>

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
                  className="flex-1 px-4 py-3 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex items-center px-4 text-gray-400 dark:text-gray-500">
                  <Mail className="w-5 h-5" />
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
                  placeholder="Mínimo 6 caracteres"
                  className="flex-1 px-4 py-3 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Confirmar Contraseña
              </label>
              <div className="flex rounded-lg border border-gray-300 dark:border-neutral-700 overflow-hidden focus-within:border-blue-600 dark:focus-within:border-blue-500">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Repite tu contraseña"
                  className="flex-1 px-4 py-3 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="px-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-4 font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tienes una cuenta?{" "}
            <a href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Inicia sesión aquí
            </a>
          </div>

          <footer className="pt-6 text-center text-xs text-gray-400 dark:text-gray-500">
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
