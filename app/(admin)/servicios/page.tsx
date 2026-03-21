'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Package } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

type Product = {
  id: string
  name: string
  brand: string | null
  unit: string
  capacityPerUnit: number
  costPerUnit: number
}

type ServiceProduct = {
  id: string
  productId: string
  quantityUsed: number
  product: Product
}

type Service = {
  id: string
  name: string
  category: string
  duration: string
  price: string
  description: string | null
  isActive: boolean
  costIngredients: number | null
  serviceProducts: ServiceProduct[]
}

type ProductLine = { productId: string; quantityUsed: string }

const CATEGORIES = ['Facial', 'Extra / Complemento']

const emptyForm = { name: '', category: 'Facial', duration: '', price: '', description: '' }

function costPerUse(p: Product, qty: number) {
  return (qty * p.costPerUnit) / p.capacityPerUnit
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [productLines, setProductLines] = useState<ProductLine[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function load() {
    const [sRes, pRes] = await Promise.all([fetch('/api/services'), fetch('/api/inventory')])
    if (sRes.ok) setServices(await sRes.json())
    if (pRes.ok) setAllProducts(await pRes.json())
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setProductLines([])
    setShowModal(true)
  }

  function openEdit(s: Service) {
    setEditing(s)
    setForm({ name: s.name, category: s.category, duration: s.duration, price: s.price, description: s.description ?? '' })
    setProductLines(s.serviceProducts.map(sp => ({ productId: sp.productId, quantityUsed: String(sp.quantityUsed) })))
    setShowModal(true)
  }

  // Calcular costo estimado en UI a partir de las líneas actuales
  function calcEstimatedCost(): number | null {
    if (productLines.length === 0) return null
    let total = 0
    for (const line of productLines) {
      const prod = allProducts.find(p => p.id === line.productId)
      const qty = parseFloat(line.quantityUsed)
      if (!prod || !qty || qty <= 0) return null
      total += costPerUse(prod, qty)
    }
    return total
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const validLines = productLines.filter(l => l.productId && parseFloat(l.quantityUsed) > 0)
    const products = validLines.map(l => ({ productId: l.productId, quantityUsed: parseFloat(l.quantityUsed) }))
    const payload = { ...form, products }

    if (editing) {
      await fetch(`/api/services/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    setConfirmDeleteId(null)
    load()
  }

  function addProductLine() {
    setProductLines(lines => [...lines, { productId: '', quantityUsed: '' }])
  }

  function updateLine(i: number, field: keyof ProductLine, value: string) {
    setProductLines(lines => lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  function removeLine(i: number) {
    setProductLines(lines => lines.filter((_, idx) => idx !== i))
  }

  // Productos ya seleccionados (para evitar duplicados en dropdowns)
  function availableProducts(currentProductId: string) {
    const selected = productLines.map(l => l.productId).filter(id => id && id !== currentProductId)
    return allProducts.filter(p => !selected.includes(p.id))
  }

  const grouped = CATEGORIES.map(cat => ({
    cat,
    items: services.filter(s => s.category === cat),
  })).filter(g => g.items.length > 0)

  const otherCats = services
    .map(s => s.category)
    .filter(c => !CATEGORIES.includes(c))
    .filter((c, i, arr) => arr.indexOf(c) === i)
  otherCats.forEach(cat => grouped.push({ cat, items: services.filter(s => s.category === cat) }))

  const estimatedCost = calcEstimatedCost()

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-4 md:px-6 py-4 border-b border-olive/10 bg-parchment flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-2xl text-olive italic font-bold">Catálogo de Servicios</h1>
          <p className="text-xs text-olive/40 mt-0.5">{services.filter(s => s.isActive).length} activos · {services.length} total</p>
        </div>
        <button
          onClick={openNew}
          className="hidden md:flex items-center gap-1.5 bg-blossom-dark text-white text-sm px-4 py-2 rounded-lg hover:bg-blossom transition-colors"
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
            <div className="hidden md:block bg-white rounded-xl shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-olive/8">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Servicio</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Duración</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Precio</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id} onClick={() => openEdit(s)} className={`border-b border-olive/6 last:border-b-0 ${!s.isActive ? 'opacity-45' : ''} cursor-pointer hover:bg-parchment/50 transition-colors`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-olive">{s.name}</div>
                        {s.description && (
                          <div className="text-[11px] text-olive/40 mt-0.5 leading-relaxed line-clamp-1">{s.description}</div>
                        )}
                        {s.serviceProducts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {s.serviceProducts.map(sp => (
                              <span key={sp.id} className="inline-flex items-center text-[10px] bg-moss/10 border border-moss/20 text-olive/60 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {sp.product.name} · {sp.quantityUsed}{sp.product.unit}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-olive/60 whitespace-nowrap">{s.duration}</td>
                      <td className="px-4 py-3 text-olive font-medium whitespace-nowrap">{s.price}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(s.id) }} className="p-1.5 rounded hover:bg-blossom/15 text-olive/30 hover:text-blossom-dark transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list — hidden on desktop */}
            <div className="md:hidden bg-white rounded-xl shadow-card overflow-hidden">
              <div className="px-4 py-2 bg-olive/5 text-xs font-semibold text-olive/60 uppercase tracking-wide">
                {cat}
              </div>
              <div className="divide-y divide-olive/8">
                {items.map(s => (
                  <div
                    key={s.id}
                    onClick={() => openEdit(s)}
                    className={`px-4 py-3.5 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity ${!s.isActive ? 'opacity-45' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-olive truncate">{s.name}</div>
                      <div className="text-xs text-olive/50 mt-0.5">{s.duration}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-sm font-semibold text-olive">{s.price}</div>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(s.id) }}
                        className="p-1.5 -mr-1 text-olive/30 hover:text-blossom-dark active:text-blossom-dark transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
        <div className="fixed inset-0 bg-black/25 flex items-end md:items-center justify-center md:p-4 z-50">
          <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-modal w-full md:max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h2 className="font-display text-2xl text-olive italic">
                {editing ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-olive/30 hover:text-olive/60 text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto flex-1 px-6 pb-6 flex flex-col gap-3">
              {/* Nombre */}
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

              {/* Categoría + Duración */}
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

              {/* Precio */}
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

              {/* Descripción */}
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Descripción del Protocolo (opcional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe los pasos del tratamiento…"
                  rows={2}
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom resize-none"
                />
              </div>

              {/* Productos utilizados */}
              <div className="border-t border-olive/10 pt-3 mt-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-[10px] text-olive/50 uppercase tracking-widest block">Productos Utilizados</label>
                    {estimatedCost != null && (
                      <span className="text-[11px] text-moss font-medium">Costo estimado: ${estimatedCost.toFixed(2)} MXN</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addProductLine}
                    disabled={allProducts.length === 0}
                    className="flex items-center gap-1 text-xs text-blossom-dark hover:underline disabled:opacity-30 disabled:no-underline"
                  >
                    <Package size={12} />
                    Agregar producto
                  </button>
                </div>

                {allProducts.length === 0 && (
                  <p className="text-[11px] text-olive/30 italic">Primero registra productos en Inventario.</p>
                )}

                {productLines.length === 0 && allProducts.length > 0 && (
                  <p className="text-[11px] text-olive/30 italic">Sin productos vinculados — el costo no se calculará automáticamente.</p>
                )}

                <div className="flex flex-col gap-2">
                  {productLines.map((line, i) => {
                    const selectedProd = allProducts.find(p => p.id === line.productId)
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        {/* Selector de producto */}
                        <select
                          value={line.productId}
                          onChange={e => updateLine(i, 'productId', e.target.value)}
                          className="min-w-0 flex-1 border border-olive/20 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                        >
                          <option value="">Seleccionar…</option>
                          {availableProducts(line.productId).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.brand ? `${p.brand} — ` : ''}{p.name}
                            </option>
                          ))}
                          {/* Mostrar el seleccionado aunque ya esté en otra línea */}
                          {line.productId && !availableProducts(line.productId).find(p => p.id === line.productId) && selectedProd && (
                            <option value={selectedProd.id}>{selectedProd.brand ? `${selectedProd.brand} — ` : ''}{selectedProd.name}</option>
                          )}
                        </select>

                        {/* Cantidad */}
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={line.quantityUsed}
                          onChange={e => updateLine(i, 'quantityUsed', e.target.value)}
                          placeholder={selectedProd ? selectedProd.unit : 'ml, g…'}
                          className="w-20 shrink-0 border border-olive/20 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                        />

                        {/* Eliminar línea */}
                        <button type="button" onClick={() => removeLine(i)} className="text-olive/30 hover:text-blossom-dark transition-colors shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-1 shrink-0">
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

      {confirmDeleteId && (
        <ConfirmDialog
          message="¿Eliminar este servicio? Esta acción no se puede deshacer."
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* FAB mobile */}
      <button
        onClick={openNew}
        className="md:hidden fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-blossom-dark text-white shadow-lg flex items-center justify-center active:opacity-80 transition-opacity"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
