"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

type Leader = {
  id: string;
  full_name: string;
  email: string;
};

export default function NuevoEquipoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);

  const [careerInput, setCareerInput] = useState("");
  const [careers, setCareers] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    selectedLeaders: [] as string[],
  });

  // Cargar líderes registrados
  useEffect(() => {
    const loadLeaders = async () => {
      const { data } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          user_roles (
            roles (id, name)
          )
        `)
        .order("full_name", { ascending: true });

      if (data) {
        const teamLeaders = data
          .filter((profile: any) => {
            const roles = profile.user_roles?.map((ur: any) => ur.roles) || [];
            return roles.some(
              (r: any) => r.id === 2 || r.name === "Líder de equipo"
            );
          })
          .map((profile: any) => ({
            id: profile.id,
            full_name:
              profile.full_name ||
              profile.email?.split("@")[0] ||
              "Sin nombre",
            email: profile.email,
          }));

        setLeaders(teamLeaders);
      }
    };

    loadLeaders();
  }, []);

  const toggleLeader = (leaderId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedLeaders: prev.selectedLeaders.includes(leaderId)
        ? prev.selectedLeaders.filter((id) => id !== leaderId)
        : [...prev.selectedLeaders, leaderId],
    }));
  };

  const addCareer = () => {
    const career = careerInput.trim();
    if (career && !careers.includes(career)) {
      setCareers([...careers, career]);
      setCareerInput("");
    }
  };

  const removeCareer = (careerToRemove: string) => {
    setCareers(careers.filter((c) => c !== careerToRemove));
  };

  const handleCareerKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCareer();
    }
  };

  const createTeam = async () => {
    if (!form.name.trim()) {
      alert("El nombre del equipo es requerido");
      return;
    }

    if (careers.length === 0) {
      alert("Debes agregar al menos una carrera");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("teams").insert({
        name: form.name.trim(),
      });

      if (error) {
        throw error;
      }

      router.push("/dashboard/equipos");
    } catch (error: any) {
      console.error("Error creando equipo:", error);
      alert(error.message || "Error al crear el equipo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Nuevo Equipo
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Registra un nuevo equipo con sus carreras y líderes
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 sm:p-6 space-y-6 max-w-3xl">
        {/* Nombre del Equipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Equipo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Los Leones"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Carreras */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Carreras <span className="text-red-500">*</span>
          </label>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Medicina"
              value={careerInput}
              onChange={(e) => setCareerInput(e.target.value)}
              onKeyPress={handleCareerKeyPress}
            />
            <button
              type="button"
              onClick={addCareer}
              disabled={!careerInput.trim() || careers.includes(careerInput.trim())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {careers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {careers.map((career, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                >
                  <span>{career}</span>
                  <button
                    type="button"
                    onClick={() => removeCareer(career)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Líderes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Líderes del Equipo
          </label>

          <div className="border border-gray-300 dark:border-neutral-700 rounded-lg p-3 max-h-48 overflow-y-auto bg-white dark:bg-neutral-800">
            {leaders.map((leader) => (
              <label
                key={leader.id}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-neutral-700"
              >
                <input
                  type="checkbox"
                  checked={form.selectedLeaders.includes(leader.id)}
                  onChange={() => toggleLeader(leader.id)}
                />
                <div>
                  <p className="text-sm">{leader.full_name}</p>
                  <p className="text-xs text-gray-500">{leader.email}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={createTeam}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {loading ? "Creando..." : "Crear Equipo"}
          </button>
        </div>
      </div>
    </div>
  );
}
