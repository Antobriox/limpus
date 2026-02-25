"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import { Eye, EyeOff, GraduationCap, Mail, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

export default function LoginPage() {
  // Lazy initializer: carga el email desde localStorage en el render inicial
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem("rememberedEmail");
      const savedRememberMe = localStorage.getItem("rememberMe") === "true";
      return (savedEmail && savedRememberMe) ? savedEmail : "";
    }
    return "";
  });
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Lazy initializer: carga rememberMe desde localStorage en el render inicial
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("rememberMe") === "true";
    }
    return false;
  });
  
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
      const errorMessage = "Correo o contraseña incorrectos";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
      return;
    }

    // Guardar o eliminar email según "Recordarme"
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("rememberedEmail");
      localStorage.removeItem("rememberMe");
    }

    // Bienvenido
    // 👉 una vez logeado, vamos a /
    router.replace("/");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-display bg-gradient-to-br from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* LEFT PANEL */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative hidden md:flex flex-col justify-center bg-gradient-to-br from-[#0d0f15] to-[#1a1d26] p-8 lg:p-10 text-white overflow-hidden"
      >
        <div className="absolute inset-0">
          <Image
            src="/img/login-bg.png"
            fill
            className="object-cover opacity-20"
            alt="Olimpiadas Universitarias"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 max-w-md space-y-4 lg:space-y-6"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <GraduationCap className="w-8 h-8 lg:w-10 lg:h-10 text-blue-400" />
            </motion.div>
            <span className="text-xl lg:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Olimpiadas Universitarias
            </span>
          </motion.div>

          <h1 className="text-3xl lg:text-4xl font-black leading-tight">
            La plataforma para la próxima generación de líderes.
          </h1>

          <p className="text-gray-300 text-sm lg:text-base leading-relaxed">
            Accede a tus eventos, gestiona equipos y compite al más alto nivel
            académico y deportivo.
          </p>
        </motion.div>
      </motion.div>

      {/* RIGHT PANEL */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12"
      >
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Header */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
              Accede a la Plataforma de Olimpiadas Universitarias
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={login}
            className="space-y-4 sm:space-y-6"
          >
            {/* Email */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                Correo Electrónico
              </label>
              <div className="flex rounded-xl border-2 border-gray-300 dark:border-neutral-700 overflow-hidden focus-within:border-blue-600 dark:focus-within:border-blue-500 transition-all shadow-sm hover:shadow-md">
                <input
                  type="email"
                  required
                  placeholder="correo@universidad.edu"
                  className="flex-1 px-4 py-3 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                  value={email || ""}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="flex items-center px-4 text-blue-600 dark:text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                Contraseña
              </label>
              <div className="flex rounded-xl border-2 border-gray-300 dark:border-neutral-700 overflow-hidden focus-within:border-blue-600 dark:focus-within:border-blue-500 transition-all shadow-sm hover:shadow-md">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Ingresa tu contraseña"
                  className="flex-1 px-4 py-3 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm sm:text-base"
                  value={password || ""}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-4 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </motion.button>
              </div>
            </motion.div>

            {/* Remember + Forgot */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 dark:border-neutral-700 text-blue-600 dark:text-blue-500 cursor-pointer"
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
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={cn(
                "w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 sm:py-4 font-bold text-white",
                "hover:from-blue-700 hover:to-blue-800 transition-all text-sm sm:text-base",
                "disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl cursor-pointer"
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Ingresando...
                </span>
              ) : (
                "Ingresar"
              )}
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400"
          >
            ¿No tienes una cuenta?{" "}
            <a href="/registro" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline transition-colors">
              Regístrate aquí
            </a>
          </motion.div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="pt-4 sm:pt-6 text-center text-xs text-gray-400 dark:text-gray-500"
          >
            © 2025 Limpus
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:gap-4">
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Términos
              </a>
              <span>•</span>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Soporte Técnico
              </a>
            </div>
          </motion.footer>
        </div>
      </motion.div>
    </div>
  );
}
