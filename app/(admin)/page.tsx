export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getDashboardMetrics } from "@/lib/queries";
import { TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import MonthSelector from "@/components/MonthSelector";
import ClickableApptCard from "@/components/ClickableApptCard";
import ServiceStatsTable from "@/components/ServiceStatsTable";

const MONTHS_LONG = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function mxn(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

function pctChange(
  current: number,
  prev: number,
): { value: number; up: boolean } | null {
  if (prev === 0) return null;
  const value = Math.round(((current - prev) / prev) * 100);
  return { value: Math.abs(value), up: current >= prev };
}

// Parsear ?month=YYYY-MM de searchParams del server
function parseMonth(raw: string | string[] | undefined): Date {
  const s = typeof raw === "string" ? raw : undefined;
  if (s && /^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  return new Date();
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const selectedMonth = parseMonth(searchParams.month);
  const metrics = await getDashboardMetrics(selectedMonth);

  const monthLabel = MONTHS_LONG[selectedMonth.getMonth()];
  const prevMonthLabel = MONTHS_LONG[
    (selectedMonth.getMonth() + 11) % 12
  ].slice(0, 3);

  const revChange = pctChange(metrics.revenueThisMonth, metrics.revenueLastMonth);
  const apptChange = pctChange(metrics.appointmentsThisMonth, metrics.appointmentsLastMonth);

  const firstConfirmedIdx = metrics.todayAppointments.findIndex(
    (x) => x.status === "CONFIRMED",
  );

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 space-y-4">

      {/* Header con selector de mes integrado en el título */}
      <div className="flex flex-col items-start gap-1">
        <Suspense fallback={
          <div>
            <h1 className="font-display text-3xl italic font-bold text-moss capitalize px-1">
              {monthLabel}
            </h1>
          </div>
        }>
          <MonthSelector />
        </Suspense>
        <p className="text-sm text-olive/40 mt-0.5">Resumen del negocio</p>
      </div>

      {/* 2 KPI cards */}
      <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-x-visible md:pb-0">
        {/* Ingresos — estático */}
        <div className="bg-white rounded-xl shadow-card px-4 py-3 shrink-0 min-w-[160px] md:min-w-0">
          <div className="text-[10px] text-olive/40 uppercase tracking-widest mb-1">
            Ingresos
          </div>
          <div className="text-xl font-semibold text-olive leading-none">
            {mxn(metrics.revenueThisMonth)}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] text-olive/40">
              {mxn(metrics.revenueLastMonth)} {prevMonthLabel}
            </span>
            {revChange && (
              <span className={`flex items-center gap-0.5 text-[11px] font-medium ${revChange.up ? "text-moss" : "text-blossom-dark"}`}>
                {revChange.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {revChange.value}%
              </span>
            )}
          </div>
        </div>

        {/* Citas completadas — clickeable (client island) */}
        <ClickableApptCard
          count={metrics.appointmentsThisMonth}
          countPrev={metrics.appointmentsLastMonth}
          prevMonthLabel={prevMonthLabel}
          change={apptChange}
          appointments={metrics.allCompletedThisMonth}
          monthLabel={monthLabel}
        />
      </div>

      {/* Citas de hoy */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-olive/8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-olive">Citas de hoy</h2>
          <span className="text-xs text-olive/40">
            {metrics.todayAppointments.length} total
          </span>
        </div>
        {metrics.todayAppointments.length === 0 ? (
          <p className="px-4 py-6 text-sm text-olive/40 text-center">
            Ninguna cita hoy.
          </p>
        ) : (
          <div className="divide-y divide-olive/5 max-h-64 overflow-y-auto">
            {metrics.todayAppointments.map((a, i) => {
              const time = new Date(a.date).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
              const isNext = a.status === "CONFIRMED" && i === firstConfirmedIdx;
              const borderColor =
                a.status === "COMPLETED"
                  ? "border-l-moss"
                  : a.status === "CANCELLED"
                  ? "border-l-olive/20"
                  : "border-l-moss";
              const bgColor =
                a.status === "COMPLETED"
                  ? "bg-moss/5"
                  : a.status === "CANCELLED"
                  ? "opacity-60"
                  : "";
              return (
                <Link
                  key={a.id}
                  href={`/clientes/${a.client.id}`}
                  className={`block w-full text-left px-4 py-3 flex items-center gap-3 border-l-[3px] hover:bg-olive/5 transition-colors ${borderColor} ${bgColor}`}
                >
                  <div className={`text-[11px] font-bold shrink-0 w-9 ${
                    a.status === "COMPLETED"
                      ? "text-moss"
                      : a.status === "CANCELLED"
                      ? "text-olive/30"
                      : "text-moss"
                  }`}>
                    {time}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-olive truncate">
                      {a.client.name}
                    </div>
                    <div className="text-xs text-olive/50 truncate">
                      {a.service}
                    </div>
                  </div>
                  {isNext && (
                    <span className="text-[10px] bg-moss/15 text-moss border border-moss/30 rounded px-1.5 py-0.5 font-medium shrink-0">
                      ahora
                    </span>
                  )}
                  {a.status === "COMPLETED" && (
                    <span className="text-[10px] bg-moss/10 text-moss rounded px-1.5 py-0.5 font-medium shrink-0">
                      ✓
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Servicios completados — client island con click-through */}
      <ServiceStatsTable
        serviceStats={metrics.serviceStats}
        monthLabel={monthLabel}
      />

    </div>
  );
}
