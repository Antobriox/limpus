"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { Plus, X, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "../../../../lib/utils";
import { toast } from "sonner";
import { useDashboard } from "../../torneos/hooks/useDashboard";

// Tipos para datos de Supabase
type SupabaseRole = {
  id: number;
  name: string;
};

type SupabaseUserRole = {
  user_id: string;
};

type SupabaseProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at?: string | null;
};

type Leader = {
  id: string;
  full_name: string;
  email: string;
};

export default function EditarEquipoPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;
  const queryClient = useQueryClient();
  const { currentEditionId, currentEditionCreatedAt } = useDashboard();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [occupiedLeaders, setOccupiedLeaders] = useState<Set<string>>(new Set());
  const [nameError, setNameError] = useState<string>("");

  const [careerInput, setCareerInput] = useState("");
  const [careers, setCareers] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    selectedLeaders: [] as string[],
  });

  // Cargar datos del equipo
  useEffect(() => {
    const loadTeam = async () => {
      try {
        // Cargar el equipo
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("id, name")
          .eq("id", teamId)
          .single();

        if (teamError || !teamData) {
          // alert eliminada"Equipo no encontrado");
          router.replace("/dashboard/equipos");
          return;
        }

        setForm((prev) => ({ ...prev, name: teamData.name }));

        // Cargar carreras del equipo
        const { data: careersData } = await supabase
          .from("careers")
          .select("id, name")
          .eq("team_id", teamId);

        if (careersData) {
          setCareers((careersData as Array<{ name: string }>).map((c) => c.name));
        }

        // Cargar líderes del equipo
        const { data: teamLeadersData } = await supabase
          .from("team_leaders")
          .select("user_id")
          .eq("team_id", teamId);

        if (teamLeadersData) {
          setForm((prev) => ({
            ...prev,
            selectedLeaders: (teamLeadersData as Array<{ user_id: string }>).map((tl) => tl.user_id),
          }));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error cargando equipo:", error);
        // alert eliminada"Error al cargar el equipo");
        router.replace("/dashboard/equipos");
      }
    };

    if (teamId) {
      loadTeam();
    }
  }, [teamId, router]);

  // Cargar solo usuarios con rol "líder de equipo" filtrados por edición actual
  useEffect(() => {
    const loadLeaders = async () => {
      try {
        // Primero obtener TODOS los roles para buscar el correcto
        const { data: rolesData, error: rolesError } = await supabase
          .from("roles")
          .select("id, name");

        if (rolesError) {
          console.error("Error cargando roles:", rolesError);
          setLeaders([]);
          return;
        }

        // Buscar el rol que sea "lider_equipo" o contenga "líder" o "lider"
        const leaderRole = (rolesData as SupabaseRole[] | null)?.find(
          (r: SupabaseRole) => {
            const nameLower = r.name.toLowerCase();
            return (
              nameLower === "lider_equipo" ||
              nameLower === "líder de equipo" ||
              nameLower === "lider de equipo" ||
              nameLower.includes("lider") ||
              nameLower.includes("líder")
            );
          }
        );

        if (!leaderRole) {
          console.warn("No se encontró el rol 'líder de equipo'");
          setLeaders([]);
          setOccupiedLeaders(new Set());
          return;
        }

        // Intentar consultar desde profiles con filtro en user_roles (incluyendo created_at)
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email,
            created_at,
            user_roles!inner (
              role_id,
              roles!inner (
                id,
                name
              )
            )
          `)
          .eq("user_roles.role_id", leaderRole.id)
          .order("full_name", { ascending: true });

        if (profilesError) {
          // Método alternativo: consultar user_roles primero
          const { data: userRolesData, error: userRolesError } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role_id", leaderRole.id);

          if (userRolesError) {
            console.error("Error cargando user_roles:", userRolesError);
            setLeaders([]);
            setOccupiedLeaders(new Set());
            return;
          }

          if (!userRolesData || userRolesData.length === 0) {
            setLeaders([]);
            setOccupiedLeaders(new Set());
            return;
          }

          const userIds = (userRolesData as SupabaseUserRole[]).map((ur: SupabaseUserRole) => ur.user_id);
          const { data: profilesData2, error: profilesError2 } = await supabase
            .from("profiles")
            .select("id, full_name, email, created_at")
            .in("id", userIds)
            .order("full_name", { ascending: true });

          if (profilesError2) {
            console.error("Error cargando perfiles:", profilesError2);
            setLeaders([]);
            setOccupiedLeaders(new Set());
            return;
          }

          if (profilesData2 && profilesData2.length > 0) {
            const rawLeaders = (profilesData2 as SupabaseProfile[]).map((profile: SupabaseProfile) => ({
              id: profile.id,
              full_name:
                profile.full_name ||
                profile.email?.split("@")[0] ||
                "Sin nombre",
              email: profile.email || "",
              created_at: profile.created_at ?? null,
            }));

            const { data: leadersThisEdition } = await supabase
              .from("team_leaders")
              .select("user_id")
              .eq("edition_id", currentEditionId);
            const assignedToThisEdition = new Set(
              (leadersThisEdition ?? []).map((r: { user_id: string }) => r.user_id)
            );
            const { data: leadersAnyEdition } = await supabase
              .from("team_leaders")
              .select("user_id");
            const assignedToAnyEdition = new Set(
              (leadersAnyEdition ?? []).map((r: { user_id: string }) => r.user_id)
            );

            const editionDate = currentEditionCreatedAt ? new Date(currentEditionCreatedAt).getTime() : 0;
            const filtered = rawLeaders.filter((u) => {
              if (assignedToThisEdition.has(u.id)) return true;
              if (assignedToAnyEdition.has(u.id)) return false;
              const userDate = u.created_at ? new Date(u.created_at).getTime() : 0;
              return editionDate === 0 || userDate >= editionDate;
            });

            const leadersList: Leader[] = filtered.map(({ id, full_name, email }) => ({
              id,
              full_name,
              email: email || "",
            }));
            setLeaders(leadersList);
            setOccupiedLeaders(assignedToThisEdition);
          } else {
            setLeaders([]);
            setOccupiedLeaders(new Set());
          }
          return;
        }

        if (profilesData && profilesData.length > 0) {
          const rawLeaders = (profilesData as SupabaseProfile[]).map((profile: SupabaseProfile) => ({
            id: profile.id,
            full_name:
              profile.full_name ||
              profile.email?.split("@")[0] ||
              "Sin nombre",
            email: profile.email || "",
            created_at: profile.created_at ?? null,
          }));

          const { data: leadersThisEdition } = await supabase
            .from("team_leaders")
            .select("user_id")
            .eq("edition_id", currentEditionId);
          const assignedToThisEdition = new Set(
            (leadersThisEdition ?? []).map((r: { user_id: string }) => r.user_id)
          );
          const { data: leadersAnyEdition } = await supabase
            .from("team_leaders")
            .select("user_id");
          const assignedToAnyEdition = new Set(
            (leadersAnyEdition ?? []).map((r: { user_id: string }) => r.user_id)
          );

          const editionDate = currentEditionCreatedAt ? new Date(currentEditionCreatedAt).getTime() : 0;
          const filtered = rawLeaders.filter((u) => {
            if (assignedToThisEdition.has(u.id)) return true;
            if (assignedToAnyEdition.has(u.id)) return false;
            const userDate = u.created_at ? new Date(u.created_at).getTime() : 0;
            return editionDate === 0 || userDate >= editionDate;
          });

          const leadersList: Leader[] = filtered.map(({ id, full_name, email }) => ({
            id,
            full_name,
            email: email || "",
          }));
          setLeaders(leadersList);
          setOccupiedLeaders(assignedToThisEdition);
        } else {
          setLeaders([]);
          setOccupiedLeaders(new Set());
        }
      } catch (error) {
        console.error("Error inesperado cargando líderes:", error);
        setLeaders([]);
        setOccupiedLeaders(new Set());
      }
    };

    loadLeaders();
  }, [teamId, currentEditionId, currentEditionCreatedAt]);

  const toggleLeader = (leaderId: string) => {
    // No permitir seleccionar líderes ocupados
    if (occupiedLeaders.has(leaderId)) {
      return;
    }
    
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

  const updateTeam = async () => {
    if (!form.name.trim()) {
      // alert eliminada"El nombre del equipo es requerido");
      return;
    }

    if (careers.length === 0) {
      // alert eliminada"Debes agregar al menos una carrera");
      return;
    }

    setNameError(""); // Limpiar error previo
    setSaving(true);

    try {
      // Verificar si ya existe otro equipo con el mismo nombre (ignorando mayúsculas/minúsculas)
      const teamNameTrimmed = form.name.trim();
      const { data: existingTeams, error: checkError } = await supabase
        .from("teams")
        .select("id, name")
        .neq("id", parseInt(teamId || "0")); // Excluir el equipo actual

      if (checkError) {
        console.error("Error verificando equipos existentes:", checkError);
      } else if (existingTeams) {
        // Verificar si hay otro equipo con el mismo nombre (case-insensitive)
        const duplicateTeam = existingTeams.find(
          (team) => team.name.trim().toLowerCase() === teamNameTrimmed.toLowerCase()
        );

        if (duplicateTeam) {
          setSaving(false);
          setNameError(`Equipo ya existente: "${duplicateTeam.name}"`);
          return;
        }
      }

      // 1. Actualizar el equipo
      const { error: teamError } = await supabase
        .from("teams")
        .update({
          name: teamNameTrimmed,
        })
        .eq("id", teamId);

      if (teamError) {
        throw teamError;
      }

      // 2. Eliminar todas las carreras existentes y crear las nuevas
      const { error: deleteCareersError } = await supabase
        .from("careers")
        .delete()
        .eq("team_id", teamId);

      if (deleteCareersError) {
        throw deleteCareersError;
      }

      const careersToInsert = careers.map((careerName) => ({
        name: careerName,
        team_id: parseInt(teamId),
      }));

      const { error: careersError } = await supabase
        .from("careers")
        .insert(careersToInsert);

      if (careersError) {
        throw careersError;
      }

      // 3. Actualizar líderes del equipo
      // Eliminar todos los líderes actuales
      const { error: deleteLeadersError } = await supabase
        .from("team_leaders")
        .delete()
        .eq("team_id", teamId);

      if (deleteLeadersError) {
        console.error("Error eliminando líderes:", deleteLeadersError);
      }

      // Insertar los nuevos líderes
      if (form.selectedLeaders.length > 0) {
        const teamLeadersToInsert = form.selectedLeaders.map((leaderId) => ({
          user_id: leaderId,
          team_id: parseInt(teamId),
        }));

        const { error: leadersError } = await supabase
          .from("team_leaders")
          .insert(teamLeadersToInsert);

        if (leadersError) {
          console.error("Error asociando líderes:", leadersError);
        }
      }

      // Invalidar las queries relacionadas para que se actualicen las listas
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      
      // Equipo actualizado
      router.push("/dashboard/equipos");
    } catch (error: unknown) {
      console.error("Error actualizando equipo:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar el equipo");
    } finally {
      setSaving(false);
    }
  };

  const [listRef] = useAutoAnimate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 dark:text-gray-500">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <motion.button
        type="button"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push("/dashboard/equipos")}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </motion.button>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Editar Equipo
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Modifica los datos del equipo
        </p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 sm:p-6 space-y-6 max-w-3xl shadow-lg"
      >
        {/* Nombre del Equipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Equipo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={cn(
              "w-full px-4 py-2.5 border-2 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow",
              nameError
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-neutral-700"
            )}
            placeholder="Ej: Los Leones"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setNameError(""); // Limpiar error al escribir
            }}
          />
          {nameError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-500 dark:text-red-400 font-medium"
            >
              {nameError}
            </motion.p>
          )}
        </div>

        {/* Carreras */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Carreras <span className="text-red-500">*</span>
          </label>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
              placeholder="Ej: Medicina"
              value={careerInput}
              onChange={(e) => setCareerInput(e.target.value)}
              onKeyPress={handleCareerKeyPress}
            />
            <motion.button
              whileHover={{ scale: !careerInput.trim() || careers.includes(careerInput.trim()) ? 1 : 1.05 }}
              whileTap={{ scale: !careerInput.trim() || careers.includes(careerInput.trim()) ? 1 : 0.95 }}
              type="button"
              onClick={addCareer}
              disabled={!careerInput.trim() || careers.includes(careerInput.trim())}
              className={cn(
                "px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all flex items-center gap-2 font-semibold shadow-md hover:shadow-lg cursor-pointer",
                (!careerInput.trim() || careers.includes(careerInput.trim())) && "cursor-not-allowed"
              )}
            >
              <Plus className="w-4 h-4" />
              Agregar
            </motion.button>
          </div>

          {careers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2" ref={listRef}>
              {careers.map((career, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                >
                  <span>{career}</span>
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => removeCareer(career)}
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </motion.button>
                </motion.div>
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
            {(() => {
              // Filtrar solo líderes disponibles (no ocupados)
              // Pero incluir los líderes que ya están asignados a este equipo
              const availableLeaders = leaders.filter((leader) => 
                !occupiedLeaders.has(leader.id) || form.selectedLeaders.includes(leader.id)
              );
              
              if (availableLeaders.length === 0) {
                return (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No hay líderes disponibles
                  </p>
                );
              }
              
              return availableLeaders.map((leader) => {
                const isCurrentlySelected = form.selectedLeaders.includes(leader.id);
                return (
                  <label
                    key={leader.id}
                    className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700"
                  >
                    <input
                      type="checkbox"
                      checked={isCurrentlySelected}
                      onChange={() => toggleLeader(leader.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{leader.full_name}</p>
                      <p className="text-xs text-gray-500">{leader.email}</p>
                    </div>
                  </label>
                );
              });
            })()}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.05 }}
            whileTap={{ scale: saving ? 1 : 0.95 }}
            onClick={() => router.back()}
            className="px-4 py-2.5 border-2 border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm hover:shadow-md font-medium cursor-pointer"
            disabled={saving}
          >
            Cancelar
          </motion.button>
          <motion.button
            whileHover={{ scale: saving ? 1 : 1.05 }}
            whileTap={{ scale: saving ? 1 : 0.95 }}
            onClick={updateTeam}
            disabled={saving}
            className={cn(
              "px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl cursor-pointer",
              saving && "cursor-not-allowed"
            )}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

