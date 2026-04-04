"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function MonthSelector() {
  const router = useRouter();
  const params = useSearchParams();

  // Parsear ?month=YYYY-MM o usar mes actual
  const raw = params.get("month");
  let year: number;
  let month: number; // 0-indexed

  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map(Number);
    year = y;
    month = m - 1;
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
  }

  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  function navigate(delta: number) {
    const d = new Date(year, month + delta, 1);
    // No permitir navegar a meses futuros
    if (d > new Date(now.getFullYear(), now.getMonth(), 1)) return;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    router.push(`?month=${d.getFullYear()}-${mm}`);
  }

  return (
    <div className="flex items-center gap-1 -ml-2">
      <button
        onClick={() => navigate(-1)}
        className="p-1 rounded-full text-moss/60 hover:text-moss hover:bg-moss/10 transition-colors"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={24} />
      </button>
      <h1 className="font-display text-3xl italic font-bold text-moss capitalize px-1">
        {MONTHS[month]}
      </h1>
      <button
        onClick={() => navigate(1)}
        disabled={isCurrentMonth}
        className="p-1 rounded-full text-moss/60 hover:text-moss hover:bg-moss/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
