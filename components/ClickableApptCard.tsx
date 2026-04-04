"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import AppointmentListModal, { type ModalAppointment } from "./AppointmentListModal";

function mxn(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ClickableApptCard({
  count,
  countPrev,
  prevMonthLabel,
  change,
  appointments,
  monthLabel,
}: {
  count: number;
  countPrev: number;
  prevMonthLabel: string;
  change: { value: number; up: boolean } | null;
  appointments: ModalAppointment[];
  monthLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-white rounded-xl shadow-card px-4 py-3 shrink-0 min-w-[160px] md:min-w-0 text-left hover:bg-olive/4 transition-colors group"
      >
        <div className="text-[10px] text-olive/40 uppercase tracking-widest mb-1">
          Citas completadas
        </div>
        <div className="text-xl font-semibold text-olive leading-none group-hover:text-olive">
          {count}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[11px] text-olive/40">
            {countPrev} {prevMonthLabel}
          </span>
          {change && (
            <span className={`flex items-center gap-0.5 text-[11px] font-medium ${change.up ? "text-moss" : "text-blossom-dark"}`}>
              {change.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {change.value}%
            </span>
          )}
          <span className="text-[10px] text-olive/30 ml-auto">ver →</span>
        </div>
      </button>

      {open && (
        <AppointmentListModal
          title={`Citas completadas · ${monthLabel}`}
          appointments={appointments}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
