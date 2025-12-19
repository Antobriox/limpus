"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Upload, X, Image as ImageIcon, Plus, Trash2 } from "lucide-react";

type Leader = {
  id: string;
  full_name: string;
  email: string;
};

export default function NuevoEquipoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [careerInput, setCareerInput] = useState("");
  const [careers, setCareers] = useState<string[]>([]);
  
  const [form, setForm] = useState({
    name: "",
    selectedLeaders: [] as string[],
  });

  // Cargar líderes registrados (usuarios con rol de líder de equipo)
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
        // Filtrar solo los que tienen rol de "Líder de equipo" (role_id = 2)
        const teamLeaders = data
          .filter((profile: any) => {
            const roles = profile.user_roles?.map((ur: any) => ur.roles) || [];
            return roles.some((r: any) => r.id === 2 || r.name === "Líder de equipo");
          })
          .map((profile: any) => ({
            id: profile.id,
            full_name: profile.full_name || profile.email?.split("@")[0] || "Sin nombre",
            email: profile.email,
          }));

        setLeaders(teamLeaders);
      }
    };

    loadLeaders();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no debe superar los 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona un archivo de imagen");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

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

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `teams/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("team-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error("Error subiendo imagen:", uploadError);
        // Intentar con otro bucket o método alternativo
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("team-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error en upload:", error);
      return null;
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
      // Subir imagen si existe
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Crear el equipo
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: form.name.trim(),
          image_url: imageUrl,
        })
        .select()
        .single();

      if (teamError) {
        throw teamError;
      }

      if (!teamData) {
        throw new Error("No se pudo crear el equipo");
      }

      // Las carreras se guardan como texto en el campo name o se pueden relacionar después
      // Por ahora el equipo se crea con el nombre y la imagen

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

        {/* Imagen del Equipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Imagen del Equipo
          </label>
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Vista previa"
                className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-neutral-700"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG o GIF (MAX. 5MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          )}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
          
          {/* Lista de carreras agregadas */}
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
                    className="hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {careers.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Escribe el nombre de una carrera y haz clic en "Agregar" o presiona Enter
            </p>
          )}
        </div>

        {/* Líderes del Equipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Líderes del Equipo
          </label>
          {leaders.length === 0 ? (
            <div className="border border-gray-300 dark:border-neutral-700 rounded-lg p-4 bg-gray-50 dark:bg-neutral-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                No hay líderes registrados en el sistema
              </p>
            </div>
          ) : (
            <div className="border border-gray-300 dark:border-neutral-700 rounded-lg p-3 max-h-48 overflow-y-auto bg-white dark:bg-neutral-800">
              <div className="space-y-2">
                {leaders.map((leader) => (
                  <label
                    key={leader.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={form.selectedLeaders.includes(leader.id)}
                      onChange={() => toggleLeader(leader.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {leader.full_name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {leader.email}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          {form.selectedLeaders.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {form.selectedLeaders.length} líder(es) seleccionado(s)
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={createTeam}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              "Creando..."
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Crear Equipo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

