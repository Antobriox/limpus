"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import ConfirmModal from "../../../../components/ConfirmModal";
import AlertModal from "../../../../components/AlertModal";

type Sport = {
  id: number;
  name: string;
};


export default function NuevoTorneoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState<"success" | "error" | "warning" | "info">("info");

  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  // Cargar deportes para mostrar cuántos se crearán
  useEffect(() => {
    const loadSports = async () => {
      const { data } = await supabase
        .from("sports")
        .select("id, name")
        .order("name", { ascending: true });

      if (data) {
        setSports(data);
      }
    };

    loadSports();
  }, []);


  const clearAllTournamentData = async () => {
    try {
      console.log("Iniciando limpieza de datos del torneo...");

      // 1. Eliminar eventos de partidos (goles, tarjetas, sets)
      const { error: eventsError } = await supabase
        .from("match_events")
        .delete()
        .neq("id", 0); // Eliminar todos
      
      if (eventsError) {
        console.error("Error eliminando eventos:", eventsError);
        throw new Error(`Error eliminando eventos: ${eventsError.message}`);
      }
      console.log("Eventos de partidos eliminados");

      // 2. Eliminar resultados de partidos
      const { error: resultsError } = await supabase
        .from("match_results")
        .delete()
        .neq("match_id", 0); // Eliminar todos
      
      if (resultsError) {
        console.error("Error eliminando resultados:", resultsError);
        throw new Error(`Error eliminando resultados: ${resultsError.message}`);
      }
      console.log("Resultados de partidos eliminados");

      // 3. Eliminar partidos
      const { error: matchesError } = await supabase
        .from("matches")
        .delete()
        .neq("id", 0); // Eliminar todos
      
      if (matchesError) {
        console.error("Error eliminando partidos:", matchesError);
        throw new Error(`Error eliminando partidos: ${matchesError.message}`);
      }
      console.log("Partidos eliminados");

      // 4. Eliminar resultados de sorteos (draw_results)
      const { error: drawResultsError } = await supabase
        .from("draw_results")
        .delete()
        .neq("draw_id", 0); // Eliminar todos
      
      if (drawResultsError) {
        console.error("Error eliminando resultados de sorteos:", drawResultsError);
        throw new Error(`Error eliminando resultados de sorteos: ${drawResultsError.message}`);
      }
      console.log("Resultados de sorteos eliminados");

      // 5. Eliminar sorteos/brackets (draws)
      const { error: drawsError } = await supabase
        .from("draws")
        .delete()
        .neq("id", 0); // Eliminar todos
      
      if (drawsError) {
        console.error("Error eliminando sorteos:", drawsError);
        throw new Error(`Error eliminando sorteos: ${drawsError.message}`);
      }
      console.log("Sorteos/brackets eliminados");

      // 6. Eliminar registros de equipos (team_registrations)
      const { error: registrationsError } = await supabase
        .from("team_registrations")
        .delete()
        .neq("id", 0); // Eliminar todos
      
      if (registrationsError) {
        console.error("Error eliminando registros:", registrationsError);
        throw new Error(`Error eliminando registros: ${registrationsError.message}`);
      }
      console.log("Registros de equipos eliminados");

      // 7. Eliminar formularios de inscripción (registration_forms)
      const { error: formsError } = await supabase
        .from("registration_forms")
        .delete()
        .neq("id", 0); // Eliminar todos
      
      if (formsError) {
        console.error("Error eliminando formularios:", formsError);
        throw new Error(`Error eliminando formularios: ${formsError.message}`);
      }
      console.log("Formularios de inscripción eliminados");

      // 8. Eliminar estadísticas de jugadores (player_stats)
      const { error: statsError } = await supabase
        .from("player_stats")
        .delete()
        .neq("player_id", 0); // Eliminar todos
      
      if (statsError) {
        console.error("Error eliminando estadísticas:", statsError);
        // No crítico, continuar
        console.warn("Advertencia al eliminar estadísticas:", statsError.message);
      } else {
        console.log("Estadísticas de jugadores eliminadas");
      }

      // 9. Eliminar equipos (teams)
      const { error: teamsError } = await supabase
        .from("teams")
        .delete()
        .neq("id", 0); // Eliminar todos
      
      if (teamsError) {
        console.error("Error eliminando equipos:", teamsError);
        throw new Error(`Error eliminando equipos: ${teamsError.message}`);
      }
      console.log("Equipos eliminados");

      // 10. Eliminar torneos antiguos
      const { error: tournamentsError } = await supabase
        .from("tournaments")
        .delete()
        .neq("id", 0); // Eliminar todos
      
      if (tournamentsError) {
        console.error("Error eliminando torneos:", tournamentsError);
        throw new Error(`Error eliminando torneos: ${tournamentsError.message}`);
      }
      console.log("Torneos antiguos eliminados");

      // 11. Eliminar usuarios con roles de Líder de equipo (2) y Árbitro (3)
      // Mantener Administradores (1) y otros usuarios
      try {
        const deleteUsersResponse = await fetch("/api/admin/delete-users-by-roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role_ids: [2, 3] }), // Líder de equipo y Árbitro
        });

        if (!deleteUsersResponse.ok) {
          const errorData = await deleteUsersResponse.json();
          console.error("Error eliminando usuarios:", errorData);
          // No crítico, continuar
          console.warn("Advertencia al eliminar usuarios:", errorData.error);
        } else {
          const result = await deleteUsersResponse.json();
          console.log(`Usuarios eliminados: ${result.deleted || 0} de ${result.total || 0}`);
          if (result.errors && result.errors.length > 0) {
            console.warn("Algunos errores al eliminar usuarios:", result.errors);
          }
        }
      } catch (usersError: any) {
        console.error("Error en la eliminación de usuarios:", usersError);
        // No crítico, continuar
        console.warn("Advertencia: No se pudieron eliminar algunos usuarios");
      }

      console.log("Limpieza completada exitosamente");
      return true;
    } catch (error: any) {
      console.error("Error en la limpieza:", error);
      throw error;
    }
  };

  const showAlert = (message: string, variant: "success" | "error" | "warning" | "info" = "info") => {
    setAlertMessage(message);
    setAlertVariant(variant);
    setShowAlertModal(true);
  };

  const createTournament = async () => {
    if (!form.name.trim()) {
      showAlert("El nombre del torneo es requerido", "warning");
      return;
    }

    if (!form.start_date || !form.end_date) {
      showAlert("Debes ingresar las fechas de inicio y fin", "warning");
      return;
    }

    if (new Date(form.start_date) > new Date(form.end_date)) {
      showAlert("La fecha de inicio no puede ser posterior a la fecha de fin", "warning");
      return;
    }

    if (sports.length === 0) {
      showAlert("No hay deportes registrados. Debes crear al menos un deporte primero.", "warning");
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  const handleConfirmCreate = async () => {
    setShowConfirmModal(false);

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Limpiar todos los datos del torneo anterior
      console.log("Limpiando datos del torneo anterior...");
      await clearAllTournamentData();

      // Crear un torneo para cada deporte/disciplina
      const tournamentsToInsert = sports.map((sport) => ({
        name: form.name.trim(),
        sport_id: sport.id,
        start_date: form.start_date,
        end_date: form.end_date,
        created_by: user?.id || null,
      }));

      const { data: createdTournaments, error: tournamentsError } = await supabase
        .from("tournaments")
        .insert(tournamentsToInsert)
        .select();

      if (tournamentsError) {
        throw tournamentsError;
      }

      if (!createdTournaments || createdTournaments.length === 0) {
        throw new Error("No se pudieron crear los torneos");
      }

      showAlert(
        `Torneo "${form.name.trim()}" creado exitosamente para ${sports.length} disciplina(s)\n\nTodos los datos anteriores han sido eliminados.`,
        "success"
      );
      setTimeout(() => {
        router.push("/dashboard/torneos");
      }, 2000);
    } catch (error: any) {
      console.error("Error creando torneo:", error);
      showAlert(
        `Error al crear el torneo: ${error.message}\n\nPor favor, verifica la consola para más detalles.`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Nuevo Torneo
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Crea un nuevo torneo que incluirá todas las disciplinas disponibles
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 sm:p-6 space-y-6 max-w-2xl">
        {/* Nombre del Torneo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Torneo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Copa Universitaria 2024"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        {/* Información de disciplinas */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Disciplinas incluidas:</strong> Este torneo incluirá todas las disciplinas registradas ({sports.length} disciplina{sports.length !== 1 ? 's' : ''}).
          </p>
          {sports.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {sports.map((sport) => (
                <span
                  key={sport.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300"
                >
                  {sport.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Inicio <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Fin <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.end_date}
              onChange={(e) =>
                setForm({ ...form, end_date: e.target.value })
              }
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={createTournament}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando..." : "Crear Torneo"}
          </button>
        </div>
      </div>

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="ADVERTENCIA"
        message={
          "Esto eliminará TODOS los datos del torneo anterior:\n\n" +
          "• Todos los equipos\n" +
          "• Todos los partidos y resultados\n" +
          "• Todos los brackets/sorteos\n" +
          "• Todas las inscripciones\n" +
          "• Todos los torneos anteriores\n" +
          "• Todos los LÍDERES DE EQUIPO\n" +
          "• Todos los ÁRBITROS\n\n" +
          "Los ADMINISTRADORES se mantendrán intactos.\n\n" +
          "¿Estás seguro de que quieres continuar?"
        }
        confirmText="Continuar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Modal de Alerta */}
      <AlertModal
        isOpen={showAlertModal}
        message={alertMessage}
        variant={alertVariant}
        onClose={() => setShowAlertModal(false)}
      />
    </div>
  );
}

