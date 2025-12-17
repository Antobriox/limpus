// src/app/dashboard/page.tsx
import StatCard from "../../../components/Statcard";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Equipos" value="78" />
        <StatCard title="Partidos Hoy" value="12" />
        <StatCard title="Disciplinas" value="9" />
        <StatCard title="Pendientes" value="4" />
      </div>
    </div>
  );
}
