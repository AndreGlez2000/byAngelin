"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import ReceiptViewerModal, { type ReceiptViewerData } from "./ReceiptViewerModal";
import { showToast } from "@/lib/toast";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

export type ModalAppointment = {
  id: string;
  date: Date;
  service: string;
  clientId: string;
  clientName: string;
  pricePaid: number | null;
  paymentMethod: string | null;
};

type ReceiptApi = {
  id: string;
  appointmentId: string;
  totalAmount: number;
  paymentMethod: string;
  notes: string | null;
  appointment: {
    id: string;
    date: string;
    client: { id: string; name: string; email: string | null };
    services: Array<{ service: { name: string; price: string } }>;
  };
};

function mxn(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AppointmentListModal({
  title,
  appointments,
  onClose,
}: {
  title: string;
  appointments: ModalAppointment[];
  onClose: () => void;
}) {
  const [receipt, setReceipt] = useState<ReceiptViewerData | null>(null);
  const [receiptLoadingById, setReceiptLoadingById] = useState<
    Record<string, boolean>
  >({});
  const [receiptErrorById, setReceiptErrorById] = useState<
    Record<string, string | null>
  >({});
  const inFlightRef = useRef<Set<string>>(new Set());
  const total = appointments.reduce((s, a) => s + (a.pricePaid ?? 0), 0);

  useBodyScrollLock(true);

  async function openReceipt(appt: ModalAppointment) {
    if (inFlightRef.current.has(appt.id)) return;

    inFlightRef.current.add(appt.id);
    setReceiptLoadingById((prev) => ({ ...prev, [appt.id]: true }));
    setReceiptErrorById((prev) => ({ ...prev, [appt.id]: null }));

    try {
      const res = await fetch(`/api/receipts/${appt.id}`);
      if (res.status === 404) {
        const msg = "Esta cita no tiene recibo disponible.";
        setReceiptErrorById((prev) => ({ ...prev, [appt.id]: msg }));
        showToast(msg, "info");
        return;
      }
      if (!res.ok) {
        const msg = "No se pudo abrir el recibo";
        setReceiptErrorById((prev) => ({ ...prev, [appt.id]: msg }));
        showToast(msg, "error");
        return;
      }
      const data = (await res.json()) as ReceiptApi;
      setReceipt({
        appointmentId: data.appointmentId,
        receiptId: data.id,
        clientId: data.appointment.client.id,
        clientName: data.appointment.client.name,
        clientEmail: data.appointment.client.email,
        services: data.appointment.services.map((s) => ({
          name: s.service.name,
          price: s.service.price,
        })),
        date: data.appointment.date,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });
    } finally {
      inFlightRef.current.delete(appt.id);
      setReceiptLoadingById((prev) => ({ ...prev, [appt.id]: false }));
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        className="relative z-10 bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl shadow-xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-olive/8 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-olive">{title}</h2>
            <p className="text-xs text-olive/40 mt-0.5">
              {appointments.length} cita{appointments.length !== 1 ? "s" : ""} · {mxn(total)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-olive/40 hover:text-olive hover:bg-olive/8 transition-colors ml-4 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {appointments.length === 0 ? (
            <p className="text-sm text-olive/40 text-center py-8">
              Sin citas en este período.
            </p>
          ) : (
            <div className="divide-y divide-olive/5">
              {appointments.map((a) => {
                const date = new Date(a.date);
                const dateStr = date.toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                });
                const timeStr = date.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                const isLoading = !!receiptLoadingById[a.id];
                return (
                  <div
                    key={a.id}
                    role="button"
                    tabIndex={isLoading ? -1 : 0}
                    onClick={() => {
                      if (!isLoading) void openReceipt(a);
                    }}
                    onKeyDown={(e) => {
                      if (isLoading) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        void openReceipt(a);
                      }
                    }}
                    aria-busy={isLoading ? "true" : undefined}
                    className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-olive/4 transition-colors text-left ${isLoading ? "opacity-70 cursor-wait pointer-events-none" : "cursor-pointer"}`}
                  >
                    {/* Fecha */}
                    <div className="text-center shrink-0 w-10">
                      <div className="text-[11px] font-bold text-olive leading-none">
                        {dateStr.split(" ")[0]}
                      </div>
                      <div className="text-[10px] text-olive/40 capitalize">
                        {dateStr.split(" ").slice(1).join(" ")}
                      </div>
                      <div className="text-[10px] text-olive/30 mt-0.5">
                        {timeStr}
                      </div>
                    </div>

                    {/* Detalle */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/clientes/${a.clientId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                        }}
                        className="text-sm font-medium text-blossom-dark underline underline-offset-2 truncate block"
                      >
                        {a.clientName}
                      </Link>
                      <div className="text-xs text-olive/50 truncate">
                        {a.service}
                      </div>
                    </div>

                    {/* Monto */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium text-olive">
                        {isLoading
                          ? "Abriendo..."
                          : a.pricePaid != null
                            ? mxn(a.pricePaid)
                            : "—"}
                      </div>
                      {a.paymentMethod && (
                        <div className="text-[10px] text-olive/40 mt-0.5">
                          {a.paymentMethod}
                        </div>
                      )}
                      {receiptErrorById[a.id] && (
                        <div className="text-[10px] text-blossom-dark mt-0.5">
                          {receiptErrorById[a.id]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {receipt && (
        <ReceiptViewerModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}
