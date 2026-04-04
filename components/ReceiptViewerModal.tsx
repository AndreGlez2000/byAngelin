"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Landmark, Receipt } from "lucide-react";

export type ReceiptViewerData = {
  appointmentId: string;
  receiptId?: string;
  clientId?: string;
  clientName: string;
  clientEmail: string | null;
  services: Array<{ name: string; price: string }>;
  date: string;
  totalAmount: number;
  paymentMethod: string;
  notes?: string | null;
};

export default function ReceiptViewerModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptViewerData;
  onClose: () => void;
}) {
  const TEMP_EMAIL_KEY = "receipt-temp-email";

  function getRememberedEmail() {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem(TEMP_EMAIL_KEY) ?? "";
    } catch {
      return "";
    }
  }

  function saveRememberedEmail(email: string) {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(TEMP_EMAIL_KEY, email);
    } catch {
      // Safari private mode / restrictive browsers can throw here.
      // Temporary email still works for this modal session.
    }
  }

  const [isOpen, setIsOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState(receipt.clientEmail ?? "");

  useEffect(() => {
    const t = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (receipt.clientEmail) {
      setEmailInput(receipt.clientEmail);
      return;
    }
    setEmailInput(getRememberedEmail());
  }, [receipt.clientEmail, receipt.appointmentId]);

  const date = new Date(receipt.date);
  const paymentTone =
    receipt.paymentMethod === "Efectivo"
      ? "bg-moss/15 text-moss-dark border-moss/30"
      : "bg-olive/12 text-olive border-olive/20";

  const paymentIcon =
    receipt.paymentMethod === "Efectivo" ? (
      <Receipt size={12} className="inline mr-1.5" />
    ) : (
      <Landmark size={12} className="inline mr-1.5" />
    );

  const displayServices = receipt.services.length > 0 
    ? receipt.services 
    : [{ name: "Servicio en cabina", price: `$${receipt.totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` }];

  const subtotal = useMemo(() => {
    return displayServices.reduce((sum, s) => {
      const n = parseFloat((s.price ?? "").replace(/[^0-9.]/g, ""));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [displayServices]);

  async function handleSendEmail() {
    setSendingEmail(true);
    setEmailFeedback(null);
    try {
      const trimmed = emailInput.trim();
      const res = await fetch(`/api/receipts/${receipt.appointmentId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailTo: trimmed || undefined }),
      });
      if (res.ok) {
        if (trimmed) saveRememberedEmail(trimmed);
        setEmailFeedback("Recibo enviado por correo ✔");
      } else if (res.status === 422) {
        setEmailFeedback("La clienta no tiene correo registrado");
      } else {
        setEmailFeedback("No se pudo enviar el correo");
      }
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`fixed inset-0 bg-dark-olive/40 backdrop-blur-[2px] flex items-end md:items-center justify-center md:p-4 z-50 transition-opacity duration-200 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-[#FCFAF8] rounded-t-2xl md:rounded-2xl overflow-hidden shadow-2xl w-full md:max-w-md max-h-[90dvh] border border-olive/12 transition-all duration-300 flex flex-col ${
          isOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-[0.98]"
        }`}
      >
        {/* HEADER CON COLOR DEL SISTEMA */}
        <div className="px-6 py-5 bg-olive-dark text-parchment-dark shrink-0 relative overflow-hidden">
          <div className="absolute -right-4 -top-6 opacity-5 pointer-events-none">
            <Landmark size={140} />
          </div>
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <h2 className="font-script text-4xl text-white/95 tracking-wide leading-none">Angelin</h2>
              </div>
              <p className="text-[9px] tracking-[0.25em] uppercase text-white/60 font-semibold mb-1">Comprobante de pago</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/50 font-mono tracking-wider bg-black/10 px-2 py-0.5 rounded-md">
                  {receipt.receiptId
                    ? `REF-${receipt.receiptId.slice(0, 8).toUpperCase()}`
                    : "REF-PENDIENTE"}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest px-2 py-1 rounded-full border border-moss/40 bg-moss/20 text-moss font-bold shadow-sm">
                <CheckCircle2 size={10} strokeWidth={3} />
                PAGADO
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-olive/10">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-olive/40 font-semibold mb-0.5">Clienta</p>
              {receipt.clientId ? (
                <Link
                  href={`/clientes/${receipt.clientId}`}
                  onClick={onClose}
                  className="text-olive-dark underline underline-offset-2 font-medium text-base hover:text-blossom-dark transition-colors"
                >
                  {receipt.clientName}
                </Link>
              ) : (
                <p className="text-olive-dark font-medium text-base">{receipt.clientName}</p>
              )}
            </div>

            <span className={`text-[11px] px-3 py-1.5 rounded-full border font-semibold tracking-wide ${paymentTone}`}>
              {paymentIcon}
              {receipt.paymentMethod}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-olive/10 bg-white px-4 py-3 shadow-sm">
              <p className="text-[9px] uppercase tracking-widest text-olive/40 font-semibold mb-1">Fecha</p>
              <p className="text-olive-dark font-medium">
                {date.toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="rounded-xl border border-olive/10 bg-white px-4 py-3 shadow-sm">
              <p className="text-[9px] uppercase tracking-widest text-olive/40 font-semibold mb-1">Hora</p>
              <p className="text-olive-dark font-medium">
                {date.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-olive/15 overflow-hidden shadow-sm bg-white">
            <div className="px-4 py-2.5 bg-parchment/30 flex items-center justify-between text-[9px] uppercase tracking-widest text-olive/50 font-bold border-b border-olive/10">
              <span>Servicio</span>
              <span>Importe</span>
            </div>
            <div className="divide-y divide-olive/5">
              {displayServices.map((s, i) => (
                <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-3 text-sm">
                  <span className="text-olive-dark leading-tight">{s.name}</span>
                  <span className="text-olive-dark font-semibold">
                    {s.price
                      ? `$${parseFloat(s.price.replace(/[^0-9.]/g, "")).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-olive/10 bg-parchment/20 flex items-center justify-between text-sm text-olive/60">
              <span className="font-medium">Subtotal</span>
              <span className="font-medium">${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="px-4 py-2 border-t border-dashed border-olive/20 bg-parchment/30 text-center text-[10px] tracking-[0.3em] uppercase text-olive/30 font-mono">
              · · · · · · ·
            </div>
            <div className="px-4 py-3.5 bg-parchment/40 flex items-center justify-between">
              <span className="text-sm font-bold text-olive-dark uppercase tracking-widest">Total</span>
              <span className="text-xl font-bold text-olive-dark font-mono">
                ${receipt.totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {receipt.notes && (
            <div className="rounded-xl border border-olive/10 bg-white px-4 py-3 shadow-sm">
              <p className="text-[9px] uppercase tracking-widest text-olive/40 font-semibold mb-1.5">Notas</p>
              <p className="text-sm text-olive/80 leading-relaxed italic">{receipt.notes}</p>
            </div>
          )}
        </div>

        <div className="px-6 pt-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] md:pb-6 border-t border-olive/10 bg-[#FCFAF8] sticky bottom-0 shrink-0">
          <div className="flex gap-3">
          <a
            href={`/api/receipts/${receipt.appointmentId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 border border-olive-dark/20 text-olive-dark font-medium text-sm py-3 rounded-xl hover:bg-olive-dark/5 active:scale-[0.98] transition-all"
          >
            <FileText size={15} />
            Descargar PDF
          </a>
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="flex-1 flex items-center justify-center gap-2 bg-olive-dark text-white font-medium text-sm py-3 rounded-xl hover:bg-dark-olive active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            <Receipt size={15} />
            {sendingEmail ? "Enviando..." : "Enviar por correo"}
          </button>
          </div>

          <div className="px-1 pt-4">
            <div className="flex flex-col">
              <label className="text-[9px] uppercase tracking-widest text-olive/50 font-bold mb-1.5">
                Correo para envío {receipt.clientEmail ? "" : "(temporal)"}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={receipt.clientEmail ? "Confirmar correo" : "correo@ejemplo.com"}
                  className="w-full border border-olive/20 bg-white rounded-lg pl-3 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-olive-dark focus:border-olive-dark text-olive-dark transition-colors shadow-sm placeholder:text-olive/30"
                />
              </div>
              <p className="text-[10px] text-olive/45 mt-2 leading-relaxed">
                Este correo se usa <span className="font-semibold">solo para este envío</span> y no modifica la ficha de la clienta.
              </p>
            </div>
            {emailFeedback && (
              <div className={`mt-3 px-3 py-2 rounded-md text-[11px] font-medium flex items-center justify-center gap-2 ${
                emailFeedback.includes("✔") ? "bg-moss/20 text-moss-dark border border-moss/30" : "bg-red-50 text-red-600 border border-red-100"
              }`}>
                {emailFeedback}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
