'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

type Service = {
  id: string
  name: string
  category: string
  duration: string
  price: string
  description: string | null
  isActive: boolean
  costIngredients: number | null
}

const CATEGORIES = ['Facial', 'Extra / Complemento']

const emptyForm = { name: '', category: 'Facial', duration: '', price: '', description: '' }

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/services')
    if (res.ok) setServices(await res.json())
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(s: Service) {
    setEditing(s)
    setForm({ name: s.name, category: s.category, duration: s.duration, price: s.price, description: s.description ?? '' })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editing) {
      await fetch(`/api/services/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setSaving(false)
    setShowModal(false)
    load()
  }

  async function toggleActive(s: Service) {
    await fetch(`/api/services/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !s.isActive }),
    })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    load()
  }

  function calcMargin(s: Service): { pct: number; cost: number; price: number } | null {
    if (s.costIngredients == null) return null
    const price = parseFloat(s.price.replace(/[^0-9.]/g, ''))
    if (!Number.isFinite(price) || price === 0) return null
    const pct = Math.round(((price - s.costIngredients) / price) * 100)
    return { pct, cost: s.costIngredients, price }
  }

  const grouped = CATEGORIES.map(cat => ({
    cat,
    items: services.filter(s => s.category === cat),
  })).filter(g => g.items.length > 0)

  // also show any category not in the predefined list
  const otherCats = services
    .map(s => s.category)
    .filter(c => !CATEGORIES.includes(c))
    .filter((c, i, arr) => arr.indexOf(c) === i)
  otherCats.forEach(cat => grouped.push({ cat, items: services.filter(s => s.category === cat) }))

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-olive/10 bg-parchment flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-2xl text-olive italic">Catálogo de Servicios</h1>
          <p className="text-xs text-olive/40 mt-0.5">{services.filter(s => s.isActive).length} activos · {services.length} total</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-blossom-dark text-white text-sm px-4 py-2 rounded-lg hover:bg-blossom transition-colors"
        >
          <Plus size={14} />
          Agregar Servicio
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {grouped.map(({ cat, items }) => (
          <div key={cat}>
            <h2 className="text-[10px] uppercase tracking-widest text-olive/40 font-medium mb-2">{cat}</h2>
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-olive/8">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Servicio</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Duración</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Precio</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Costo · Margen</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((s, i) => (
                    <tr key={s.id} className={`border-b border-olive/6 last:border-b-0 ${!s.isActive ? 'opacity-45' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-olive">{s.name}</div>
                        {s.description && (
                          <div className="text-[11px] text-olive/40 mt-0.5 leading-relaxed line-clamp-1">{s.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-olive/60 whitespace-nowrap">{s.duration}</td>
                      <td className="px-4 py-3 text-olive font-medium whitespace-nowrap">{s.price}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(() => {
                          const m = calcMargin(s)
                          if (!m) return <span className="text-olive/20">—</span>
                          const color = m.pct >= 60 ? 'text-moss' : m.pct >= 40 ? 'text-amber-500' : 'text-red-400'
                          return (
                            <div>
                              <span className="text-[11px] text-olive/50">${m.cost.toFixed(0)} costo</span>
                              <span className={`ml-2 text-xs font-semibold ${color}`}>{m.pct}%</span>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(s)}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          {s.isActive
                            ? <><ToggleRight size={18} className="text-moss" /><span className="text-moss">Activo</span></>
                            : <><ToggleLeft size={18} className="text-olive/30" /><span className="text-olive/40">Inactivo</span></>
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-olive/8 text-olive/40 hover:text-olive transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-blossom/15 text-olive/30 hover:text-blossom-dark transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-olive/30">
            <p className="text-sm italic">Sin servicios registrados.</p>
            <button onClick={openNew} className="mt-3 text-xs text-blossom-dark hover:underline">Agregar el primero</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-olive italic">
                {editing ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-olive/30 hover:text-olive/60 text-lg leading-none">✕</button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Nombre del Servicio</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Facial Deep Hydra."
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Categoría</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Duración</label>
                  <input
                    required
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    placeholder="Ej. 70 min"
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Precio (MXN)</label>
                <input
                  required
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="Ej. $950"
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                />
              </div>
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Descripción del Protocolo (opcional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe los pasos del tratamiento…"
                  rows={3}
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom resize-none"
                />
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
                  {saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Agregar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
