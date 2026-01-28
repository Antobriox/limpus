"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { Calendar, Trophy, Users, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "../../../lib/utils";

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
  const [listRef] = useAutoAnimate();

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Historial de Torneos
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Consulta los torneos pasados y accede a toda su información
          </p>
        </motion.div>

        {/* Lista de torneos */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full"
              />
              <p className="mt-6 text-gray-600 dark:text-gray-400 text-lg font-medium">
                Cargando historial...
              </p>
            </motion.div>
          ) : tournaments.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-16 text-center shadow-lg"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                No hay torneos en el historial
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Los torneos aparecerán aquí una vez que hayan finalizado
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              ref={listRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {tournaments.map((tournament, index) => (
                <motion.div
                  key={tournament.id}
                  variants={cardVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTournamentClick(tournament.id)}
                  className={cn(
                    "group relative bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700",
                    "p-6 cursor-pointer overflow-hidden",
                    "hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20",
                    "transition-all duration-300",
                    "hover:border-blue-500 dark:hover:border-blue-400"
                  )}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 rounded-2xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {tournament.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {tournament.disciplines.map((discipline, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 + idx * 0.02 }}
                              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-800 dark:text-blue-200 text-xs font-semibold shadow-sm"
                            >
                              {discipline.sport_name}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex-shrink-0"
                      >
                        <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      </motion.div>
                    </div>

                    <div className="space-y-3 text-sm mb-4">
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Inicio:</div>
                          <div>{formatDate(tournament.start_date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Fin:</div>
                          <div>{formatDate(tournament.end_date)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/30">
                            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="font-medium">
                            {tournament.finished_matches} / {tournament.matches_count} partidos
                          </span>
                        </div>
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-200 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Finalizado
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
