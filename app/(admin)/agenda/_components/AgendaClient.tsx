"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { parseDurationMin, findOverlap } from "@/lib/appointments";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Trash2,
  Receipt,
} from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import dynamic from "next/dynamic";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import ReceiptViewerModal from "@/components/ReceiptViewerModal";
import { showToast } from "@/lib/toast";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

const MobileDayView = dynamic(
  () => import("./MobileDayView").then((m) => ({ default: m.MobileDayView })),
  { ssr: false },
);

import { AppointmentCard } from "@/components/appointments/AppointmentCard";

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
  services?: Array<{ service: { id: string; name: string; price: string } }>;
  receipt?: { id: string; totalAmount: number; paymentMethod: string } | null;
};

type PayModal = {
  id: string;
  serviceName: string;
  pricePaid: string;
  paymentMethod: string;
  sessionNotes: string;
};

function computeServiceLabel(selectedIds: string[], services: Service[]): string {
  return selectedIds
    .map((id) => services.find((s) => s.id === id)?.name ?? "")
    .filter(Boolean)
    .join(" + ");
}

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
  initialFocusDate,
  initialAppointmentId,
}: {
  initialAppointments: any[];
  initialClients: any[];
  initialServices: any[];
  initialFocusDate?: string;
  initialAppointmentId?: string | null;
}) {
  const isMobile = useIsMobile();
  const [weekStart, setWeekStart] = useState(() =>
    mondayOf(initialFocusDate ? new Date(initialFocusDate) : new Date()),
  );
  const [selectedDay, setSelectedDay] = useState(() =>
    initialFocusDate ? new Date(initialFocusDate) : new Date(),
  );
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [clients] = useState<Client[]>(initialClients);
  const [services] = useState<Service[]>(initialServices);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    service: "",
    serviceIds: [] as string[],
    date: "",
    time: "",
    sessionNotes: "",
  });
  const [saving, setSaving] = useState(false);
  const [payModal, setPayModal] = useState<PayModal | null>(null);
  const [receiptModal, setReceiptModal] = useState<{
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
  } | null>(null);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState({
    service: "",
    serviceIds: [] as string[],
    date: "",
    time: "",
    status: "CONFIRMED" as Appointment["status"],
    sessionNotes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [createServerError, setCreateServerError] = useState<string | null>(
    null,
  );
  const [editServerError, setEditServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [receiptLoadingById, setReceiptLoadingById] = useState<
    Record<string, boolean>
  >({});
  const [receiptErrorById, setReceiptErrorById] = useState<
    Record<string, string | null>
  >({});
  const [mobileDayLoading, setMobileDayLoading] = useState(false);
  const [mobileDayError, setMobileDayError] = useState<string | null>(null);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const receiptInFlightRef = useRef<Set<string>>(new Set());

  const createOverlapError = useMemo(() => {
    if (!form.date || !form.time || form.serviceIds.length === 0) return null;
    const totalMin = form.serviceIds.reduce((sum, id) => {
      const svc = services.find((s) => s.id === id);
      return sum + (svc ? parseDurationMin(svc.duration) : 0);
    }, 0);
    if (totalMin === 0) return null;
    const start = new Date(`${form.date}T${form.time}`);
    return findOverlap(start, totalMin, appointments, services);
  }, [form.date, form.time, form.serviceIds, appointments, services]);

  const editOverlapError = useMemo(() => {
    if (
      !editForm.date ||
      !editForm.time ||
      editForm.serviceIds.length === 0 ||
      !editingAppt
    )
      return null;
    const totalMin = editForm.serviceIds.reduce((sum, id) => {
      const svc = services.find((s) => s.id === id);
      return sum + (svc ? parseDurationMin(svc.duration) : 0);
    }, 0);
    if (totalMin === 0) return null;
    const start = new Date(`${editForm.date}T${editForm.time}`);
    return findOverlap(
      start,
      totalMin,
      appointments,
      services,
      editingAppt.id,
    );
  }, [
    editForm.date,
    editForm.time,
    editForm.serviceIds,
    editingAppt,
    appointments,
    services,
  ]);

  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  useBodyScrollLock(
    showModal ||
      !!editingAppt ||
      !!payModal ||
      !!receiptModal ||
      !!confirmDelete,
  );

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
    const controller = new AbortController();
    const start = new Date(selectedDay);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDay);
    end.setHours(23, 59, 59, 999);
    setMobileDayLoading(true);
    setMobileDayError(null);
    fetch(`/api/appointments?from=${start.toISOString()}&to=${end.toISOString()}`, {
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("No se pudo cargar la agenda del día");
        return r.json();
      })
      .then((data) => setAppointments(data))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setMobileDayError("No se pudo actualizar la agenda. Reintentá.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setMobileDayLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedDay, isMobile]);

  const [didOpenDeepLink, setDidOpenDeepLink] = useState(false);
  const [highlightedAppointmentId, setHighlightedAppointmentId] = useState<
    string | null
  >(null);
  useEffect(() => {
    if (!initialAppointmentId || didOpenDeepLink) return;
    const appt = appointments.find((a) => a.id === initialAppointmentId);
    if (!appt) return;

    setHighlightedAppointmentId(appt.id);
    setTimeout(() => {
      document
        .getElementById(`appt-card-${appt.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    setTimeout(() => setHighlightedAppointmentId(null), 2000);

    // Si el deep-link corresponde a una cita con recibo, abrir el visor de recibo
    // (y NO el CRUD de editar cita)
    openReceiptFromAppointment(appt, { silentError: true })
      .catch(() => {
        // No bloquear UX por errores de red en deep-link
      });

    setDidOpenDeepLink(true);
  }, [initialAppointmentId, didOpenDeepLink, appointments]);

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
    if (form.serviceIds.length === 0) {
      setCreateServerError("Seleccioná al menos un servicio");
      return;
    }
    setSaving(true);
    setCreateServerError(null);
    const dateTime =
      form.date && form.time
        ? new Date(`${form.date}T${form.time}`).toISOString()
        : form.date;
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: form.clientId,
        service: form.service,
        serviceIds: form.serviceIds,
        date: dateTime,
        sessionNotes: form.sessionNotes || null,
      }),
    });
    if (res.status === 409) {
      const data = await res.json();
      setCreateServerError(data.error || "Ya existe una cita en ese horario");
      setSaving(false);
      return;
    }
    if (!res.ok) {
      const data = await res.json();
      setCreateServerError(data.error || "Error al guardar la cita");
      setSaving(false);
      return;
    }
    setShowModal(false);
    setForm({
      clientId: "",
      service: "",
      serviceIds: [],
      date: "",
      time: "",
      sessionNotes: "",
    });
    setSaving(false);
    fetchAppointments();
  }

  function openEdit(a: Appointment) {
    const d = new Date(a.date);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const relationIds = (a.services ?? []).map((s) => s.service.id);
    const fallbackId = services.find((s) => s.name === a.service)?.id;
    const serviceIds =
      relationIds.length > 0 ? relationIds : fallbackId ? [fallbackId] : [];
    setEditingAppt(a);
    setEditForm({
      service: computeServiceLabel(serviceIds, services) || a.service,
      serviceIds,
      date: local.toISOString().slice(0, 10),
      time: local.toISOString().slice(11, 16),
      status: a.status,
      sessionNotes: a.sessionNotes ?? "",
    });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAppt) return;
    if (editForm.serviceIds.length === 0) {
      setEditServerError("Seleccioná al menos un servicio");
      return;
    }
    setSavingEdit(true);
    setEditServerError(null);
    const serviceName =
      computeServiceLabel(editForm.serviceIds, services) || editForm.service;
    const dateTime = new Date(
      `${editForm.date}T${editForm.time}`,
    ).toISOString();
    const wasCompleted =
      editForm.status === "COMPLETED" && editingAppt.status !== "COMPLETED";
    if (wasCompleted) {
      const totalPrice = editForm.serviceIds.reduce((sum, id) => {
        const svc = services.find((s) => s.id === id);
        return sum + (svc ? parseFloat(svc.price.replace(/[^0-9.]/g, "")) || 0 : 0);
      }, 0);
      setPayModal({
        id: editingAppt.id,
        serviceName,
        pricePaid: totalPrice > 0 ? String(totalPrice) : "",
        paymentMethod: "Efectivo",
        sessionNotes: editForm.sessionNotes,
      });
      // patch service/date/status — status se guarda ya, el modal solo agrega precio
      const resCompleted = await fetch(`/api/appointments/${editingAppt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: serviceName,
          serviceIds: editForm.serviceIds,
          date: new Date(dateTime).toISOString(),
          status: "COMPLETED",
        }),
      });
      if (resCompleted.status === 409) {
        const data = await resCompleted.json();
        setEditServerError(data.error || "Ya existe una cita en ese horario");
        setSavingEdit(false);
        return;
      }
      if (!resCompleted.ok) {
        const data = await resCompleted.json();
        setEditServerError(data.error || "Error al guardar la cita");
        setSavingEdit(false);
        return;
      }
      setSavingEdit(false);
      setEditingAppt(null);
      fetchAppointments();
      return;
    }
    const res = await fetch(`/api/appointments/${editingAppt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: serviceName,
        serviceIds: editForm.serviceIds,
        date: new Date(dateTime).toISOString(),
        status: editForm.status,
        sessionNotes: editForm.sessionNotes || null,
      }),
    });
    if (res.status === 409) {
      const data = await res.json();
      setEditServerError(data.error || "Ya existe una cita en ese horario");
      setSavingEdit(false);
      return;
    }
    if (!res.ok) {
      const data = await res.json();
      setEditServerError(data.error || "Error al guardar la cita");
      setSavingEdit(false);
      return;
    }
    setSavingEdit(false);
    setEditingAppt(null);
    fetchAppointments();
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
  }

  async function changeStatus(id: string, status: string, serviceName: string) {
    if (status === "COMPLETED") {
      const appt = appointments.find((a) => a.id === id);
      // Calcular precio sumando todos los servicios del appointment
      const totalPrice = appt?.services?.reduce((sum, s) => {
        return sum + (parseFloat(s.service.price.replace(/[^0-9.]/g, "")) || 0);
      }, 0) ?? (() => {
        const svc = services.find((s) => s.name === serviceName);
        return svc ? parseFloat(svc.price.replace(/[^0-9.]/g, "")) || 0 : 0;
      })();
      setPayModal({
        id,
        serviceName,
        pricePaid: totalPrice > 0 ? String(totalPrice) : "",
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
  }

  async function handleCompleteWithPayment() {
    if (!payModal || paySubmitting) return;
    setPaySubmitting(true);
    const res = await fetch(`/api/appointments/${payModal.id}`, {
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
    if (!res.ok) {
      alert("Error al guardar el pago. Intenta de nuevo.");
      setPaySubmitting(false);
      return;
    }
    setPayModal(null);
    setPaySubmitting(false);
    fetchAppointments();
  }

  async function openReceiptFromAppointment(
    appt: { id: string },
    options?: { silentError?: boolean },
  ) {
    if (receiptInFlightRef.current.has(appt.id)) return;

    receiptInFlightRef.current.add(appt.id);
    setReceiptLoadingById((prev) => ({ ...prev, [appt.id]: true }));
    setReceiptErrorById((prev) => ({ ...prev, [appt.id]: null }));

    try {
      const res = await fetch(`/api/receipts/${appt.id}`);
      if (res.status === 404) {
        setReceiptErrorById((prev) => ({
          ...prev,
          [appt.id]: "Esta cita no tiene recibo disponible.",
        }));
        if (!options?.silentError) {
          showToast("Esta cita no tiene recibo disponible.", "info");
        }
        return;
      }
      if (!res.ok) {
        setReceiptErrorById((prev) => ({
          ...prev,
          [appt.id]: "No se pudo abrir el recibo.",
        }));
        if (!options?.silentError) {
          showToast("No se pudo abrir el recibo", "error");
        }
        return;
      }
      const data = await res.json();
      setReceiptModal({
        receiptId: data.id,
        appointmentId: data.appointmentId,
        clientId: data.appointment.client.id,
        clientName: data.appointment.client.name,
        clientEmail: data.appointment.client.email,
        services: data.appointment.services.map((s: any) => ({
          name: s.service.name,
          price: s.service.price,
        })),
        date: data.appointment.date,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });
    } catch {
      setReceiptErrorById((prev) => ({
        ...prev,
        [appt.id]: "No se pudo abrir el recibo.",
      }));
      if (!options?.silentError) {
        showToast("No se pudo abrir el recibo", "error");
      }
    } finally {
      receiptInFlightRef.current.delete(appt.id);
      setReceiptLoadingById((prev) => ({ ...prev, [appt.id]: false }));
    }
  }

  function openAppointmentFromStatus(
    appt: Appointment,
    displayStatus: Appointment["status"],
  ) {
    if (displayStatus === "COMPLETED") {
      void openReceiptFromAppointment(appt);
      return;
    }
    openEdit(appt);
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
                    className="border-r border-olive/8 last:border-r-0 p-2 space-y-2"
                  >
                    {dayAppts.map((a) => {
                      const displayStatus = getDisplayStatus(
                        a,
                        services,
                        today,
                      );
                      const svcDuration = services.find(
                        (s) => s.name === a.service,
                      )?.duration;
                      return (
                        <div key={a.id} className="space-y-1">
                          <AppointmentCard
                            appointment={a}
                            displayStatus={displayStatus}
                            context="agenda"
                            highlighted={highlightedAppointmentId === a.id}
                            serviceDuration={svcDuration}
                            receiptLoading={!!receiptLoadingById[a.id]}
                            onClick={() =>
                              openAppointmentFromStatus(a, displayStatus)
                            }
                            onReceiptClick={async (appt) => {
                              await openReceiptFromAppointment(appt);
                            }}
                          />
                          {receiptErrorById[a.id] && (
                            <p className="text-[11px] text-blossom-dark px-1">
                              {receiptErrorById[a.id]}
                            </p>
                          )}
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
          onOpenReceipt={openReceiptFromAppointment}
          onDelete={handleDelete}
          getDisplayStatus={(a) => getDisplayStatus(a, services, today)}
          highlightedAppointmentId={highlightedAppointmentId}
          isLoading={mobileDayLoading}
          loadError={mobileDayError}
          getReceiptLoading={(id) => !!receiptLoadingById[id]}
          getReceiptError={(id) => receiptErrorById[id]}
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
                  {["Efectivo", "Transferencia"].map((m) => (
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
                  disabled={paySubmitting}
                  className="flex-1 bg-moss text-white text-sm py-2.5 rounded-lg hover:bg-moss/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {paySubmitting ? "Guardando..." : "Confirmar"}
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
                onClick={() => {
                  setEditingAppt(null);
                  setEditServerError(null);
                }}
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
                  Servicios
                </label>
                <div className="border border-olive/20 rounded-lg overflow-hidden">
                  {["Facial", "Extra / Complemento"].map((cat) => {
                    const catServices = services.filter((s) => s.category === cat);
                    if (catServices.length === 0) return null;
                    return (
                      <div key={cat}>
                        <div className="bg-parchment/60 px-3 py-1.5 text-[10px] text-olive/40 uppercase tracking-widest font-medium">
                          {cat}
                        </div>
                        {catServices.map((s) => {
                          const checked = editForm.serviceIds.includes(s.id);
                          return (
                            <label
                              key={s.id}
                              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-t border-olive/8 first:border-t-0 ${checked ? "bg-blossom/8" : "hover:bg-parchment/40"}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const ids = checked
                                    ? editForm.serviceIds.filter((id) => id !== s.id)
                                    : [...editForm.serviceIds, s.id];
                                  setEditForm((f) => ({
                                    ...f,
                                    serviceIds: ids,
                                    service: computeServiceLabel(ids, services),
                                  }));
                                }}
                                className="accent-blossom-dark shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-olive">{s.name}</span>
                                <span className="text-[11px] text-olive/40 ml-2">
                                  {s.duration} · {s.price}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                {editForm.serviceIds.length === 0 && (
                  <p className="text-[11px] text-olive/40 mt-1">Seleccioná al menos un servicio</p>
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
              {editOverlapError && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠ Ya hay una cita de &quot;{editOverlapError.service}&quot; de{" "}
                  {new Date(editOverlapError.date).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  a{" "}
                  {new Date(
                    new Date(editOverlapError.date).getTime() +
                      parseDurationMin(
                        services.find(
                          (s) => s.name === editOverlapError.service,
                        )?.duration ?? "60 min",
                      ) *
                        60_000,
                  ).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              )}
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
              {editServerError && (
                <p className="text-xs text-red-500 mt-1">⚠ {editServerError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAppt(null);
                    setEditServerError(null);
                  }}
                  className="flex-1 border border-olive/20 text-olive text-sm py-2.5 rounded-lg hover:bg-olive/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !!editOverlapError}
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

      {/* Modal de recibo */}
      {receiptModal && (
        <ReceiptViewerModal
          receipt={receiptModal}
          onClose={() => setReceiptModal(null)}
        />
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
                onClick={() => {
                  setShowModal(false);
                  setCreateServerError(null);
                }}
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
                  Servicios
                </label>
                <div className="border border-olive/20 rounded-lg overflow-hidden">
                  {["Facial", "Extra / Complemento"].map((cat) => {
                    const catServices = services.filter((s) => s.category === cat);
                    if (catServices.length === 0) return null;
                    return (
                      <div key={cat}>
                        <div className="bg-parchment/60 px-3 py-1.5 text-[10px] text-olive/40 uppercase tracking-widest font-medium">
                          {cat}
                        </div>
                        {catServices.map((s) => {
                          const checked = form.serviceIds.includes(s.id);
                          return (
                            <label
                              key={s.id}
                              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-t border-olive/8 first:border-t-0 ${checked ? "bg-blossom/8" : "hover:bg-parchment/40"}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const ids = checked
                                    ? form.serviceIds.filter((id) => id !== s.id)
                                    : [...form.serviceIds, s.id];
                                  setForm((f) => ({
                                    ...f,
                                    serviceIds: ids,
                                    service: computeServiceLabel(ids, services),
                                  }));
                                }}
                                className="accent-blossom-dark shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-olive">{s.name}</span>
                                <span className="text-[11px] text-olive/40 ml-2">{s.duration} · {s.price}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                {form.serviceIds.length === 0 && (
                  <p className="text-[11px] text-olive/40 mt-1">Seleccioná al menos un servicio</p>
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
              {createOverlapError && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠ Ya hay una cita de &quot;{createOverlapError.service}&quot;
                  de{" "}
                  {new Date(createOverlapError.date).toLocaleTimeString(
                    "es-MX",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    },
                  )}{" "}
                  a{" "}
                  {new Date(
                    new Date(createOverlapError.date).getTime() +
                      parseDurationMin(
                        services.find(
                          (s) => s.name === createOverlapError.service,
                        )?.duration ?? "60 min",
                      ) *
                        60_000,
                  ).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              )}
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

              {createServerError && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠ {createServerError}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setCreateServerError(null);
                  }}
                  className="flex-1 border border-olive/20 text-olive text-sm py-2.5 rounded-lg hover:bg-olive/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !!createOverlapError}
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
