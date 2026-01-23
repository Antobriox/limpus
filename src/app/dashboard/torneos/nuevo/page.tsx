"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import ConfirmModal from "../../../../components/ConfirmModal";
import AlertModal from "../../../../components/AlertModal";
import jsPDF from "jspdf";

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


  const generateHistoryPDF = async (): Promise<Blob | null> => {
    try {
      console.log("Generando PDF del historial...");
      
      const doc = new jsPDF();
      let yPosition = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;

      // Título
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("HISTORIAL DEL TORNEO", margin, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generado el: ${new Date().toLocaleString("es-ES")}`, margin, yPosition);
      yPosition += 10;

      // Función para agregar nueva página si es necesario
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
      };

      // 1. TORNEOS
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("1. TORNEOS", margin, yPosition);
      yPosition += 8;

      const { data: tournaments } = await supabase
        .from("tournaments")
        .select(`
          id,
          name,
          start_date,
          end_date,
          sports!inner(name)
        `)
        .order("id", { ascending: false });

      type SupabaseTournament = {
        id: number;
        name: string;
        start_date: string | null;
        end_date: string | null;
        sports?: {
          name: string;
        } | Array<{
          name: string;
        }>;
      };
      if (tournaments && tournaments.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        (tournaments as SupabaseTournament[]).forEach((tournament: SupabaseTournament) => {
          checkPageBreak(10);
          const sportsData = Array.isArray(tournament.sports) ? tournament.sports[0] : tournament.sports;
          doc.text(`• ${tournament.name} (${sportsData?.name || "N/A"})`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`  Fechas: ${tournament.start_date || "N/A"} - ${tournament.end_date || "N/A"}`, margin + 5, yPosition);
          yPosition += 6;
        });
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No hay torneos registrados", margin + 5, yPosition);
        yPosition += 6;
      }
      yPosition += 5;

      // 2. EQUIPOS
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("2. EQUIPOS", margin, yPosition);
      yPosition += 8;

      const { data: teams } = await supabase
        .from("teams")
        .select("id, name")
        .order("name", { ascending: true });

      type SupabaseTeam = {
        id: number;
        name: string;
      };
      if (teams && teams.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        (teams as SupabaseTeam[]).forEach((team: SupabaseTeam) => {
          checkPageBreak(6);
          doc.text(`• ${team.name}`, margin + 5, yPosition);
          yPosition += 6;
        });
        doc.text(`Total: ${teams.length} equipos`, margin + 5, yPosition);
        yPosition += 6;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No hay equipos registrados", margin + 5, yPosition);
        yPosition += 6;
      }
      yPosition += 5;

      // 3. INSCRIPCIONES
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("3. INSCRIPCIONES", margin, yPosition);
      yPosition += 8;

      const { data: registrationForms } = await supabase
        .from("registration_forms")
        .select(`
          id,
          name,
          genero,
          sports!inner(name)
        `)
        .order("created_at", { ascending: false });

      type SupabaseRegistrationForm = {
        id: number;
        name: string;
        genero: string | null;
        sports?: {
          name: string;
        } | Array<{
          name: string;
        }>;
      };
      if (registrationForms && registrationForms.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        (registrationForms as SupabaseRegistrationForm[]).forEach((form: SupabaseRegistrationForm) => {
          checkPageBreak(10);
          const sportsData = Array.isArray(form.sports) ? form.sports[0] : form.sports;
          doc.text(`• ${form.name} - ${sportsData?.name || "N/A"} (${form.genero || "N/A"})`, margin + 5, yPosition);
          yPosition += 6;
        });
        doc.text(`Total: ${registrationForms.length} inscripciones`, margin + 5, yPosition);
        yPosition += 6;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No hay inscripciones registradas", margin + 5, yPosition);
        yPosition += 6;
      }
      yPosition += 5;

      // 4. BRACKETS/SORTEOS
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("4. BRACKETS/SORTEOS", margin, yPosition);
      yPosition += 8;

      const { data: draws } = await supabase
        .from("draws")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });

      type SupabaseDraw = {
        id: number;
        name: string;
        created_at: string | null;
      };
      if (draws && draws.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        (draws as SupabaseDraw[]).forEach((draw: SupabaseDraw) => {
          checkPageBreak(8);
          doc.text(`• ${draw.name}`, margin + 5, yPosition);
          yPosition += 6;
          const createdDate = draw.created_at ? new Date(draw.created_at).toLocaleDateString("es-ES") : "N/A";
          doc.text(`  Creado: ${createdDate}`, margin + 5, yPosition);
          yPosition += 6;
        });
        doc.text(`Total: ${draws.length} brackets`, margin + 5, yPosition);
        yPosition += 6;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No hay brackets registrados", margin + 5, yPosition);
        yPosition += 6;
      }
      yPosition += 5;

      // 5. PARTIDOS
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("5. PARTIDOS", margin, yPosition);
      yPosition += 8;

      const { data: matches } = await supabase
        .from("matches")
        .select(`
          id,
          team_a,
          team_b,
          scheduled_at,
          status,
          genero,
          tournaments!inner(sports!inner(name))
        `)
        .order("scheduled_at", { ascending: false })
        .limit(100); // Limitar a 100 para no hacer el PDF muy largo

      // Obtener nombres de equipos
      type SupabaseMatchForNames = {
        team_a: number | null;
        team_b: number | null;
      };
      type TeamData = {
        id: number;
        name: string;
      };
      const teamNamesMap: Record<number, string> = {};
      if (matches && matches.length > 0) {
        const teamIds = new Set<number>();
        (matches as SupabaseMatchForNames[]).forEach((match: SupabaseMatchForNames) => {
          if (match.team_a) teamIds.add(match.team_a);
          if (match.team_b) teamIds.add(match.team_b);
        });

        if (teamIds.size > 0) {
          const { data: teamsData } = await supabase
            .from("teams")
            .select("id, name")
            .in("id", Array.from(teamIds));

          if (teamsData) {
            (teamsData as TeamData[]).forEach((team: TeamData) => {
              teamNamesMap[team.id] = team.name;
            });
          }
        }
      }

      if (matches && matches.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Mostrando ${matches.length} partidos (máximo 100)`, margin + 5, yPosition);
        yPosition += 8;
        
        type SupabaseMatch = {
          id: number;
          team_a: number | null;
          team_b: number | null;
          scheduled_at: string | null;
          status: string;
          genero: string | null;
          tournaments?: {
            sports?: {
              name: string;
            };
          };
        };
        (matches as SupabaseMatch[]).forEach((match: SupabaseMatch) => {
          checkPageBreak(12);
          const teamA = match.team_a !== null ? (teamNamesMap[match.team_a] || `Equipo ${match.team_a}`) : "Equipo A";
          const teamB = match.team_b !== null ? (teamNamesMap[match.team_b] || `Equipo ${match.team_b}`) : "Equipo B";
          const sport = match.tournaments?.sports?.name || "N/A";
          const date = match.scheduled_at ? new Date(match.scheduled_at).toLocaleString("es-ES") : "Sin fecha";
          const genero = match.genero || "N/A";
          
          doc.text(`${teamA} vs ${teamB}`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`  ${sport} (${genero}) - ${match.status || "N/A"} - ${date}`, margin + 5, yPosition);
          yPosition += 6;
        });
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No hay partidos registrados", margin + 5, yPosition);
        yPosition += 6;
      }
      yPosition += 5;

      // 6. RESÚMEN ESTADÍSTICO
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("6. RESÚMEN ESTADÍSTICO", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      checkPageBreak(30);
      doc.text(`Total de Torneos: ${tournaments?.length || 0}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Total de Equipos: ${teams?.length || 0}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Total de Inscripciones: ${registrationForms?.length || 0}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Total de Brackets: ${draws?.length || 0}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Total de Partidos: ${matches?.length || 0}`, margin + 5, yPosition);
      yPosition += 6;

      // Pie de página
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width - margin - 20, doc.internal.pageSize.height - 10);
      }

      // Convertir a Blob
      const pdfBlob = doc.output("blob");
      console.log("PDF del historial generado exitosamente");
      return pdfBlob;
    } catch (error: unknown) {
      console.error("Error generando PDF del historial:", error);
      return null;
    }
  };

  const uploadHistoryPDF = async (pdfBlob: Blob): Promise<boolean> => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `historial-torneo-${timestamp}.pdf`;
      const filePath = `torneos/historial/${fileName}`;

      const { error } = await supabase.storage
        .from("documents")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (error) {
        console.error("Error subiendo PDF del historial:", error);
        // Si el bucket no existe, no es crítico, solo loguear
        if (error.message?.includes("Bucket not found") || error.message?.includes("not found")) {
          console.warn("El bucket 'documents' no existe. El PDF no se guardó, pero se continuará con la eliminación.");
        }
        return false;
      }

      console.log(`PDF del historial guardado en: ${filePath}`);
      return true;
    } catch (error: unknown) {
      console.error("Error subiendo PDF del historial:", error);
      return false;
    }
  };

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
      } catch (usersError: unknown) {
        console.error("Error en la eliminación de usuarios:", usersError);
        // No crítico, continuar
        console.warn("Advertencia: No se pudieron eliminar algunos usuarios");
      }

      console.log("Limpieza completada exitosamente");
      return true;
    } catch (error: unknown) {
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

      // 1. Generar PDF del historial ANTES de eliminar datos
      console.log("Generando PDF del historial antes de eliminar datos...");
      const pdfBlob = await generateHistoryPDF();
      
      if (pdfBlob) {
        // 2. Subir PDF a Supabase Storage
        console.log("Subiendo PDF del historial a documentos...");
        const uploaded = await uploadHistoryPDF(pdfBlob);
        if (uploaded) {
          console.log("PDF del historial guardado exitosamente en documentos");
        } else {
          console.warn("No se pudo subir el PDF del historial, pero se continuará con la eliminación");
        }
      } else {
        console.warn("No se pudo generar el PDF del historial, pero se continuará con la eliminación");
      }

      // 3. Limpiar todos los datos del torneo anterior
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

      const pdfMessage = pdfBlob ? "\n\nEl historial completo ha sido guardado en la sección de Documentos." : "";
      showAlert(
        `Torneo "${form.name.trim()}" creado exitosamente para ${sports.length} disciplina(s)\n\nTodos los datos anteriores han sido eliminados.${pdfMessage}`,
        "success"
      );
      setTimeout(() => {
        router.push("/dashboard/torneos");
      }, 2000);
    } catch (error: unknown) {
      console.error("Error creando torneo:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      showAlert(
        `Error al crear el torneo: ${errorMessage}\n\nPor favor, verifica la consola para más detalles.`,
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

