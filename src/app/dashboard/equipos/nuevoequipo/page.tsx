"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Plus, X, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
  email: string | null;
};

export default function NuevoEquipoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentEditionId, currentEditionCreatedAt } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [occupiedLeaders, setOccupiedLeaders] = useState<Set<string>>(new Set());
  const [nameError, setNameError] = useState<string>("");

  const [careerInput, setCareerInput] = useState("");
  const [careers, setCareers] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    selectedLeaders: [] as string[],
  });

  // Cargar líderes: solo los de esta edición (asignados a esta edición o "nuevos" creados después del inicio de la edición)
  useEffect(() => {
    if (currentEditionId == null || currentEditionId <= 0) {
      setLeaders([]);
      setOccupiedLeaders(new Set());
      return;
    }

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

        console.log("Todos los roles encontrados:", rolesData);

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
          console.warn("No se encontró el rol 'líder de equipo'. Roles encontrados:", rolesData);
          setLeaders([]);
          return;
        }

        console.log("Rol de líder encontrado:", leaderRole);

        // Intentar consultar desde profiles con filtro en user_roles
        // Enfoque alternativo: consultar directamente desde profiles
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
          console.error("Error cargando perfiles (método 1):", profilesError);
          
          // Método alternativo: consultar user_roles primero
          const { data: userRolesData, error: userRolesError } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role_id", leaderRole.id);

          if (userRolesError) {
            console.error("Error cargando user_roles:", userRolesError);
            setLeaders([]);
            return;
          }

          console.log("User roles encontrados:", userRolesData);

          if (!userRolesData || userRolesData.length === 0) {
            console.warn("No se encontraron usuarios con rol de líder de equipo (role_id:", leaderRole.id, ")");
            setLeaders([]);
            return;
          }

          // Obtener los perfiles de esos usuarios
          const userIds = (userRolesData as SupabaseUserRole[]).map((ur: SupabaseUserRole) => ur.user_id);
          console.log("User IDs a buscar:", userIds);

          const { data: profilesData2, error: profilesError2 } = await supabase
            .from("profiles")
            .select("id, full_name, email, created_at")
            .in("id", userIds)
            .order("full_name", { ascending: true });

          if (profilesError2) {
            console.error("Error cargando perfiles (método 2):", profilesError2);
            setLeaders([]);
            return;
          }

          console.log("Perfiles encontrados (método 2):", profilesData2);
          
          if (profilesData2 && profilesData2.length > 0) {
            const rawLeaders = (profilesData2 as SupabaseProfile[]).map((profile: SupabaseProfile) => ({
              id: profile.id,
              full_name:
                profile.full_name ||
                profile.email?.split("@")[0] ||
                "Sin nombre",
              email: profile.email || null,
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

            const leaders: Leader[] = filtered.map(({ id, full_name, email }) => ({
              id,
              full_name,
              email,
            }));
            setLeaders(leaders);
            setOccupiedLeaders(assignedToThisEdition);
          } else {
            setLeaders([]);
            setOccupiedLeaders(new Set());
          }
          return;
        }

        console.log("Perfiles encontrados (método 1):", profilesData);

        if (profilesData && profilesData.length > 0) {
          const rawLeaders = (profilesData as SupabaseProfile[]).map((profile: SupabaseProfile) => ({
            id: profile.id,
            full_name:
              profile.full_name ||
              profile.email?.split("@")[0] ||
              "Sin nombre",
            email: profile.email ?? null,
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

          const leaders: Leader[] = filtered.map(({ id, full_name, email }) => ({
            id,
            full_name,
            email,
          }));
          setLeaders(leaders);
          setOccupiedLeaders(assignedToThisEdition);
        } else {
          console.warn("No se encontraron perfiles con el rol de líder de equipo");
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
  }, [currentEditionId, currentEditionCreatedAt]);

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

  const createTeam = async () => {
    if (!form.name.trim()) {
      // alert eliminada"El nombre del equipo es requerido");
      return;
    }

    if (careers.length === 0) {
      // alert eliminada"Debes agregar al menos una carrera");
      return;
    }

    setNameError(""); // Limpiar error previo
    setLoading(true);

    if (currentEditionId == null || currentEditionId <= 0) {
      setLoading(false);
      setNameError("No hay torneo activo. Crea un torneo primero.");
      return;
    }

    try {
      const teamNameTrimmed = form.name.trim();
      const { data: existingTeams, error: checkError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("edition_id", currentEditionId);

      if (checkError) {
        console.error("Error verificando equipos existentes:", checkError);
      } else if (existingTeams) {
        const duplicateTeam = existingTeams.find(
          (team) => team.name.trim().toLowerCase() === teamNameTrimmed.toLowerCase()
        );
        if (duplicateTeam) {
          setLoading(false);
          setNameError(`Equipo ya existente: "${duplicateTeam.name}"`);
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: teamNameTrimmed,
          created_by: user?.id || null,
          edition_id: currentEditionId,
        })
        .select()
        .single();

      if (teamError) {
        throw teamError;
      }

      if (!teamData) {
        throw new Error("No se pudo crear el equipo");
      }

      // 2. Crear las carreras asociadas al equipo
      const careersToInsert = careers.map((careerName) => ({
        name: careerName,
        team_id: teamData.id,
      }));

      const { error: careersError } = await supabase
        .from("careers")
        .insert(careersToInsert);

      if (careersError) {
        // Si falla la inserción de carreras, eliminar el equipo creado
        await supabase.from("teams").delete().eq("id", teamData.id);
        throw careersError;
      }

      // 3. Asociar líderes al equipo en team_leaders
      if (form.selectedLeaders.length > 0) {
        // Eliminar duplicados
        const uniqueLeaders = [...new Set(form.selectedLeaders)];
        
        // Verificar si alguno de estos líderes ya es líder de otro equipo
        const { data: existingLeaders } = await supabase
          .from("team_leaders")
          .select("user_id")
          .in("user_id", uniqueLeaders);

        if (existingLeaders && existingLeaders.length > 0) {
          const existingUserIds = new Set((existingLeaders as Array<{ user_id: string }>).map((l) => l.user_id));
          // Filtrar solo los líderes que no están ya asignados a otro equipo
          const newLeaders = uniqueLeaders.filter((id) => !existingUserIds.has(id));
          
          // Si algunos líderes ya estaban asignados, mostrar advertencia
          const skipped = uniqueLeaders.length - newLeaders.length;
          if (skipped > 0) {
            console.warn(`${skipped} líder(es) ya están asignados a otro equipo y fueron omitidos`);
          }
          
          if (newLeaders.length > 0) {
            const teamLeadersToInsert = newLeaders.map((leaderId) => ({
              user_id: leaderId,
              team_id: teamData.id,
              edition_id: currentEditionId,
            }));

            const { error: leadersError } = await supabase
              .from("team_leaders")
              .insert(teamLeadersToInsert);

            if (leadersError) {
              console.error("Error asociando líderes:", leadersError);
            }
          }
        } else {
          const teamLeadersToInsert = uniqueLeaders.map((leaderId) => ({
            user_id: leaderId,
            team_id: teamData.id,
            edition_id: currentEditionId,
          }));

          const { error: leadersError } = await supabase
            .from("team_leaders")
            .insert(teamLeadersToInsert);

          if (leadersError) {
            console.error("Error asociando líderes:", leadersError);
          }
        }
      }

      // Invalidar las queries relacionadas para que se actualicen las listas
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      
      router.push("/dashboard/equipos");
    } catch (error: unknown) {
      console.error("Error creando equipo:", error);
      // alert eliminada(error instanceof Error ? error.message : "Error al crear el equipo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
      <button
        type="button"
        onClick={() => router.push("/dashboard/equipos")}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>
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
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              nameError
                ? "border-red-500 dark:border-red-500"
                : "border-gray-300 dark:border-neutral-700"
            }`}
            placeholder="Ej: Los Leones"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setNameError(""); // Limpiar error al escribir
            }}
          />
          {nameError && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{nameError}</p>
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
            {(() => {
              // Filtrar solo líderes disponibles (no ocupados)
              const availableLeaders = leaders.filter((leader) => !occupiedLeaders.has(leader.id));
              
              if (availableLeaders.length === 0) {
                return (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No hay líderes disponibles
                  </p>
                );
              }
              
              return availableLeaders.map((leader) => (
                <label
                  key={leader.id}
                  className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700"
                >
                  <input
                    type="checkbox"
                    checked={form.selectedLeaders.includes(leader.id)}
                    onChange={() => toggleLeader(leader.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{leader.full_name}</p>
                    <p className="text-xs text-gray-500">{leader.email}</p>
                  </div>
                </label>
              ));
            })()}
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
