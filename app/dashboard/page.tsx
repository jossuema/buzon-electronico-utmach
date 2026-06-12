import type { Metadata } from "next";
import { Inbox, Building2, GraduationCap, CalendarClock } from "lucide-react";
import { getDashboardStats } from "@/lib/services/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  BarChartCard,
  PieChartCard,
  TimeLineCard,
} from "@/components/dashboard/charts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Indicadores" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  // Aportes recibidos en los últimos 7 días (a partir de la serie temporal).
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceKey = since.toISOString().slice(0, 10);
  const last7 = stats.overTime
    .filter((d) => d.date >= sinceKey)
    .reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Indicadores</h1>
        <p className="text-muted-foreground">
          Resumen de los aportes recibidos en el Buzón Inteligente UTMACH.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de aportes" value={stats.total} icon={Inbox} />
        <StatCard
          label="Facultades con aportes"
          value={stats.byFaculty.length}
          icon={Building2}
        />
        <StatCard
          label="Carreras con aportes"
          value={stats.byCareer.length}
          icon={GraduationCap}
        />
        <StatCard
          label="Últimos 7 días"
          value={last7}
          icon={CalendarClock}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aportes por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartCard data={stats.byType} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolución temporal</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeLineCard data={stats.overTime} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aportes por facultad</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartCard data={stats.byFaculty} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top carreras</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartCard data={stats.byCareer} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
