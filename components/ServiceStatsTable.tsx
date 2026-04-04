"use client";

import { useState } from "react";
import type { ServiceStat } from "@/lib/queries";
import AppointmentListModal, { type ModalAppointment } from "./AppointmentListModal";

function mxn(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ServiceStatsTable({
  serviceStats,
  monthLabel,
}: {
  serviceStats: ServiceStat[];
  monthLabel: string;
}) {
  const [selected, setSelected] = useState<ServiceStat | null>(null);

  if (serviceStats.length === 0) return null;

  const maxRevenue = serviceStats[0].revenue;

  const modalAppointments: ModalAppointment[] = selected
    ? selected.appointments.map((a) => ({
        id: a.id,
        date: a.date,
        service: selected.service,
        clientId: a.clientId,
        clientName: a.clientName,
        pricePaid: a.pricePaid,
        paymentMethod: a.paymentMethod,
      }))
    : [];

  return (
    <>
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-olive/8">
          <h2 className="text-sm font-semibold text-olive">
            Servicios completados
          </h2>
          <p className="text-xs text-olive/40 mt-0.5">
            {monthLabel} · toca un servicio para ver el historial
          </p>
        </div>

        <div className="divide-y divide-olive/5">
          {serviceStats.map((item) => {
            const pct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
            return (
              <button
                key={item.service}
                onClick={() => setSelected(item)}
                className="w-full px-5 py-3 flex items-center gap-4 hover:bg-olive/4 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-olive truncate font-medium">
                    {item.service}
                  </div>
                  <div className="mt-1.5 h-1.5 bg-olive/6 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-moss rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-olive">
                    {mxn(item.revenue)}
                  </div>
                  <div className="text-[10px] text-olive/40 mt-0.5">
                    {item.count} cita{item.count !== 1 ? "s" : ""}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <AppointmentListModal
          title={selected.service}
          appointments={modalAppointments}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
