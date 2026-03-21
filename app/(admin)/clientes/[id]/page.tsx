'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, ClipboardList, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

type SkinProfile = {
  id: string; fecha: string; edad: number | null
  fototipo: string | null; biotipo: string | null; sensibilidad: string | null
  hidratacion: string | null; grosorPiel: string | null; alteracionesCutaneas: string | null
  elasticidad: string | null; resistencias: string | null; pigmentaciones: string | null
  vitalidadOxigenacion: string | null; habitos: string | null; embarazo: string | null
  exposicionSolar: string | null; deporte: string | null; enfermedades: string | null
  medicamentos: string | null; apoyoEnCasa: string | null; comentarios: string | null
}
type Appointment = {
  id: string; service: string; date: string
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  sessionNotes: string | null; pricePaid: number | null; paymentMethod: string | null
}
type Client = {
  id: string; name: string; phone: string; email: string | null
  skinProfile: SkinProfile | null; appointments: Appointment[]
}
type Service = { id: string; name: string; price: number }

const STATUS_LABEL = { CONFIRMED: 'Confirmada', COMPLETED: 'Completada', CANCELLED: 'Cancelada' }
const STATUS_COLOR = {
  CONFIRMED: 'bg-moss/20 text-moss',
  COMPLETED: 'bg-olive/10 text-olive/50',
  CANCELLED: 'bg-blossom/20 text-blossom-dark',
}
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const SKIN_LABELS: Partial<Record<keyof SkinProfile, string>> = {
  fototipo: 'Fototipo', biotipo: 'Biotipo', sensibilidad: 'Sensibilidad',
  hidratacion: 'Hidratación', grosorPiel: 'Grosor', elasticidad: 'Elasticidad',
}

type SkinForm = {
  fecha: string; edad: string
  fototipo: string; biotipo: string; sensibilidad: string; hidratacion: string
  grosorPiel: string; alteracionesCutaneas: string; elasticidad: string; resistencias: string
  pigmentaciones: string; vitalidadOxigenacion: string; habitos: string; embarazo: string
  exposicionSolar: string; deporte: string; enfermedades: string; medicamentos: string
  apoyoEnCasa: string; comentarios: string
}

type ApptForm = {
  service: string; date: string
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  pricePaid: string; sessionNotes: string
}

function toForm(p: SkinProfile | null): SkinForm {
  const today = new Date().toISOString().slice(0, 10)
  if (!p) return {
    fecha: today, edad: '', fototipo: '', biotipo: '', sensibilidad: '', hidratacion: '',
    grosorPiel: '', alteracionesCutaneas: '', elasticidad: '', resistencias: '',
    pigmentaciones: '', vitalidadOxigenacion: '', habitos: '', embarazo: '',
    exposicionSolar: '', deporte: '', enfermedades: '', medicamentos: '',
    apoyoEnCasa: '', comentarios: '',
  }
  return {
    fecha: p.fecha.slice(0, 10),
    edad: p.edad != null ? String(p.edad) : '',
    fototipo: p.fototipo ?? '', biotipo: p.biotipo ?? '',
    sensibilidad: p.sensibilidad ?? '', hidratacion: p.hidratacion ?? '',
    grosorPiel: p.grosorPiel ?? '', alteracionesCutaneas: p.alteracionesCutaneas ?? '',
    elasticidad: p.elasticidad ?? '', resistencias: p.resistencias ?? '',
    pigmentaciones: p.pigmentaciones ?? '', vitalidadOxigenacion: p.vitalidadOxigenacion ?? '',
    habitos: p.habitos ?? '', embarazo: p.embarazo ?? '',
    exposicionSolar: p.exposicionSolar ?? '', deporte: p.deporte ?? '',
    enfermedades: p.enfermedades ?? '', medicamentos: p.medicamentos ?? '',
    apoyoEnCasa: p.apoyoEnCasa ?? '', comentarios: p.comentarios ?? '',
  }
}

function toLocalDatetimeStr(iso: string) {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [showSkinModal, setShowSkinModal] = useState(false)
  const [skinForm, setSkinForm] = useState<SkinForm>(toForm(null))
  const [savingSkin, setSavingSkin] = useState(false)
  const [showEditClient, setShowEditClient] = useState(false)
  const [editClientForm, setEditClientForm] = useState({ name: '', phone: '', email: '' })
  const [savingClient, setSavingClient] = useState(false)
  const [showApptModal, setShowApptModal] = useState(false)
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [apptForm, setApptForm] = useState<ApptForm>({ service: '', date: '', status: 'CONFIRMED', pricePaid: '', sessionNotes: '' })
  const [savingAppt, setSavingAppt] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string } | null>(null)

  async function loadClient() {
    const res = await fetch(`/api/clients/${id}`)
    if (!res.ok) { router.push('/clientes'); return }
    setClient(await res.json())
  }

  useEffect(() => {
    loadClient()
    fetch('/api/services?active=true').then(r => r.json()).then(setServices)
  }, [id])

  function openEditClient() {
    if (!client) return
    setEditClientForm({ name: client.name, phone: client.phone, email: client.email ?? '' })
    setShowEditClient(true)
  }

  async function handleEditClientSave(e: React.FormEvent) {
    e.preventDefault()
    if (!client) return
    setSavingClient(true)
    await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editClientForm.name.trim(),
        phone: editClientForm.phone.trim(),
        email: editClientForm.email.trim() || null,
      }),
    })
    setSavingClient(false)
    setShowEditClient(false)
    loadClient()
  }

  function openSkinModal() {
    setSkinForm(toForm(client?.skinProfile ?? null))
    setShowSkinModal(true)
  }

  async function handleSkinSave(e: React.FormEvent) {
    e.preventDefault()
    if (!client) return
    setSavingSkin(true)
    const payload = { ...skinForm, edad: skinForm.edad !== '' ? Number(skinForm.edad) : null }
    const method = client.skinProfile ? 'PATCH' : 'POST'
    await fetch(`/api/clients/${client.id}/skin-profile`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSavingSkin(false)
    setShowSkinModal(false)
    loadClient()
  }

  function setField(key: keyof SkinForm, value: string) {
    setSkinForm(f => ({ ...f, [key]: value }))
  }

  function openNewAppt() {
    const now = new Date()
    now.setMinutes(0, 0, 0)
    setEditingAppt(null)
    setApptForm({
      service: services[0]?.name ?? '',
      date: toLocalDatetimeStr(now.toISOString()),
      status: 'CONFIRMED',
      pricePaid: '',
      sessionNotes: '',
    })
    setShowApptModal(true)
  }

  function openEditAppt(a: Appointment) {
    setEditingAppt(a)
    setApptForm({
      service: a.service,
      date: toLocalDatetimeStr(a.date),
      status: a.status,
      pricePaid: a.pricePaid != null ? String(a.pricePaid) : '',
      sessionNotes: a.sessionNotes ?? '',
    })
    setShowApptModal(true)
  }

  async function handleApptSave(e: React.FormEvent) {
    e.preventDefault()
    if (!client) return
    setSavingAppt(true)
    const payload = {
      service: apptForm.service,
      date: new Date(apptForm.date).toISOString(),
      status: apptForm.status,
      pricePaid: apptForm.pricePaid !== '' ? Number(apptForm.pricePaid) : null,
      sessionNotes: apptForm.sessionNotes.trim() || null,
    }
    if (editingAppt) {
      await fetch(`/api/appointments/${editingAppt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, clientId: client.id }),
      })
    }
    setSavingAppt(false)
    setShowApptModal(false)
    loadClient()
  }

  function handleApptDelete(apptId: string) {
    const appt = client?.appointments.find(a => a.id === apptId)
    setConfirmDelete({ id: apptId, label: appt?.service ?? 'esta cita' })
  }

  async function confirmDoDelete() {
    if (!confirmDelete) return
    await fetch(`/api/appointments/${confirmDelete.id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    loadClient()
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-olive/30 text-sm">Cargando…</p>
      </div>
    )
  }

  const stats = {
    citas: client.appointments.length,
    ultimaVisita: client.appointments[0]
      ? new Date(client.appointments[0].date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-olive/10 bg-parchment flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div>
          <nav className="text-xs text-olive/40 mb-1">
            <Link href="/clientes" className="hover:text-olive">Clientas</Link>
            <span className="mx-1.5">/</span>
            <span className="text-olive/60">{client.name}</span>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openSkinModal}
            className="border border-olive/20 text-olive text-sm px-4 py-2 rounded-lg hover:bg-white/60 transition-colors flex items-center gap-1.5"
          >
            <ClipboardList size={13} />
            {client.skinProfile ? 'Editar Ficha' : 'Crear Ficha de Piel'}
          </button>
          <button
            onClick={openNewAppt}
            className="flex items-center gap-1.5 bg-blossom-dark text-white text-sm px-4 py-2 rounded-lg hover:bg-blossom transition-colors"
          >
            <Plus size={14} />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 md:overflow-hidden overflow-y-auto">
        {/* Left panel */}
        <div className="w-full md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-olive/10 overflow-y-auto bg-white/30 p-4 space-y-4">
          <div className="text-center pt-2">
            <div className="w-14 h-14 rounded-full bg-blossom/25 flex items-center justify-center mx-auto mb-2">
              <span className="text-blossom-dark font-semibold text-xl">{client.name.charAt(0)}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="font-display text-lg text-olive italic leading-tight">{client.name}</h2>
              <button onClick={openEditClient} className="text-olive/30 hover:text-olive/60 transition-colors">
                <Pencil size={11} />
              </button>
            </div>
            <p className="text-sm text-olive/70 mt-0.5">{client.phone}</p>
            {client.email
              ? <p className="text-xs text-olive/55 mt-0.5">{client.email}</p>
              : <button onClick={openEditClient} className="text-xs text-blossom-dark/60 hover:text-blossom-dark mt-0.5">+ agregar correo</button>
            }
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-parchment rounded-lg py-2">
              <div className="text-xl font-semibold text-olive">{stats.citas}</div>
              <div className="text-[10px] text-olive/40">citas</div>
            </div>
            <div className="bg-parchment rounded-lg py-2">
              <div className="text-sm font-semibold text-olive leading-tight">{stats.ultimaVisita}</div>
              <div className="text-[10px] text-olive/40 mt-0.5">última visita</div>
            </div>
          </div>

          {client.skinProfile ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-base text-olive italic">Análisis de Piel</h3>
                <button onClick={openSkinModal}>
                  <Pencil size={11} className="text-olive/30 hover:text-olive/60" />
                </button>
              </div>
              <div className="space-y-1.5">
                {(Object.keys(SKIN_LABELS) as Array<keyof typeof SKIN_LABELS>).map(key => {
                  const val = client.skinProfile![key]
                  if (!val) return null
                  return (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="text-xs text-olive/60">{SKIN_LABELS[key]}</span>
                      <span className="text-xs text-olive/85 font-medium text-right">{String(val)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-display text-base text-olive italic mb-2">Análisis de Piel</h3>
              <button
                onClick={openSkinModal}
                className="w-full text-xs text-blossom-dark border border-dashed border-blossom/40 rounded-lg py-2.5 hover:bg-blossom/5 transition-colors"
              >
                + Crear Ficha
              </button>
            </div>
          )}
        </div>

        {/* Right panel — appointment history */}
        <div className="flex-1 md:overflow-y-auto p-6">
          <h2 className="font-display text-xl text-olive italic mb-4">Historial de Citas</h2>

          {client.appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-olive/30">
              <p className="text-sm italic">Sin citas registradas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {client.appointments.map(a => {
                const d = new Date(a.date)
                return (
                  <div key={a.id} className="bg-white rounded-xl shadow-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="text-center shrink-0 w-10">
                          <div className="text-xl font-semibold text-olive leading-none">{d.getDate()}</div>
                          <div className="text-[10px] text-olive/40">{MONTHS[d.getMonth()]}</div>
                          <div className="text-[10px] text-olive/30">{d.getFullYear()}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-olive text-sm">{a.service}</p>
                          <p className="text-xs text-olive/50 mt-0.5">
                            {d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            {a.pricePaid != null && (
                              <span className="ml-2 text-moss font-medium">
                                ${a.pricePaid.toLocaleString('es-MX')}
                              </span>
                            )}
                          </p>
                          {a.sessionNotes && (
                            <p className="text-xs text-olive/40 mt-1 italic line-clamp-2">{a.sessionNotes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[a.status]}`}>
                          {STATUS_LABEL[a.status]}
                        </span>
                        <button
                          onClick={() => openEditAppt(a)}
                          className="p-1.5 rounded hover:bg-olive/8 text-olive/35 hover:text-olive transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleApptDelete(a.id)}
                          className="p-1.5 rounded hover:bg-blossom/15 text-olive/25 hover:text-blossom-dark transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message={`¿Eliminar "${confirmDelete.label}"? Esta acción no se puede deshacer.`}
          onConfirm={confirmDoDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Modal: Editar Clienta */}
      {showEditClient && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
          <div className="bg-white md:rounded-2xl shadow-modal p-5 md:p-6 w-full h-full md:h-auto md:max-w-xs md:mx-4 overflow-y-auto">
            <h2 className="font-display text-xl text-olive italic mb-4">Editar Clienta</h2>
            <form onSubmit={handleEditClientSave} className="space-y-3">
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Nombre</label>
                <input
                  required
                  value={editClientForm.name}
                  onChange={e => setEditClientForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-olive/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                />
              </div>
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Teléfono</label>
                <input
                  required
                  value={editClientForm.phone}
                  onChange={e => setEditClientForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-olive/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                />
              </div>
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Correo electrónico</label>
                <input
                  type="email"
                  value={editClientForm.email}
                  onChange={e => setEditClientForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="opcional"
                  className="w-full border border-olive/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowEditClient(false)} className="flex-1 border border-olive/20 text-olive text-sm py-2 rounded-lg hover:bg-olive/5">Cancelar</button>
                <button type="submit" disabled={savingClient} className="flex-1 bg-blossom-dark text-white text-sm py-2 rounded-lg hover:bg-blossom disabled:opacity-50">
                  {savingClient ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear / Editar Cita */}
      {showApptModal && (
        <div className="fixed inset-0 bg-black/25 flex items-end md:items-center justify-center md:p-4 z-50">
          <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-modal p-6 w-full md:max-w-sm h-auto md:h-auto overflow-y-auto max-h-[90dvh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-olive italic">
                {editingAppt ? 'Editar Cita' : 'Nueva Cita'}
              </h2>
              <button onClick={() => setShowApptModal(false)} className="text-olive/30 hover:text-olive/60 text-lg leading-none">✕</button>
            </div>
            <form onSubmit={handleApptSave} className="space-y-3">
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Servicio</label>
                {services.length > 0 ? (
                  <select
                    value={apptForm.service}
                    onChange={e => setApptForm(f => ({ ...f, service: e.target.value }))}
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    value={apptForm.service}
                    onChange={e => setApptForm(f => ({ ...f, service: e.target.value }))}
                    placeholder="Nombre del servicio"
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                )}
              </div>
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Fecha y hora</label>
                <input
                  required
                  type="datetime-local"
                  value={apptForm.date}
                  onChange={e => setApptForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Estado</label>
                  <select
                    value={apptForm.status}
                    onChange={e => setApptForm(f => ({ ...f, status: e.target.value as ApptForm['status'] }))}
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  >
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="COMPLETED">Completada</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Precio pagado (MXN)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={apptForm.pricePaid}
                    onChange={e => setApptForm(f => ({ ...f, pricePaid: e.target.value }))}
                    placeholder="opcional"
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Notas de sesión</label>
                <textarea
                  value={apptForm.sessionNotes}
                  onChange={e => setApptForm(f => ({ ...f, sessionNotes: e.target.value }))}
                  placeholder="Opcional…"
                  rows={3}
                  className="w-full border border-olive/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom resize-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowApptModal(false)}
                  className="flex-1 border border-olive/20 text-olive text-sm py-2.5 rounded-lg hover:bg-olive/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAppt}
                  className="flex-1 bg-blossom-dark text-white text-sm py-2.5 rounded-lg hover:bg-blossom transition-colors disabled:opacity-50"
                >
                  {savingAppt ? 'Guardando…' : editingAppt ? 'Guardar Cambios' : 'Crear Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ficha de Piel */}
      {showSkinModal && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
          <div className="bg-white md:rounded-2xl shadow-modal w-full h-full md:h-auto md:max-w-2xl md:max-h-[90vh] md:mx-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-olive/10 shrink-0">
              <h2 className="font-display text-2xl text-olive italic">
                {client.skinProfile ? 'Editar Ficha de Piel' : 'Nueva Ficha de Piel'}
              </h2>
              <button onClick={() => setShowSkinModal(false)} className="text-olive/30 hover:text-olive/60 text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleSkinSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                <section>
                  <h3 className="text-[10px] text-olive/40 uppercase tracking-widest font-medium mb-3">General</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Fecha</label>
                      <input
                        required
                        type="date"
                        value={skinForm.fecha}
                        onChange={e => setField('fecha', e.target.value)}
                        className="w-full border border-olive/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Edad</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={skinForm.edad}
                        onChange={e => setField('edad', e.target.value)}
                        placeholder="Ej. 32"
                        className="w-full border border-olive/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] text-olive/40 uppercase tracking-widest font-medium mb-3">Análisis de Piel</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ['fototipo', 'Fototipo', 'I / II / III / IV / V / VI'],
                      ['biotipo', 'Biotipo', 'Normal / Seco / Graso / Mixto'],
                      ['sensibilidad', 'Sensibilidad', 'Alta / Media / Baja'],
                      ['hidratacion', 'Hidratación', 'Buena / Regular / Baja'],
                      ['grosorPiel', 'Grosor de piel', 'Fino / Normal / Grueso'],
                      ['elasticidad', 'Elasticidad', 'Buena / Regular / Baja'],
                      ['alteracionesCutaneas', 'Alteraciones cutáneas', 'Ej. acné, rosácea'],
                      ['resistencias', 'Resistencias', 'Ej. comedones, quistes'],
                      ['pigmentaciones', 'Pigmentaciones', 'Ej. manchas solares'],
                      ['vitalidadOxigenacion', 'Vitalidad / Oxigenación', 'Buena / Regular / Baja'],
                    ] as [keyof SkinForm, string, string][]).map(([key, label, placeholder]) => (
                      <div key={key}>
                        <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">{label}</label>
                        <input
                          value={skinForm[key]}
                          onChange={e => setField(key, e.target.value)}
                          placeholder={placeholder}
                          className="w-full border border-olive/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] text-olive/40 uppercase tracking-widest font-medium mb-3">Estilo de Vida</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ['exposicionSolar', 'Exposición solar', 'Alta / Media / Baja'],
                      ['deporte', 'Deporte', 'Ej. sí, cardio 3x/sem'],
                      ['habitos', 'Hábitos', 'Ej. fuma, bebe alcohol'],
                      ['embarazo', 'Embarazo / Lactancia', 'Sí / No / N/A'],
                      ['enfermedades', 'Enfermedades', 'Ej. diabetes, tiroides'],
                      ['medicamentos', 'Medicamentos', 'Ej. anticonceptivos'],
                    ] as [keyof SkinForm, string, string][]).map(([key, label, placeholder]) => (
                      <div key={key}>
                        <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">{label}</label>
                        <input
                          value={skinForm[key]}
                          onChange={e => setField(key, e.target.value)}
                          placeholder={placeholder}
                          className="w-full border border-olive/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] text-olive/40 uppercase tracking-widest font-medium mb-3">Extras</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Apoyo en casa</label>
                      <input
                        value={skinForm.apoyoEnCasa}
                        onChange={e => setField('apoyoEnCasa', e.target.value)}
                        placeholder="Ej. limpieza diaria, protector solar"
                        className="w-full border border-olive/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Comentarios</label>
                      <textarea
                        value={skinForm.comentarios}
                        onChange={e => setField('comentarios', e.target.value)}
                        placeholder="Notas adicionales sobre la clienta…"
                        rows={3}
                        className="w-full border border-olive/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom resize-none"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="px-6 py-4 border-t border-olive/10 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSkinModal(false)}
                  className="flex-1 border border-olive/20 text-olive text-sm py-2.5 rounded-lg hover:bg-olive/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSkin}
                  className="flex-1 bg-blossom-dark text-white text-sm py-2.5 rounded-lg hover:bg-blossom transition-colors disabled:opacity-50"
                >
                  {savingSkin ? 'Guardando…' : client.skinProfile ? 'Guardar Cambios' : 'Crear Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
