"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useUser } from "../../../hooks/useUser";
import {
  Users,
  Calendar,
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Tv,
  UserPlus,
  Settings,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    equipos: 0,
    partidosHoy: 0,
    disciplinas: 0,
    pendientes: 0,
  });
  const [sportsData, setSportsData] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Obtener el torneo activo (el más reciente)
        const { data: tournaments } = await supabase
          .from("tournaments")
          .select("id, name")
          .order("id", { ascending: false })
          .limit(1);

        // Contar TODOS los equipos (no filtrar por torneo)
        const { count } = await supabase
          .from("teams")
          .select("*", { count: "exact", head: true });
        const equiposCount = count || 0;

        // Contar disciplinas/deportes
        const { count: disciplinasCount } = await supabase
          .from("sports")
          .select("*", { count: "exact", head: true });

        // Contar inscripciones abiertas (pendientes)
        const { count: pendientesCount } = await supabase
          .from("registration_forms")
          .select("*", { count: "exact", head: true })
          .eq("is_locked", false);

        // Contar partidos programados para hoy
        const today = new Date().toISOString().split("T")[0];
        let partidosHoyCount = 0;
        
        if (tournaments && tournaments.length > 0) {
          const { data: allTournaments } = await supabase
            .from("tournaments")
            .select("id")
            .eq("name", tournaments[0].name);

          if (allTournaments && allTournaments.length > 0) {
            const allTournamentIds = allTournaments.map((t: any) => t.id);
            
            const { count } = await supabase
              .from("matches")
              .select("*", { count: "exact", head: true })
              .in("tournament_id", allTournamentIds)
              .gte("scheduled_at", `${today}T00:00:00`)
              .lt("scheduled_at", `${today}T23:59:59`);
            
            partidosHoyCount = count || 0;
          }
        }

        setStats({
          equipos: equiposCount,
          partidosHoy: partidosHoyCount,
          disciplinas: disciplinasCount || 0,
          pendientes: pendientesCount || 0,
        });

        // Cargar datos de deportes para el gráfico
        // Contar inscripciones reales de equipos por disciplina
        const { data: teamRegistrations } = await supabase
          .from("team_registrations")
          .select(`
            id,
            registration_forms!inner (
              sport_id,
              sports!inner (
                id,
                name
              )
            )
          `);

        // Agrupar por disciplina y contar
        const sportCounts = new Map<number, { name: string; count: number }>();
        
        if (teamRegistrations) {
          teamRegistrations.forEach((tr: any) => {
            const sportId = tr.registration_forms?.sports?.id;
            const sportName = tr.registration_forms?.sports?.name;
            
            if (sportId && sportName) {
              const current = sportCounts.get(sportId) || { name: sportName, count: 0 };
              sportCounts.set(sportId, { name: sportName, count: current.count + 1 });
            }
          });
        }

        // Convertir a array y ordenar por cantidad
        const sportsWithCounts = Array.from(sportCounts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setSportsData(sportsWithCounts);
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400 dark:text-gray-500">
        Cargando estadísticas...
      </div>
    );
  }

  // Calcular alturas máximas para el gráfico de barras
  const maxCount = Math.max(...sportsData.map((s) => s.count), 1);
  const getBarHeight = (count: number) => (count / maxCount) * 100;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-4 sm:p-6 lg:p-10">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-gray-900 dark:text-white text-2xl sm:text-3xl font-bold leading-tight">
            Dashboard
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base font-normal leading-normal">
            Bienvenido de nuevo, {user?.email?.split("@")[0] || "Admin"}. Aquí tienes un resumen del estado del evento.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="flex flex-col gap-2 rounded-lg p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium leading-normal">
            Equipos Inscritos
          </p>
          <p className="text-gray-900 dark:text-white text-3xl font-bold leading-tight">
            {stats.equipos}
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium leading-normal">
            Partidos Hoy
          </p>
          <p className="text-gray-900 dark:text-white text-3xl font-bold leading-tight">
            {stats.partidosHoy}
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium leading-normal">
            Disciplinas Activas
          </p>
          <p className="text-gray-900 dark:text-white text-3xl font-bold leading-tight">
            {stats.disciplinas}
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium leading-normal">
            Resultados Pendientes
          </p>
          <p className="text-gray-900 dark:text-white text-3xl font-bold leading-tight">
            {stats.pendientes}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-3 flex flex-col gap-4 rounded-lg p-4 sm:p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">
            Actividad de la Última Semana
          </p>
          <div className="flex min-h-[220px] flex-1 flex-col gap-8 py-4">
            <svg
              fill="none"
              height="100%"
              preserveAspectRatio="none"
              viewBox="-3 0 478 150"
              width="100%"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z"
                fill="url(#paint0_linear_chart)"
              />
              <path
                d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25"
                stroke="#3b82f6"
                strokeLinecap="round"
                strokeWidth="3"
              />
              <defs>
                <linearGradient
                  gradientUnits="userSpaceOnUse"
                  id="paint0_linear_chart"
                  x1="236"
                  x2="236"
                  y1="1"
                  y2="149"
                >
                  <stop stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex justify-around">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                <p
                  key={day}
                  className="text-gray-600 dark:text-gray-400 text-[13px] font-bold leading-normal tracking-[0.015em]"
                >
                  {day}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Sports Chart */}
        <div className="lg:col-span-2 flex flex-col gap-4 rounded-lg p-4 sm:p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">
            Inscripciones por Disciplina
          </p>
          <div className="grid min-h-[220px] grid-flow-col gap-6 grid-rows-[1fr_auto] items-end justify-items-center px-3">
            {sportsData.length > 0 ? (
              sportsData.map((sport) => (
                <div key={sport.name} className="flex flex-col items-center gap-2 w-full">
                  <div
                    className="bg-blue-500/20 w-full rounded-t"
                    style={{ height: `${getBarHeight(sport.count)}%` }}
                  />
                  <p className="text-gray-600 dark:text-gray-400 text-[13px] font-bold leading-normal tracking-[0.015em]">
                    {sport.name}
                  </p>
                  <p className="text-gray-900 dark:text-white text-xs font-semibold">
                    {sport.count} {sport.count === 1 ? "inscripción" : "inscripciones"}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-5 text-center text-gray-600 dark:text-gray-400 text-sm">
                No hay datos disponibles
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 flex flex-col gap-4 rounded-lg p-4 sm:p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
          <h3 className="text-gray-900 dark:text-white text-base font-medium leading-normal">
            Tareas Pendientes y Actividad Reciente
          </h3>
          <div className="flex flex-col divide-y divide-gray-200 dark:divide-neutral-800">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white text-sm font-medium">
                    Aprobar inscripción de 'Los Delfines'
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Fútbol Masculino
                  </p>
                </div>
              </div>
              <button className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">
                Revisar
              </button>
            </div>
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white text-sm font-medium">
                    Resultado final: Equipo A (3) vs Equipo B (2)
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Baloncesto - Semifinal
                  </p>
                </div>
              </div>
              <button className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">
                Ver detalles
              </button>
            </div>
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white text-sm font-medium">
                    Asignar árbitro al partido de Voleibol #102
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Voleibol Femenino - Fase de grupos
                  </p>
                </div>
              </div>
              <button className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">
                Asignar
              </button>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="flex flex-col gap-4 rounded-lg p-4 sm:p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
          <h3 className="text-gray-900 dark:text-white text-base font-medium leading-normal">
            Accesos Rápidos
          </h3>
          <div className="flex flex-col gap-3">
            <button className="flex items-center gap-3 w-full p-4 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-sm transition-colors">
              <Tv className="w-5 h-5" />
              Gestionar Partidos en Vivo
            </button>
            <button className="flex items-center gap-3 w-full p-4 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-900 dark:text-white font-bold text-sm transition-colors">
              <UserPlus className="w-5 h-5" />
              Administrar Equipos
            </button>
            <button className="flex items-center gap-3 w-full p-4 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-900 dark:text-white font-bold text-sm transition-colors">
              <Settings className="w-5 h-5" />
              Configurar Torneos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
