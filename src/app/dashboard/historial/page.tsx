"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { Calendar, Trophy, Users, ArrowRight } from "lucide-react";

type TournamentHistory = {
  id: number; // ID del primer torneo (para navegación)
  name: string;
  disciplines: Array<{
    sport_id: number;
    sport_name: string;
    tournament_id: number;
  }>;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  matches_count: number;
  finished_matches: number;
};

export default function HistorialPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);

      // Obtener la fecha actual
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split("T")[0];

      console.log("Buscando torneos con end_date anterior a:", todayString);

      // Primero, verificar todos los torneos que existen (para debugging)
      const { data: allTournaments } = await supabase
        .from("tournaments")
        .select("id, name, end_date, start_date, sport_id")
        .order("id", { ascending: false });
      
      type TournamentBasic = {
        id: number;
        name: string;
        end_date: string | null;
        start_date: string | null;
        sport_id: number;
      };

      console.log("Todos los torneos en la BD:", allTournaments);
      console.log("Nombres únicos de torneos:", [...new Set((allTournaments as TournamentBasic[] | null)?.map((t) => t.name) || [])]);
      
      if (allTournaments && allTournaments.length > 0) {
        console.log("Detalles de fechas:");
        (allTournaments as TournamentBasic[]).forEach((t) => {
          const endDate = t.end_date ? new Date(t.end_date) : null;
          const isPast = endDate ? endDate < today : false;
          console.log(`- ${t.name} (ID: ${t.id}): end_date=${t.end_date}, es pasado=${isPast}`);
        });
      }

      // Agrupar torneos por nombre para identificar grupos
      const tournamentsGroupedByName = new Map<string, { ids: number[], maxId: number }>();
      (allTournaments as TournamentBasic[] | null)?.forEach((t) => {
        if (!tournamentsGroupedByName.has(t.name)) {
          tournamentsGroupedByName.set(t.name, { ids: [], maxId: 0 });
        }
        const group = tournamentsGroupedByName.get(t.name)!;
        group.ids.push(t.id);
        if (t.id > group.maxId) {
          group.maxId = t.id;
        }
      });

      console.log("Grupos de torneos:", Array.from(tournamentsGroupedByName.entries()).map(([name, group]) => ({
        nombre: name,
        ids: group.ids,
        maxId: group.maxId
      })));

      // Encontrar el grupo con el ID más alto (el torneo más reciente)
      let latestTournamentGroupIds: number[] = [];
      let maxIdInGroup = 0;
      let latestTournamentName = "";

      tournamentsGroupedByName.forEach((group, name) => {
        if (group.maxId > maxIdInGroup) {
          maxIdInGroup = group.maxId;
          latestTournamentGroupIds = group.ids;
          latestTournamentName = name;
        }
      });

      console.log("ID máximo encontrado:", maxIdInGroup);
      console.log("Nombre del torneo más reciente:", latestTournamentName);
      console.log("IDs de torneos del torneo activo (todas las disciplinas):", latestTournamentGroupIds);

      // Mostrar todos los torneos EXCEPTO los del torneo más reciente (por IDs)
      // Esto asegura que cuando crees un nuevo torneo, el anterior aparezca en historial
      let query = supabase
        .from("tournaments")
        .select(`
          id,
          name,
          sport_id,
          start_date,
          end_date,
          created_by,
          sports!inner(
            id,
            name
          )
        `);

      // Excluir todos los IDs del torneo más reciente (todas sus disciplinas)
      if (latestTournamentGroupIds.length > 0) {
        // Filtrar después de obtener los datos, ya que Supabase no tiene .not().in() directo
        // Por ahora obtenemos todos y filtramos en JavaScript
      }

      // Ordenar por end_date descendente (más recientes primero) o por ID si no hay fecha
      query = query.order("end_date", { ascending: false, nullsFirst: false });

      const { data: allTournamentsData, error } = await query;

      if (error) {
        console.error("Error cargando historial:", error);
        return;
      }

      type TournamentWithSports = {
        id: number;
        name: string;
        sport_id: number;
        start_date: string | null;
        end_date: string | null;
        created_by: string | null;
        sports: {
          id: number;
          name: string;
        } | Array<{
          id: number;
          name: string;
        }>;
      };

      // Filtrar para excluir los IDs del torneo más reciente
      const tournamentsDataTyped = (allTournamentsData as unknown) as TournamentWithSports[] | null;
      console.log("Todos los torneos antes de filtrar:", (tournamentsDataTyped || []).map((t) => ({
        id: t.id,
        name: t.name
      })));
      
      const tournamentsData = latestTournamentGroupIds.length > 0
        ? (tournamentsDataTyped || []).filter((t) => {
            const shouldInclude = !latestTournamentGroupIds.includes(t.id);
            console.log(`Torneo ${t.id} (${t.name}): ${shouldInclude ? "INCLUIDO" : "EXCLUIDO"}`);
            return shouldInclude;
          })
        : tournamentsDataTyped;

      console.log(`Torneos encontrados en historial (después de filtrar): ${tournamentsData?.length || 0}`);
      if (tournamentsData && tournamentsData.length > 0) {
        console.log("Torneos en historial:", tournamentsData.map((t) => ({
          id: t.id,
          name: t.name,
          end_date: t.end_date
        })));
      } else {
        console.log("NO HAY TORNEOS después del filtro. IDs excluidos:", latestTournamentGroupIds);
      }

      // Agrupar torneos por nombre
      const tournamentsByName = new Map<string, TournamentWithSports[]>();
      (tournamentsData || []).forEach((tournament) => {
        const name = tournament.name;
        if (!tournamentsByName.has(name)) {
          tournamentsByName.set(name, []);
        }
        tournamentsByName.get(name)!.push(tournament);
      });

      // Para cada grupo de torneos (mismo nombre), obtener estadísticas combinadas
      const tournamentsWithStats: TournamentHistory[] = await Promise.all(
        Array.from(tournamentsByName.entries()).map(async ([name, tournaments]) => {
          // Obtener todos los IDs de torneos con este nombre
          const tournamentIds = tournaments.map((t) => t.id);
          
          // Contar partidos totales de todas las disciplinas
          const { count: totalMatches } = await supabase
            .from("matches")
            .select("*", { count: "exact", head: true })
            .in("tournament_id", tournamentIds);

          // Contar partidos finalizados de todas las disciplinas
          const { count: finishedMatches } = await supabase
            .from("matches")
            .select("*", { count: "exact", head: true })
            .in("tournament_id", tournamentIds)
            .eq("status", "finished");

          // Obtener las disciplinas
          const disciplines = tournaments.map((t) => {
            const sportsData = Array.isArray(t.sports) ? t.sports[0] : t.sports;
            return {
              sport_id: t.sport_id,
              sport_name: sportsData?.name || "Deporte desconocido",
              tournament_id: t.id,
            };
          });

          // Usar el primer torneo para fechas y otros datos
          const firstTournament = tournaments[0];

          return {
            id: firstTournament.id, // ID del primer torneo para navegación
            name: name,
            disciplines: disciplines,
            start_date: firstTournament.start_date,
            end_date: firstTournament.end_date,
            created_by: firstTournament.created_by,
            matches_count: totalMatches || 0,
            finished_matches: finishedMatches || 0,
          };
        })
      );

      setTournaments(tournamentsWithStats);
    } catch (error) {
      console.error("Error inesperado:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentClick = (tournamentId: number) => {
    router.push(`/dashboard/torneos?tournament=${tournamentId}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Fecha no disponible";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Historial de Torneos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consulta los torneos pasados y accede a toda su información
          </p>
        </div>


        {/* Lista de torneos */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando historial...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-12 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No hay torneos en el historial
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Los torneos aparecerán aquí una vez que hayan finalizado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                onClick={() => handleTournamentClick(tournament.id)}
                className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-500 dark:hover:border-blue-400"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {tournament.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {tournament.disciplines.map((discipline, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium"
                        >
                          {discipline.sport_name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Inicio:</div>
                      <div>{formatDate(tournament.start_date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Fin:</div>
                      <div>{formatDate(tournament.end_date)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{tournament.finished_matches} / {tournament.matches_count} partidos</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold">
                      Finalizado
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
