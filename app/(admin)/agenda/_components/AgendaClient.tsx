"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Trash2,
} from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import dynamic from "next/dynamic";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const MobileDayView = dynamic(
  () => import("./MobileDayView").then((m) => ({ default: m.MobileDayView })),
  { ssr: false },
);

type Client = { id: string; name: string; phone: string };
type Service = {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: string;
};
type Appointment = {
  id: string;
  service: string;
  date: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
  sessionNotes: string | null;
  pricePaid?: number | null;
  paymentMethod?: string | null;
  client: Client;
};

type PayModal = {
  id: string;
  serviceName: string;
  pricePaid: string;
  paymentMethod: string;
  sessionNotes: string;
};

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const STATUS_LABEL = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};
const STATUS_BG = {
  CONFIRMED: "bg-moss/25",
  COMPLETED: "bg-olive/8",
  CANCELLED: "bg-blossom/25",
};
const STATUS_DOT = {
  CONFIRMED: "bg-moss",
  COMPLETED: "bg-olive/30",
  CANCELLED: "bg-blossom-dark",
};
const STATUS_TEXT = {
  CONFIRMED: "text-moss",
  COMPLETED: "text-olive/40",
  CANCELLED: "text-blossom-dark",
};
const STATUS_BADGE = {
  CONFIRMED: "bg-moss text-white",
  COMPLETED: "bg-olive/20 text-olive/50",
  CANCELLED: "bg-blossom-dark text-white",
};
const STATUS_BG_TODAY = {
  CONFIRMED: "bg-white/90",
  COMPLETED: "bg-white/75",
  CANCELLED: "bg-white/40 opacity-60",
};

function getDisplayStatus(
  appt: Appointment,
  services: Service[],
  now: Date,
): Appointment["status"] {
  if (appt.status !== "CONFIRMED") return appt.status;
  const svc = services.find((s) => s.name === appt.service);
  const durationMin = svc ? parseInt(svc.duration) || 0 : 0;
  const endTime = new Date(
    new Date(appt.date).getTime() + durationMin * 60_000,
  );
  return endTime < now ? "COMPLETED" : "CONFIRMED";
}

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function AgendaClient({
  initialAppointments,
  initialClients,
  initialServices,
}: {
  initialAppointments: any[];
  initialClients: any[];
  initialServices: any[];
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [clients] = useState<Client[]>(initialClients);
  const [services] = useState<Service[]>(initialServices);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    service: "",
    customService: "",
    date: "",
    time: "",
    sessionNotes: "",
  });
  const [saving, setSaving] = useState(false);
  const [payModal, setPayModal] = useState<PayModal | null>(null);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({
    service: "",
    customService: "",
    date: "",
    time: "",
    status: "CONFIRMED" as Appointment["status"],
    sessionNotes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const fetchAppointments = useCallback(async () => {
    const end = addDays(weekStart, 6);
    end.setHours(23, 59, 59, 999);
    const res = await fetch(
      `/api/appointments?from=${weekStart.toISOString()}&to=${end.toISOString()}`,
    );
    if (res.ok) setAppointments(await res.json());
  }, [weekStart]);

  // Only re-fetch when week changes (not on initial mount — data comes from server props)
  const [isInitialMount, setIsInitialMount] = useState(true);
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (!isMobile) return;
    const start = new Date(selectedDay);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDay);
    end.setHours(23, 59, 59, 999);
    fetch(
      `/api/appointments?from=${start.toISOString()}&to=${end.toISOString()}`,
    )
      .then((r) => r.json())
      .then(setAppointments);
  }, [selectedDay, isMobile]);

  function prevDay() {
    setSelectedDay((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() - 1);
      return n;
    });
  }
  function nextDay() {
    setSelectedDay((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + 1);
      return n;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const dateTime =
      form.date && form.time ? `${form.date}T${form.time}` : form.date;
    const serviceName =
      form.service === "__custom__" ? form.customService : form.service;
    await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: form.clientId,
        service: serviceName,
        date: dateTime,
        sessionNotes: form.sessionNotes || null,
      }),
    });
    setShowModal(false);
    setForm({
      clientId: "",
      service: "",
      customService: "",
      date: "",
      time: "",
      sessionNotes: "",
    });
    setSaving(false);
    fetchAppointments();
    router.refresh();
  }

  function openEdit(a: Appointment) {
    const d = new Date(a.date);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const isCustom = !services.find((s) => s.name === a.service);
    setEditingAppt(a);
    setEditForm({
      service: isCustom ? "__custom__" : a.service,
      customService: isCustom ? a.service : "",
      date: local.toISOString().slice(0, 10),
      time: local.toISOString().slice(11, 16),
      status: a.status,
      sessionNotes: a.sessionNotes ?? "",
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAppt) return;
    setSavingEdit(true);
    const serviceName =
      editForm.service === "__custom__"
        ? editForm.customService
        : editForm.service;
    const dateTime = `${editForm.date}T${editForm.time}`;
    const wasCompleted =
      editForm.status === "COMPLETED" && editingAppt.status !== "COMPLETED";
    if (wasCompleted) {
      const svc = services.find((s) => s.name === serviceName);
      const numeric = svc ? parseFloat(svc.price.replace(/[^0-9.]/g, "")) : NaN;
      setPayModal({
        id: editingAppt.id,
        serviceName,
        pricePaid: Number.isFinite(numeric) ? String(numeric) : "",
        paymentMethod: "Efectivo",
        sessionNotes: editForm.sessionNotes,
      });
      // also patch service/date while at it
      await fetch(`/api/appointments/${editingAppt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: serviceName,
          date: new Date(dateTime).toISOString(),
        }),
      });
      setSavingEdit(false);
      setEditingAppt(null);
      return;
    }
    await fetch(`/api/appointments/${editingAppt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: serviceName,
        date: new Date(dateTime).toISOString(),
        status: editForm.status,
        sessionNotes: editForm.sessionNotes || null,
      }),
    });
    setSavingEdit(false);
    setEditingAppt(null);
    fetchAppointments();
    router.refresh();
  }

  async function handleDelete(id: string) {
    const appt = appointments.find((a) => a.id === id);
    setConfirmDelete({
      id,
      label: appt ? `${appt.service} · ${appt.client.name}` : "esta cita",
    });
  }

  async function confirmDoDelete() {
    if (!confirmDelete) return;
    await fetch(`/api/appointments/${confirmDelete.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    fetchAppointments();
    router.refresh();
  }

  async function changeStatus(id: string, status: string, serviceName: string) {
    if (status === "COMPLETED") {
      const svc = services.find((s) => s.name === serviceName);
      const numeric = svc ? parseFloat(svc.price.replace(/[^0-9.]/g, "")) : NaN;
      const appt = appointments.find((a) => a.id === id);
      setPayModal({
        id,
        serviceName,
        pricePaid: Number.isFinite(numeric) ? String(numeric) : "",
        paymentMethod: "Efectivo",
        sessionNotes: appt?.sessionNotes ?? "",
      });
      return;
    }
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAppointments();
    router.refresh();
  }

  async function handleCompleteWithPayment() {
    if (!payModal) return;
    await fetch(`/api/appointments/${payModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "COMPLETED",
        pricePaid:
          payModal.pricePaid !== "" ? parseFloat(payModal.pricePaid) : null,
        paymentMethod: payModal.paymentMethod,
        sessionNotes: payModal.sessionNotes || null,
      }),
    });
    setPayModal(null);
    fetchAppointments();
    router.refresh();
  }

  const weekLabel = `Semana ${weekStart.getDate()} - ${weekEnd.getDate()} ${MONTHS_SHORT[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar — desktop only */}
      <div
        className={`px-6 py-4 border-b border-olive/10 bg-parchment flex items-center justify-between gap-4 shrink-0 ${isMobile ? "hidden" : ""}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              className="p-1.5 rounded-lg hover:bg-white/60 text-olive/60 hover:text-olive transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-olive min-w-[200px] text-center">
              {weekLabel}
            </span>
            <button
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="p-1.5 rounded-lg hover:bg-white/60 text-olive/60 hover:text-olive transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={() => setWeekStart(mondayOf(new Date()))}
            className="text-xs bg-olive-dark text-white px-3 py-1.5 rounded-full font-medium hover:bg-olive transition-colors shadow-sm"
          >
            Hoy
          </button>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blossom-dark text-white text-sm px-4 py-2 rounded-lg hover:bg-blossom transition-colors"
        >
          <Plus size={14} />
          Nueva Cita
        </button>
      </div>

      {/* Calendar grid — desktop only */}
      {!isMobile && (
        <div className="flex-1 overflow-auto px-4 pb-4 pt-3">
          <div className="bg-white rounded-xl shadow-card overflow-hidden min-w-[700px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-olive/10">
              {days.map((day, i) => {
                const isToday =
                  day.getDate() === today.getDate() &&
                  day.getMonth() === today.getMonth() &&
                  day.getFullYear() === today.getFullYear();
                return (
                  <div
                    key={i}
                    className={`px-2 py-3 text-center border-r border-olive/8 last:border-r-0 ${
                      isToday ? "bg-olive-dark" : ""
                    }`}
                  >
                    <div
                      className={`text-[10px] uppercase tracking-widest font-medium ${isToday ? "text-white/60" : "text-olive/40"}`}
                    >
                      {DAY_NAMES[i]}
                    </div>
                    <div
                      className={`text-xl font-semibold mt-0.5 leading-none ${isToday ? "text-white" : "text-olive"}`}
                    >
                      {day.getDate()}
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 ${isToday ? "text-white/50" : "text-olive/30"}`}
                    >
                      {MONTHS_SHORT[day.getMonth()]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Appointment columns */}
            <div className="grid grid-cols-7 min-h-[400px]">
              {days.map((day, i) => {
                const dayAppts = appointments
                  .filter((a) => {
                    const d = new Date(a.date);
                    return (
                      d.getFullYear() === day.getFullYear() &&
                      d.getMonth() === day.getMonth() &&
                      d.getDate() === day.getDate()
                    );
                  })
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime(),
                  );
                const isToday =
                  day.getDate() === today.getDate() &&
                  day.getMonth() === today.getMonth() &&
                  day.getFullYear() === today.getFullYear();
                return (
                  <div
                    key={i}
                    className="border-r border-olive/8 last:border-r-0 p-1.5 space-y-1.5"
                  >
                    {dayAppts.map((a) => {
                      const displayStatus = getDisplayStatus(
                        a,
                        services,
                        today,
                      );
                      const time = new Date(a.date).toLocaleTimeString(
                        "es-MX",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        },
                      );
                      const svcDuration = services.find(
                        (s) => s.name === a.service,
                      )?.duration;
                      return (
                        <div
                          key={a.id}
                          onClick={() => openEdit(a)}
                          className={`rounded-lg p-2.5 cursor-pointer group shadow hover:shadow-md hover:ring-1 hover:ring-olive/20 transition-shadow ${STATUS_BG[displayStatus]}`}
                        >
                          {/* Time + duration */}
                          <div className="text-[11px] font-semibold text-olive/80 mb-1.5 leading-none">
                            {time}
                            {svcDuration ? ` · ${svcDuration}` : ""}
                          </div>
                          {/* Client name */}
                          <Link
                            href={`/clientes/${a.client.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-olive leading-tight truncate block hover:text-blossom-dark hover:underline transition-colors"
                          >
                            {a.client.name}
                          </Link>
                          {/* Service */}
                          <div className="text-[10px] text-olive/60 truncate mt-0.5 leading-tight">
                            {a.service}
                          </div>
                          {/* Status badge + notes icon */}
                          <div className="flex items-center justify-between mt-2">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${STATUS_BADGE[displayStatus]}`}
                            >
                              {STATUS_LABEL[displayStatus]}
                            </span>
                            {a.sessionNotes && (
                              <FileText
                                size={9}
                                className="text-olive/40 shrink-0"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 px-1">
            {(
              Object.keys(STATUS_LABEL) as Array<keyof typeof STATUS_LABEL>
            ).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                <span className="text-xs text-olive/50">{STATUS_LABEL[s]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile day view */}
      {isMobile && (
        <MobileDayView
          selectedDay={selectedDay}
          today={today}
          appointments={appointments}
          onPrevDay={prevDay}
          onNextDay={nextDay}
          onToday={() => setSelectedDay(new Date())}
          onNewAppointment={() => setShowModal(true)}
          onEdit={openEdit}
          onDelete={handleDelete}
          getDisplayStatus={(a) => getDisplayStatus(a, services, today)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`¿Eliminar "${confirmDelete.label}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmDoDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Modal de pago al completar cita */}
      {payModal && (
        <div className="fixed inset-0 bg-black/25 flex items-end md:items-center justify-center md:p-4 z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-modal p-6 w-full md:max-w-xs h-auto md:h-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-2xl text-olive italic">
                Completar Cita
              </h2>
              <button
                onClick={() => setPayModal(null)}
                className="text-olive/30 hover:text-olive/60 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-olive/50 mb-4">{payModal.serviceName}</p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                  Monto cobrado (MXN)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-olive/40">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={payModal.pricePaid}
                    onChange={(e) =>
                      setPayModal((m) =>
                        m ? { ...m, pricePaid: e.target.value } : m,
                      )
                    }
                    className="w-full border border-olive/20 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                  Método de pago
                </label>
                <div className="flex gap-2">
                  {["Efectivo", "Transferencia", "Tarjeta"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setPayModal((p) => (p ? { ...p, paymentMethod: m } : p))
                      }
                      className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
                        payModal.paymentMethod === m
                          ? "bg-olive-dark text-white border-olive-dark"
                          : "border-olive/20 text-olive/60 hover:border-olive/40"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                  Notas de sesión (opcional)
                </label>
                <textarea
                  placeholder="Observaciones, reacciones, productos usados…"
                  value={payModal.sessionNotes}
                  onChange={(e) =>
                    setPayModal((m) =>
                      m ? { ...m, sessionNotes: e.target.value } : m,
                    )
                  }
                  rows={3}
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPayModal(null)}
                  className="flex-1 border border-olive/20 text-olive text-sm py-2.5 rounded-lg hover:bg-olive/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCompleteWithPayment}
                  className="flex-1 bg-moss text-white text-sm py-2.5 rounded-lg hover:bg-moss/80 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar cita */}
      {editingAppt && (
        <div className="fixed inset-0 bg-black/25 flex items-end md:items-center justify-center md:p-4 z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-modal p-6 w-full md:max-w-sm max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-olive italic">
                Editar Cita
              </h2>
              <button
                onClick={() => setEditingAppt(null)}
                className="text-olive/30 hover:text-olive/60 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEdit} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                  Clienta
                </label>
                <p className="text-sm text-olive font-medium px-3 py-2.5 bg-parchment/60 rounded-lg">
                  {editingAppt.client.name}
                </p>
              </div>
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                  Servicio
                </label>
                <select
                  required
                  value={editForm.service}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      service: e.target.value,
                      customService: "",
                    }))
                  }
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom bg-white"
                >
                  {["Facial", "Extra / Complemento"].map((cat) => {
                    const catServices = services.filter(
                      (s) => s.category === cat,
                    );
                    if (catServices.length === 0) return null;
                    return (
                      <optgroup key={cat} label={cat}>
                        {catServices.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} · {s.duration} · {s.price}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                  <option value="__custom__">
                    Otro (escribir manualmente)…
                  </option>
                </select>
                {editForm.service === "__custom__" && (
                  <input
                    required
                    placeholder="Nombre del servicio…"
                    value={editForm.customService}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        customService: e.target.value,
                      }))
                    }
                    className="mt-1.5 w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                    Fecha
                  </label>
                  <input
                    required
                    type="date"
                    value={editForm.date}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                    Hora
                  </label>
                  <input
                    required
                    type="time"
                    value={editForm.time}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, time: e.target.value }))
                    }
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                  Estado
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      status: e.target.value as Appointment["status"],
                    }))
                  }
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                >
                  <option value="CONFIRMED">Confirmada</option>
                  <option value="COMPLETED">Completada</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                  Notas (opcional)
                </label>
                <textarea
                  placeholder="Indicaciones, observaciones…"
                  value={editForm.sessionNotes}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, sessionNotes: e.target.value }))
                  }
                  rows={2}
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingAppt(null)}
                  className="flex-1 border border-olive/20 text-olive text-sm py-2.5 rounded-lg hover:bg-olive/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 bg-blossom-dark text-white text-sm py-2.5 rounded-lg hover:bg-blossom transition-colors disabled:opacity-50"
                >
                  {savingEdit ? "Guardando…" : "Guardar Cambios"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleDelete(editingAppt!.id);
                  setEditingAppt(null);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-600 py-1 transition-colors"
              >
                <Trash2 size={12} />
                Eliminar cita
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal nueva cita */}
      {showModal && (
        <div className="fixed inset-0 bg-black/25 flex items-end md:items-center justify-center md:p-4 z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-modal p-6 w-full md:max-w-sm h-auto md:h-auto overflow-y-auto max-h-[90dvh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-olive italic">
                Nueva Cita
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-olive/30 hover:text-olive/60 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                  Clienta
                </label>
                <select
                  required
                  value={form.clientId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientId: e.target.value }))
                  }
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                >
                  <option value="">Seleccionar clienta…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                  Servicio
                </label>
                <select
                  required
                  value={form.service}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      service: e.target.value,
                      customService: "",
                    }))
                  }
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom bg-white"
                >
                  <option value="">Seleccionar servicio…</option>
                  {["Facial", "Extra / Complemento"].map((cat) => {
                    const catServices = services.filter(
                      (s) => s.category === cat,
                    );
                    if (catServices.length === 0) return null;
                    return (
                      <optgroup key={cat} label={cat}>
                        {catServices.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} · {s.duration} · {s.price}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                  <option value="__custom__">
                    Otro (escribir manualmente)…
                  </option>
                </select>
                {form.service === "__custom__" && (
                  <input
                    required
                    placeholder="Nombre del servicio…"
                    value={form.customService}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customService: e.target.value }))
                    }
                    className="mt-1.5 w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                    Fecha
                  </label>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                    Hora
                  </label>
                  <input
                    required
                    type="time"
                    value={form.time}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, time: e.target.value }))
                    }
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                  Notas (opcional)
                </label>
                <textarea
                  placeholder="Indicaciones, observaciones…"
                  value={form.sessionNotes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sessionNotes: e.target.value }))
                  }
                  rows={2}
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom resize-none"
                />
              </div>

              {/* Automations (UI only — Chunks 5 & 6) */}
              <div className="bg-parchment rounded-xl p-3 space-y-2">
                <p className="text-[10px] text-olive/50 uppercase tracking-widest mb-1">
                  Automatizaciones al guardar
                </p>
                {[
                  "Enviar confirmación por correo inmediatamente",
                  "Crear evento en Google Calendar",
                  "Programar recordatorio por correo 24h antes",
                ].map((label, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={i < 2}
                      className="accent-blossom-dark"
                    />
                    <span className="text-xs text-olive/70">{label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-olive/20 text-olive text-sm py-2.5 rounded-lg hover:bg-olive/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blossom-dark text-white text-sm py-2.5 rounded-lg hover:bg-blossom transition-colors disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Guardar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
