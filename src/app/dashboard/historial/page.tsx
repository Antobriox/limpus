"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { Calendar, Trophy, Users, ArrowRight, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn, formatDateOnlyWithYear } from "../../../lib/utils";
import ConfirmModal from "../../../components/ConfirmModal";

type EditionHistory = {
  id: number; // tournament_editions.id — navegación ?edition=
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
  tournamentIds: number[]; // IDs de tournaments de esta edición (para eliminar)
};

export default function HistorialPage() {
  const router = useRouter();
  const [editions, setEditions] = useState<EditionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [listRef] = useAutoAnimate();
  const [editionToDelete, setEditionToDelete] = useState<EditionHistory | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);

      // Obtener la edición "actual" para excluirla del historial (nunca mostrar torneo actual aquí)
      let currentEditionId: number | null = null;
      const { data: activeEdition } = await supabase
        .from("tournament_editions")
        .select("id")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (activeEdition?.id != null) {
        currentEditionId = activeEdition.id as number;
      } else {
        // Si no hay edición activa, excluir la edición del torneo más reciente (evitar mostrar "actual" en historial)
        const { data: latestTournament } = await supabase
          .from("tournaments")
          .select("edition_id")
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestTournament?.edition_id != null) {
          currentEditionId = latestTournament.edition_id as number;
        }
      }

      const { data: editionsData, error: editionsError } = await supabase
        .from("tournament_editions")
        .select("id, name, start_date, end_date, created_by")
        .eq("status", "closed")
        .order("id", { ascending: false });

      if (editionsError) {
        console.error("Error cargando historial:", editionsError);
        setEditions([]);
        return;
      }

      // Excluir la edición actual para que no aparezca en historial (fase de grupos del actual)
      type EditionRow = { id: number; name: string | null; start_date: string | null; end_date: string | null; created_by: string | null };
      const closedOnly: EditionRow[] = (editionsData as EditionRow[] | null) ?? [];
      const filteredEditions = currentEditionId != null
        ? closedOnly.filter((e) => e.id !== currentEditionId)
        : closedOnly;

      if (filteredEditions.length === 0) {
        setEditions([]);
        return;
      }

      const editionsWithStats: EditionHistory[] = await Promise.all(
        filteredEditions.map(
          async (edition) => {
            const { data: tournamentRows } = await supabase
              .from("tournaments")
              .select(`
                id,
                sport_id,
                sports!inner(id, name)
              `)
              .eq("edition_id", edition.id);

            const rows = (tournamentRows as Array<{
              id: number;
              sport_id: number;
              sports: { id: number; name: string } | Array<{ id: number; name: string }>;
            }> | null) ?? [];
            const tournamentIds = rows.map((r) => r.id);

            const { count: totalMatches } = await supabase
              .from("matches")
              .select("*", { count: "exact", head: true })
              .in("tournament_id", tournamentIds);
            const { count: finishedMatches } = await supabase
              .from("matches")
              .select("*", { count: "exact", head: true })
              .in("tournament_id", tournamentIds)
              .eq("status", "finished");

            const disciplines = rows.map((row) => {
              const sportsData = Array.isArray(row.sports) ? row.sports[0] : row.sports;
              return {
                sport_id: row.sport_id,
                sport_name: sportsData?.name ?? "Deporte desconocido",
                tournament_id: row.id,
              };
            });

            return {
              id: edition.id,
              name: edition.name ?? "",
              disciplines,
              start_date: edition.start_date,
              end_date: edition.end_date,
              created_by: edition.created_by,
              matches_count: totalMatches ?? 0,
              finished_matches: finishedMatches ?? 0,
              tournamentIds,
            };
          }
        )
      );

      setEditions(editionsWithStats);
    } catch (error) {
      console.error("Error inesperado:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditionClick = (editionId: number) => {
    router.push(`/dashboard/torneos?edition=${editionId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, edition: EditionHistory) => {
    e.stopPropagation();
    setEditionToDelete(edition);
  };

  const handleConfirmDelete = async () => {
    if (!editionToDelete) return;
    setDeleting(true);
    const editionId = editionToDelete.id;
    const tournamentIds = editionToDelete.tournamentIds;
    try {
      // Orden: borrar todo lo que referencia la edición para evitar violación de FK al borrar tournament_editions.

      // 1. Partidos y resultados
      const { data: matchRows } = await supabase
        .from("matches")
        .select("id")
        .in("tournament_id", tournamentIds);
      const matchIds = (matchRows ?? []).map((m: { id: number }) => m.id);
      if (matchIds.length > 0) {
        await supabase.from("match_results").delete().in("match_id", matchIds);
        await supabase.from("match_events").delete().in("match_id", matchIds);
      }
      await supabase.from("matches").delete().in("tournament_id", tournamentIds);
      await supabase.from("player_stats").delete().in("tournament_id", tournamentIds);

      // 2. Sorteos (draws) y draw_results
      const { data: drawRows } = await supabase
        .from("draws")
        .select("id")
        .in("tournament_id", tournamentIds);
      const drawIds = (drawRows ?? []).map((d: { id: number }) => d.id);
      if (drawIds.length > 0) {
        await supabase.from("draw_results").delete().in("draw_id", drawIds);
      }
      await supabase.from("draws").delete().in("tournament_id", tournamentIds);

      // 3. Datos por edition_id (deben borrarse antes que tournament_editions)
      await supabase.from("players").delete().eq("edition_id", editionId);
      await supabase.from("team_registrations").delete().eq("edition_id", editionId);
      await supabase.from("registration_forms").delete().eq("edition_id", editionId);
      await supabase.from("team_leaders").delete().eq("edition_id", editionId);

      // 4. Equipos de esta edición (careers referencian team_id)
      const { data: teamRows } = await supabase
        .from("teams")
        .select("id")
        .eq("edition_id", editionId);
      const teamIds = (teamRows ?? []).map((t: { id: number }) => t.id);
      if (teamIds.length > 0) {
        await supabase.from("careers").delete().in("team_id", teamIds);
      }
      await supabase.from("teams").delete().eq("edition_id", editionId);

      // 5. Torneos y edición
      await supabase.from("tournaments").delete().in("id", tournamentIds);
      const { error: editionError } = await supabase
        .from("tournament_editions")
        .delete()
        .eq("id", editionId);

      if (editionError) {
        console.error("Error eliminando edición:", editionError);
        throw editionError;
      }

      setEditions((prev) => prev.filter((e) => e.id !== editionToDelete.id));
      setEditionToDelete(null);
    } catch (err) {
      console.error("Error eliminando edición:", err);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => formatDateOnlyWithYear(dateString);

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
          ) : editions.length === 0 ? (
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
              {editions.map((edition, index) => (
                <motion.div
                  key={edition.id}
                  variants={cardVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEditionClick(edition.id)}
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
                          {edition.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {edition.disciplines.map((discipline, idx) => (
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
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, edition)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                          title="Eliminar edición"
                          aria-label="Eliminar edición"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <motion.div whileHover={{ x: 5 }}>
                          <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </motion.div>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm mb-4">
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Inicio:</div>
                          <div>{formatDate(edition.start_date)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">Fin:</div>
                          <div>{formatDate(edition.end_date)}</div>
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
                            {edition.finished_matches} / {edition.matches_count} partidos
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

      <ConfirmModal
        isOpen={!!editionToDelete}
        title="Eliminar edición"
        message={
          editionToDelete
            ? `¿Eliminar "${editionToDelete.name}" (${editionToDelete.disciplines.map((d) => d.sport_name).join(", ")})? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText={deleting ? "Eliminando…" : "Eliminar"}
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setEditionToDelete(null)}
        variant="danger"
      />
    </div>
  );
}
