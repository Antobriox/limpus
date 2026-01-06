// Página para programar partidos
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, ArrowLeft, Printer, Plus, Search, Calendar, ChevronDown, X } from "lucide-react";
import { Tournament, Match, ScheduleForm } from "../types";
import { useMatches } from "../hooks/useMatches";
import { supabase } from "../../../../lib/supabaseClient";

export default function ProgramarPartidosPage() {
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const {
    referees,
    administrators,
    savingSchedule,
    loadReferees,
    loadAdministrators,
    scheduleMatch,
  } = useMatches(tournament);

  // Estados locales para todos los partidos
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [scheduledMatches, setScheduledMatches] = useState<Match[]>([]);

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    scheduled_at: "",
    referee: "",
    assistant: "",
    status: "",
    field: "",
  });
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);
  const [showNewMatchModal, setShowNewMatchModal] = useState(false);
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [newMatchForm, setNewMatchForm] = useState({
    disciplina: "",
    team_a: "",
    team_b: "",
    scheduled_at: "",
    status: "",
    referee: "",
    assistant: "",
    cancha: "",
  });
  const [filters, setFilters] = useState({
    disciplina: "",
    estado: "",
    fecha: "",
    buscar: "",
  });

  // Recargar partidos cuando cambien los filtros
  useEffect(() => {
    loadAllMatches();
  }, [filters]);

  useEffect(() => {
    const initializeData = async () => {
      await loadTournament();
      await loadSports();
      await loadTeams();
    };
    initializeData();
  }, []);

  const loadTeams = async () => {
    // Evitar cargas duplicadas si ya se está cargando
    if (loadingTeams) {
      return;
    }
    
    setLoadingTeams(true);
    try {
      console.log("Cargando equipos...");
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .order("name");

      if (teamsError) {
        console.error("Error cargando equipos:", teamsError);
        alert(`Error cargando equipos: ${teamsError.message}`);
        setTeams([]);
        return;
      }

      console.log("Equipos cargados:", teamsData);
      setTeams(teamsData || []);
      
      if (!teamsData || teamsData.length === 0) {
        console.warn("No se encontraron equipos en la base de datos");
      }
    } catch (error) {
      console.error("Error inesperado cargando equipos:", error);
      alert("Error inesperado al cargar los equipos");
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadSports = async () => {
    try {
      const { data: sportsData } = await supabase
        .from("sports")
        .select("id, name")
        .order("name");
      setSports(sportsData || []);
    } catch (error) {
      console.error("Error cargando deportes:", error);
    }
  };

  useEffect(() => {
    const initializeMatches = async () => {
      await loadReferees();
      await loadAdministrators();
      await loadAllMatches();
      await checkValidStatuses();
    };
    initializeMatches();
  }, []);

  // Función para verificar qué estados válidos hay en la base de datos
  const checkValidStatuses = async () => {
    try {
      // Consultar partidos existentes para ver qué valores de status tienen
      const { data: matches, error } = await supabase
        .from("matches")
        .select("status")
        .not("status", "is", null)
        .limit(100);

      if (error) {
        console.error("Error consultando estados:", error);
        return;
      }

      // Obtener valores únicos de status
      const uniqueStatuses = Array.from(new Set(matches?.map(m => m.status).filter(Boolean) || []));
      console.log("═══════════════════════════════════════════════════════");
      console.log("📊 ESTADOS ENCONTRADOS EN LA BASE DE DATOS:");
      console.log("═══════════════════════════════════════════════════════");
      if (uniqueStatuses.length > 0) {
        uniqueStatuses.forEach((status, index) => {
          console.log(`${index + 1}. "${status}"`);
        });
      } else {
        console.log("No se encontraron partidos con estado asignado.");
        console.log("Esto significa que todos los partidos tienen status = null");
      }
      console.log("═══════════════════════════════════════════════════════");
      console.log("💡 Para ver el constraint exacto, consulta la base de datos directamente.");
      console.log("   El constraint se llama: matches_status_check");
      console.log("═══════════════════════════════════════════════════════");
    } catch (error) {
      console.error("Error verificando estados:", error);
    }
  };

  // Función para cargar TODOS los partidos de TODOS los torneos
  const loadAllMatches = async () => {
    try {
      // Cargar todos los partidos sin filtrar por torneo
      const { data: matches, error } = await supabase
        .from("matches")
        .select(`
          id,
          team_a,
          team_b,
          scheduled_at,
          started_at,
          ended_at,
          status,
          referee,
          assistant,
          tournament_id,
          field
        `)
        .order("scheduled_at", { ascending: true, nullsFirst: true });

      if (error) {
        console.error("Error cargando partidos:", error);
        return;
      }

      if (matches && matches.length > 0) {
        // Obtener todos los IDs de equipos únicos
        const teamIds = [
          ...matches.map((m: any) => m.team_a),
          ...matches.map((m: any) => m.team_b),
        ];
        const uniqueTeamIds = Array.from(new Set(teamIds)).filter(
          (id): id is number => id !== undefined && typeof id === "number"
        );

        // Obtener los nombres de los equipos
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, name")
          .in("id", uniqueTeamIds);

        // Crear un mapa de team_id -> team name
        const teamsMap = new Map(
          teamsData?.map((t: any) => [t.id, { id: t.id, name: t.name }]) || []
        );

        // Obtener todos los IDs de árbitros y asistentes únicos
        const refereeIds = [
          ...matches.map((m: any) => m.referee).filter((id: any) => id),
          ...matches.map((m: any) => m.assistant).filter((id: any) => id),
        ];
        const uniqueRefereeIds = Array.from(new Set(refereeIds)).filter(
          (id): id is string => id !== undefined && typeof id === "string"
        );

        // Obtener los nombres de los árbitros/asistentes
        let refereesMap = new Map();
        if (uniqueRefereeIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", uniqueRefereeIds);

          refereesMap = new Map(
            profilesData?.map((p: any) => [p.id, p.full_name || p.email || "Sin nombre"]) || []
          );
        }

        // Obtener información de disciplinas de los torneos
        const tournamentIds = Array.from(new Set(matches.map((m: any) => m.tournament_id).filter(Boolean)));
        const tournamentsMap = new Map<number, number>(); // tournament_id -> sport_id
        
        if (tournamentIds.length > 0) {
          const { data: tournamentsData } = await supabase
            .from("tournaments")
            .select("id, sport_id")
            .in("id", tournamentIds);
          
          if (tournamentsData) {
            tournamentsData.forEach((t: any) => {
              tournamentsMap.set(t.id, t.sport_id);
            });
          }
        }

        // Obtener nombres de deportes
        const sportIds = Array.from(new Set(Array.from(tournamentsMap.values()).filter(Boolean)));
        const sportsMap = new Map<number, string>();
        
        if (sportIds.length > 0) {
          const { data: sportsData } = await supabase
            .from("sports")
            .select("id, name")
            .in("id", sportIds);
          
          if (sportsData) {
            sportsData.forEach((s: any) => {
              sportsMap.set(s.id, s.name);
            });
          }
        }

        // Enriquecer los partidos con los nombres de los equipos, árbitros, asistentes, disciplinas y canchas
        const enrichedMatches = matches.map((match: any) => {
          const tournamentSportId = tournamentsMap.get(match.tournament_id);
          const sportName = tournamentSportId ? (sportsMap.get(tournamentSportId) || null) : null;
          
          return {
            ...match,
            teams: teamsMap.get(match.team_a) || { id: match.team_a, name: "Equipo A" },
            teams1: teamsMap.get(match.team_b) || { id: match.team_b, name: "Equipo B" },
            refereeName: match.referee ? refereesMap.get(match.referee) || "Sin árbitro" : null,
            assistantName: match.assistant ? refereesMap.get(match.assistant) || "Sin asistente" : null,
            sportName: sportName,
            field: match.field || null,
          };
        });

        // Aplicar filtros si existen
        let filteredMatches = enrichedMatches;

        if (filters.disciplina) {
          // Obtener los torneos de la disciplina seleccionada
          const { data: tournamentsData } = await supabase
            .from("tournaments")
            .select("id")
            .eq("sport_id", parseInt(filters.disciplina));

          if (tournamentsData && tournamentsData.length > 0) {
            const tournamentIds = tournamentsData.map((t: any) => t.id);
            filteredMatches = filteredMatches.filter((m: any) =>
              tournamentIds.includes(m.tournament_id)
            );
          } else {
            filteredMatches = [];
          }
        }

        if (filters.estado) {
          filteredMatches = filteredMatches.filter(
            (m: any) => m.status === filters.estado
          );
        }

        if (filters.fecha) {
          const filterDate = new Date(filters.fecha);
          filterDate.setHours(0, 0, 0, 0);
          const nextDay = new Date(filterDate);
          nextDay.setDate(nextDay.getDate() + 1);

          filteredMatches = filteredMatches.filter((m: any) => {
            if (!m.scheduled_at) return false;
            const matchDate = new Date(m.scheduled_at);
            return matchDate >= filterDate && matchDate < nextDay;
          });
        }

        if (filters.buscar) {
          const searchTerm = filters.buscar.toLowerCase();
          filteredMatches = filteredMatches.filter((m: any) => {
            const teamAName = m.teams?.name?.toLowerCase() || "";
            const teamBName = m.teams1?.name?.toLowerCase() || "";
            return teamAName.includes(searchTerm) || teamBName.includes(searchTerm);
          });
        }

        const pending = filteredMatches.filter((m: any) => !m.scheduled_at);
        const scheduled = filteredMatches.filter((m: any) => m.scheduled_at);
        
        // Actualizar los estados del hook
        setPendingMatches(pending);
        setScheduledMatches(scheduled);
      } else {
        setPendingMatches([]);
        setScheduledMatches([]);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const loadTournament = async () => {
    try {
      const { data: tournaments } = await supabase
        .from("tournaments")
        .select("id, name, start_date, end_date")
        .order("id", { ascending: false })
        .limit(1);

      if (tournaments && tournaments.length > 0) {
        const t = tournaments[0];
        setTournament({
          id: t.id,
          name: t.name || "Torneo",
          start_date: t.start_date || "",
          end_date: t.end_date || "",
          location: undefined,
          status: "EN CURSO",
        });
      } else {
        setTournament({
          id: 0,
          name: "Sin torneo activo",
          start_date: "",
          end_date: "",
          location: undefined,
          status: "SIN INICIAR",
        });
      }
    } catch (error) {
      console.error("Error cargando torneo:", error);
    }
  };

  const handleSchedule = async () => {
    if (!selectedMatch) return;
    const success = await scheduleMatch(selectedMatch.id, scheduleForm);
    if (success) {
      setSelectedMatch(null);
      setScheduleForm({
        scheduled_at: "",
        referee: "",
        assistant: "",
        status: "",
        field: "",
      });
      setShowEditMatchModal(false);
      // Recargar todos los partidos después de programar
      await loadAllMatches();
    }
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este partido?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("matches")
        .delete()
        .eq("id", matchId);

      if (error) {
        throw error;
      }

      alert("Partido eliminado correctamente");
      await loadAllMatches();
    } catch (error: any) {
      console.error("Error eliminando partido:", error);
      alert(error.message || "Error al eliminar el partido");
    }
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    const dateStr = match.scheduled_at
      ? new Date(match.scheduled_at).toISOString().slice(0, 16)
      : "";
    setScheduleForm({
      scheduled_at: dateStr,
      referee: match.referee || "",
      assistant: match.assistant || "",
      status: match.status || "",
      field: match.field || "",
    });
    setShowEditMatchModal(true);
  };

  const handleCreateMatch = async () => {
    if (!newMatchForm.disciplina) {
      alert("Debes seleccionar una disciplina");
      return;
    }

    if (!newMatchForm.team_a || !newMatchForm.team_b) {
      alert("Debes seleccionar ambos equipos");
      return;
    }

    if (newMatchForm.team_a === newMatchForm.team_b) {
      alert("Los equipos deben ser diferentes");
      return;
    }

    setCreatingMatch(true);
    try {
      // Buscar el torneo correspondiente a la disciplina seleccionada
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select("id")
        .eq("sport_id", parseInt(newMatchForm.disciplina))
        .order("id", { ascending: false })
        .limit(1);

      if (tournamentsError) {
        throw tournamentsError;
      }

      if (!tournamentsData || tournamentsData.length === 0) {
        alert("No se encontró un torneo para la disciplina seleccionada");
        setCreatingMatch(false);
        return;
      }

      const tournamentId = tournamentsData[0].id;

      // Convertir la fecha/hora a formato ISO para Supabase
      const scheduledAtISO = newMatchForm.scheduled_at
        ? new Date(newMatchForm.scheduled_at).toISOString()
        : null;

      const matchData: any = {
        tournament_id: tournamentId,
        team_a: parseInt(newMatchForm.team_a),
        team_b: parseInt(newMatchForm.team_b),
      };

      // Solo incluir scheduled_at si tiene valor
      if (scheduledAtISO) {
        matchData.scheduled_at = scheduledAtISO;
      }
      
      // Solo incluir referee si tiene valor (no string vacío)
      if (newMatchForm.referee && newMatchForm.referee.trim() !== "") {
        matchData.referee = newMatchForm.referee;
      }
      
      // Solo incluir assistant si tiene valor (no string vacío)
      if (newMatchForm.assistant && newMatchForm.assistant.trim() !== "") {
        matchData.assistant = newMatchForm.assistant;
      }

      // Solo incluir field (cancha) si tiene valor (no string vacío)
      if (newMatchForm.cancha && newMatchForm.cancha.trim() !== "") {
        matchData.field = newMatchForm.cancha;
      }

      // Determinar el estado automáticamente:
      // Si falta algún campo opcional (scheduled_at, referee, assistant, cancha), estado = "pending"
      // Si todos los campos opcionales están llenos, usar el estado seleccionado o "scheduled" por defecto
      const hasAllOptionalFields = scheduledAtISO && 
                                   newMatchForm.referee && newMatchForm.referee.trim() !== "" &&
                                   newMatchForm.assistant && newMatchForm.assistant.trim() !== "" &&
                                   newMatchForm.cancha && newMatchForm.cancha.trim() !== "";

      if (hasAllOptionalFields) {
        // Si todos los campos opcionales están llenos, usar el estado seleccionado o "scheduled" por defecto
        if (newMatchForm.status && newMatchForm.status.trim() !== "") {
          matchData.status = newMatchForm.status;
        } else {
          matchData.status = "scheduled";
        }
      } else {
        // Si falta algún campo opcional, el estado debe ser "pending"
        matchData.status = "pending";
      }

      console.log("Datos del partido a crear:", matchData);

      const { error, data } = await supabase.from("matches").insert([matchData]).select();

      if (error) {
        console.error("Error detallado de Supabase:", error);
        console.error("Código:", error.code);
        console.error("Mensaje:", error.message);
        console.error("Detalles:", error.details);
        console.error("Hint:", error.hint);
        throw error;
      }

      console.log("Partido creado exitosamente:", data);
      alert("Partido creado correctamente");
      setShowNewMatchModal(false);
      setNewMatchForm({
        disciplina: "",
        team_a: "",
        team_b: "",
        scheduled_at: "",
        status: "",
        referee: "",
        assistant: "",
        cancha: "",
      });
      await loadAllMatches();
    } catch (error: any) {
      console.error("Error creando partido:", error);
      alert(error.message || "Error al crear el partido");
    } finally {
      setCreatingMatch(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Programación de Partidos
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestiona la agenda deportiva de las Olimpiadas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // Funcionalidad de exportar calendario
                alert("Funcionalidad de exportar calendario pendiente");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Exportar Calendario</span>
            </button>
            <button
                onClick={async () => {
                // Recargar equipos, deportes y administradores antes de abrir el modal
                await loadTeams();
                await loadSports();
                await loadAdministrators();
                setShowNewMatchModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Partido</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* DISCIPLINA */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              DISCIPLINA
            </label>
            <div className="relative">
              <select
                value={filters.disciplina}
                onChange={(e) =>
                  setFilters({ ...filters, disciplina: e.target.value })
                }
                className="w-full px-3 py-2 pl-3 pr-10 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las disciplinas</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* ESTADO */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              ESTADO
            </label>
            <div className="relative">
              <select
                value={filters.estado}
                onChange={(e) =>
                  setFilters({ ...filters, estado: e.target.value })
                }
                className="w-full px-3 py-2 pl-3 pr-10 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="scheduled">Programado</option>
                <option value="in_progress">En Curso</option>
                <option value="finished">Finalizado</option>
                <option value="cancelled">Cancelado</option>
                <option value="postponed">Aplazado</option>
                <option value="suspended">Suspendido</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* FECHA */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              FECHA
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.fecha}
                onChange={(e) =>
                  setFilters({ ...filters, fecha: e.target.value })
                }
                className="w-full px-3 py-2 pl-3 pr-10 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* BUSCAR */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              BUSCAR
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Equipo..."
                value={filters.buscar}
                onChange={(e) =>
                  setFilters({ ...filters, buscar: e.target.value })
                }
                className="w-full px-3 py-2 pl-10 pr-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Editar Partido */}
      {showEditMatchModal && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Editar Partido: {selectedMatch.teams?.name || "Equipo A"} vs{" "}
                  {selectedMatch.teams1?.name || "Equipo B"}
                </h2>
                <button
                  onClick={() => {
                    setShowEditMatchModal(false);
                    setSelectedMatch(null);
                    setScheduleForm({
                      scheduled_at: "",
                      referee: "",
                      assistant: "",
                      status: "",
                      field: "",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha y Hora *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.scheduled_at}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={scheduleForm.status}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Sin estado (por defecto)</option>
                    <option value="pending">Pendiente</option>
                    <option value="scheduled">Programado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Árbitro
                  </label>
                  <select
                    value={scheduleForm.referee}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, referee: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Seleccionar árbitro</option>
                    {referees.map((ref) => (
                      <option key={ref.id} value={ref.id}>
                        {ref.full_name || ref.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Asistente
                  </label>
                  <select
                    value={scheduleForm.assistant}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, assistant: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Seleccionar asistente</option>
                    {administrators.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.full_name || admin.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cancha
                  </label>
                  <input
                    type="text"
                    placeholder="Cancha 1"
                    value={scheduleForm.field || ""}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, field: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSchedule}
                  disabled={savingSchedule || !scheduleForm.scheduled_at}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingSchedule ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  onClick={() => {
                    setShowEditMatchModal(false);
                    setSelectedMatch(null);
                    setScheduleForm({
                      scheduled_at: "",
                      referee: "",
                      assistant: "",
                      status: "",
                      field: "",
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partidos Pendientes - Solo se muestra si hay partidos pendientes */}
      {pendingMatches.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Partidos Pendientes ({pendingMatches.length})
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-2">
              {pendingMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {match.teams?.name || "Equipo A"} vs {match.teams1?.name || "Equipo B"}
                  </div>
                  <button
                    onClick={() => handleSelectMatch(match)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Programar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Partidos Programados */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Partidos Programados ({scheduledMatches.length})
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          {scheduledMatches.length > 0 ? (
            <div className="space-y-2">
              {scheduledMatches.map((match: any) => {
                const scheduledDate = match.scheduled_at
                  ? new Date(match.scheduled_at)
                  : null;
                const startedDate = match.started_at
                  ? new Date(match.started_at)
                  : null;
                const endedDate = match.ended_at
                  ? new Date(match.ended_at)
                  : null;

                // Determinar el estado del partido
                let matchStatusText = "";
                let matchStatusColor = "";
                if (endedDate) {
                  matchStatusText = "Finalizado";
                  matchStatusColor = "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
                } else if (startedDate) {
                  matchStatusText = "En Curso";
                  matchStatusColor = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
                } else if (scheduledDate && scheduledDate <= new Date()) {
                  matchStatusText = "Por Iniciar";
                  matchStatusColor = "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
                } else if (match.status === "scheduled") {
                  matchStatusText = "Programado";
                  matchStatusColor = "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
                } else if (match.status === "pending") {
                  matchStatusText = "Pendiente";
                  matchStatusColor = "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
                } else if (match.status === "in_progress") {
                  matchStatusText = "En Curso";
                  matchStatusColor = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
                } else if (match.status === "finished") {
                  matchStatusText = "Finalizado";
                  matchStatusColor = "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
                } else if (match.status === "cancelled") {
                  matchStatusText = "Cancelado";
                  matchStatusColor = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
                } else if (match.status === "postponed") {
                  matchStatusText = "Aplazado";
                  matchStatusColor = "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
                } else if (match.status === "suspended") {
                  matchStatusText = "Suspendido";
                  matchStatusColor = "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
                } else {
                  matchStatusText = match.status || "Sin estado";
                  matchStatusColor = "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
                }

                return (
                  <div
                    key={match.id}
                    className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Equipos */}
                        <div className="mb-3">
                          <div className="text-base font-semibold text-gray-900 dark:text-white">
                            {match.teams?.name || "Equipo A"} vs{" "}
                            {match.teams1?.name || "Equipo B"}
                          </div>
                        </div>

                        {/* Información del partido */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {/* Disciplina */}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Disciplina:</span>
                            <span>{match.sportName || "Sin disciplina"}</span>
                          </div>

                          {/* Fecha y Hora */}
                          {scheduledDate && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>
                                {scheduledDate.toLocaleDateString("es-ES", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}{" "}
                                {scheduledDate.toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}

                          {/* Asistente */}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Asistente:</span>
                            <span>{match.assistantName || "Sin asignar"}</span>
                          </div>

                          {/* Árbitro */}
                          {match.refereeName && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Árbitro:</span>
                              <span>{match.refereeName}</span>
                            </div>
                          )}

                          {/* Cancha */}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Cancha:</span>
                            <span>{match.field || "Sin asignar"}</span>
                          </div>

                          {/* Estado del partido */}
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Estado:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              match.status === "scheduled" 
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : match.status === "pending"
                                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                : match.status === "in_progress"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : match.status === "finished"
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                : match.status === "cancelled"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                : match.status === "postponed"
                                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                : match.status === "suspended"
                                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            }`}>
                              {match.status === "scheduled" ? "Programado" : 
                               match.status === "pending" ? "Pendiente" : 
                               match.status === "in_progress" ? "En Curso" :
                               match.status === "finished" ? "Finalizado" :
                               match.status === "cancelled" ? "Cancelado" :
                               match.status === "postponed" ? "Aplazado" :
                               match.status === "suspended" ? "Suspendido" :
                               match.status || "Sin estado"}
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          onClick={() => handleSelectMatch(match)}
                          className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-sm whitespace-nowrap"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteMatch(match.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
              No hay partidos programados
            </p>
          )}
        </div>
      </div>

      {/* Modal para Crear Nuevo Partido */}
      {showNewMatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Crear Nuevo Partido
              </h2>
              <button
                onClick={() => {
                  setShowNewMatchModal(false);
                  setNewMatchForm({
                    disciplina: "",
                    team_a: "",
                    team_b: "",
                    scheduled_at: "",
                    status: "",
                    referee: "",
                    assistant: "",
                    cancha: "",
                  });
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Disciplina */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Disciplina *
                </label>
                <select
                  value={newMatchForm.disciplina}
                  onChange={(e) =>
                    setNewMatchForm({ ...newMatchForm, disciplina: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Seleccionar disciplina</option>
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equipo A */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Equipo A * {teams.length > 0 && <span className="text-xs text-gray-500">({teams.length} equipos disponibles)</span>}
                </label>
                <select
                  value={newMatchForm.team_a}
                  onChange={(e) =>
                    setNewMatchForm({ ...newMatchForm, team_a: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Seleccionar equipo</option>
                  {teams.length > 0 ? (
                    teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No hay equipos disponibles
                    </option>
                  )}
                </select>
              </div>

              {/* Equipo B */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Equipo B *
                </label>
                <select
                  value={newMatchForm.team_b}
                  onChange={(e) =>
                    setNewMatchForm({ ...newMatchForm, team_b: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  required
                  disabled={!newMatchForm.team_a}
                >
                  <option value="">Seleccionar equipo</option>
                  {teams.length > 0 ? (
                    teams
                      .filter((team) => team.id.toString() !== newMatchForm.team_a)
                      .map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>
                      No hay equipos disponibles
                    </option>
                  )}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha y Hora
                </label>
                <input
                  type="datetime-local"
                  value={newMatchForm.scheduled_at}
                  onChange={(e) =>
                    setNewMatchForm({ ...newMatchForm, scheduled_at: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Cancha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cancha
                </label>
                <input
                  type="text"
                  placeholder="Cancha 1"
                  value={newMatchForm.cancha}
                  onChange={(e) =>
                    setNewMatchForm({ ...newMatchForm, cancha: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Árbitro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Árbitro
                </label>
                <select
                  value={newMatchForm.referee}
                  onChange={(e) =>
                    setNewMatchForm({ ...newMatchForm, referee: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                >
                  <option value="">Seleccionar árbitro</option>
                  {referees.map((ref) => (
                    <option key={ref.id} value={ref.id}>
                      {ref.full_name || ref.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asistente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asistente
                </label>
                <select
                  value={newMatchForm.assistant}
                  onChange={(e) =>
                    setNewMatchForm({ ...newMatchForm, assistant: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                >
                  <option value="">Seleccionar asistente</option>
                  {administrators.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.full_name || admin.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={newMatchForm.status}
                  onChange={(e) =>
                    setNewMatchForm({ ...newMatchForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                  disabled={
                    !newMatchForm.scheduled_at ||
                    !newMatchForm.referee ||
                    !newMatchForm.assistant ||
                    !newMatchForm.cancha
                  }
                >
                  <option value="">
                    {!newMatchForm.scheduled_at ||
                    !newMatchForm.referee ||
                    !newMatchForm.assistant ||
                    !newMatchForm.cancha
                      ? "Pendiente (faltan campos)"
                      : "Seleccionar estado"}
                  </option>
                  <option value="pending">Pendiente</option>
                  <option value="scheduled">Programado</option>
                </select>
                {(!newMatchForm.scheduled_at ||
                  !newMatchForm.referee ||
                  !newMatchForm.assistant ||
                  !newMatchForm.cancha) && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Completa todos los campos opcionales para poder seleccionar "Programado"
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateMatch}
                disabled={creatingMatch || !newMatchForm.disciplina || !newMatchForm.team_a || !newMatchForm.team_b}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingMatch ? "Creando..." : "Crear Partido"}
              </button>
              <button
                onClick={() => {
                  setShowNewMatchModal(false);
                  setNewMatchForm({
                    disciplina: "",
                    team_a: "",
                    team_b: "",
                    scheduled_at: "",
                    status: "",
                    referee: "",
                    assistant: "",
                    cancha: "",
                  });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

