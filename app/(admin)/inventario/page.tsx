'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, PackagePlus, AlertTriangle, Package } from 'lucide-react'

type Product = {
  id: string
  name: string
  brand: string | null
  unit: string
  capacityPerUnit: number
  costPerUnit: number
  stock: number
  lowStockAlert: number
}

const UNITS = ['ml', 'gr', 'aplicacion']

const emptyForm = {
  name: '', brand: '', unit: 'ml',
  capacityPerUnit: '', costPerUnit: '',
}

function mxn(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function StockBar({ stock, capacity, alert: _alert }: { stock: number; capacity: number; alert: number }) {
  const pct = capacity > 0 ? Math.min((stock / capacity) * 100, 100) : 0
  const color = pct > 50 ? 'bg-moss' : pct > 10 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-olive/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-olive/50 tabular-nums">{pct.toFixed(0)}%</span>
    </div>
  )
}

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [restockTarget, setRestockTarget] = useState<Product | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [restocking, setRestocking] = useState(false)

  async function load() {
    const res = await fetch('/api/inventory')
    if (res.ok) { setProducts(await res.json()); setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      brand: p.brand ?? '',
      unit: p.unit,
      capacityPerUnit: String(p.capacityPerUnit),
      costPerUnit: String(p.costPerUnit),
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const capacity = Number(form.capacityPerUnit)
    const payload = {
      name: form.name,
      brand: form.brand || null,
      unit: form.unit,
      capacityPerUnit: capacity,
      costPerUnit: Number(form.costPerUnit),
      lowStockAlert: Math.round(capacity * 0.1 * 100) / 100,
      ...(!editing && { stock: capacity }),
    }
    if (editing) {
      await fetch(`/api/inventory/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    setShowModal(false)
    load()
  }

  async function handleDelete(p: Product) {
    if (!confirm(`¿Desactivar "${p.name}"?`)) return
    await fetch(`/api/inventory/${p.id}`, { method: 'DELETE' })
    load()
  }

  async function handleRestock() {
    if (!restockTarget || !restockQty) return
    setRestocking(true)
    await fetch('/api/inventory/restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: restockTarget.id, quantity: Number(restockQty) }),
    })
    setRestocking(false)
    setRestockTarget(null)
    setRestockQty('')
    load()
  }

  const inStock = products.filter(p => p.stock > 0)
  const outOfStock = products.filter(p => p.stock === 0)
  const lowCount = products.filter(p => p.stock > 0 && p.stock < p.lowStockAlert).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-olive/40 text-sm">Cargando…</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-4 md:px-6 py-4 border-b border-olive/10 bg-parchment flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-2xl text-olive italic font-bold">Inventario</h1>
          <p className="text-xs text-olive/40 mt-0.5">
            {products.length} productos
            {lowCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                <AlertTriangle size={11} />
                {lowCount} con stock bajo
              </span>
            )}
          </p>
        </div>
        <button
          onClick={openNew}
          className="hidden md:flex items-center gap-1.5 bg-blossom-dark text-white text-sm px-4 py-2 rounded-lg hover:bg-blossom transition-colors"
        >
          <Plus size={14} />
          Agregar Producto
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 md:p-6 flex flex-col gap-4 md:gap-6 min-h-0 overflow-y-auto md:overflow-hidden">
        {/* En stock */}
        {inStock.length > 0 && (
          <div className="flex flex-col md:flex-1 md:min-h-0">
            <h2 className="text-[10px] uppercase tracking-widest text-olive/40 font-medium mb-2">
              En stock · {inStock.length}
            </h2>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl shadow-card flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-olive/8">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Producto</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Stock</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Envase</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Costo</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {inStock.map(p => (
                    <tr key={p.id} className="border-b border-olive/6 last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-olive">{p.name}</div>
                        {p.brand && <div className="text-[11px] text-olive/40">{p.brand}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-olive tabular-nums">
                            {p.stock % 1 === 0 ? p.stock.toFixed(0) : p.stock.toFixed(1)} {p.unit}
                          </span>
                          {p.stock < p.lowStockAlert && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
                              <AlertTriangle size={9} />
                              bajo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StockBar stock={p.stock} capacity={p.capacityPerUnit} alert={p.lowStockAlert} />
                      </td>
                      <td className="px-4 py-3 text-olive/60 text-xs whitespace-nowrap">
                        {mxn(p.costPerUnit)}/{p.unit === 'aplicacion' ? 'aplic.' : 'envase'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => { setRestockTarget(p); setRestockQty('') }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-moss/10 text-moss text-xs font-medium hover:bg-moss/20 transition-colors"
                          >
                            <PackagePlus size={12} />
                            Restock
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded hover:bg-olive/8 text-olive/40 hover:text-olive transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded hover:bg-blossom/15 text-olive/30 hover:text-blossom-dark transition-colors"
                          >
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
            {/* Mobile card list */}
            <div className="md:hidden bg-white rounded-xl shadow-card divide-y divide-olive/8">
              {inStock.map(p => {
                const pct = p.capacityPerUnit > 0 ? Math.min(100, Math.round((p.stock / p.capacityPerUnit) * 100)) : 0
                const isLow = p.stock < p.lowStockAlert
                return (
                  <div key={p.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-olive truncate">{p.name}</div>
                        {p.brand && (
                          <div className="text-xs text-olive/45 mt-0.5">{p.brand}</div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-olive">
                          {p.stock % 1 === 0 ? p.stock.toFixed(0) : p.stock.toFixed(1)} {p.unit}
                        </div>
                        <div className="text-xs text-olive/50">{mxn(p.costPerUnit)}</div>
                      </div>
                    </div>
                    {/* Stock bar */}
                    <div className="mt-2 h-1.5 bg-olive/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isLow ? 'bg-red-400' : 'bg-moss'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {isLow && (
                      <div className="mt-1 text-xs text-red-500 font-medium">Stock bajo</div>
                    )}
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <button
                        onClick={() => { setRestockTarget(p); setRestockQty('') }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-moss/10 text-moss text-xs font-medium hover:bg-moss/20 transition-colors"
                      >
                        <PackagePlus size={12} />
                        Restock
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded hover:bg-olive/8 text-olive/40 hover:text-olive transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 rounded hover:bg-blossom/15 text-olive/30 hover:text-blossom-dark transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sin stock */}
        {outOfStock.length > 0 && (
          <div className="flex flex-col md:flex-1 md:min-h-0">
            <h2 className="text-[10px] uppercase tracking-widest text-olive/40 font-medium mb-2">
              Sin stock · Por comprar · {outOfStock.length}
            </h2>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl shadow-card flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-olive/8">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Producto</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Unidad</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-olive/40 font-medium">Costo</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {outOfStock.map(p => (
                    <tr key={p.id} className="border-b border-olive/6 last:border-b-0 opacity-55">
                      <td className="px-4 py-3">
                        <div className="font-medium text-olive">{p.name}</div>
                        {p.brand && <div className="text-[11px] text-olive/40">{p.brand}</div>}
                      </td>
                      <td className="px-4 py-3 text-olive/60 text-xs">{p.unit}</td>
                      <td className="px-4 py-3 text-olive/60 text-xs whitespace-nowrap">
                        {mxn(p.costPerUnit)}/{p.unit === 'aplicacion' ? 'aplic.' : 'envase'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => { setRestockTarget(p); setRestockQty('') }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-moss/10 text-moss text-xs font-medium hover:bg-moss/20 transition-colors"
                          >
                            <PackagePlus size={12} />
                            Restock
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded hover:bg-olive/8 text-olive/40 hover:text-olive transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded hover:bg-blossom/15 text-olive/30 hover:text-blossom-dark transition-colors"
                          >
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
            {/* Mobile card list */}
            <div className="md:hidden bg-white rounded-xl shadow-card divide-y divide-olive/8 opacity-70">
              {outOfStock.map(p => (
                <div key={p.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-olive truncate">{p.name}</div>
                      {p.brand && (
                        <div className="text-xs text-olive/45 mt-0.5">{p.brand}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-olive/50">{p.unit}</div>
                      <div className="text-xs text-olive/50">{mxn(p.costPerUnit)}</div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <button
                      onClick={() => { setRestockTarget(p); setRestockQty('') }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-moss/10 text-moss text-xs font-medium hover:bg-moss/20 transition-colors"
                    >
                      <PackagePlus size={12} />
                      Restock
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded hover:bg-olive/8 text-olive/40 hover:text-olive transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 rounded hover:bg-blossom/15 text-olive/30 hover:text-blossom-dark transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-olive/30 gap-2">
            <Package size={28} />
            <p className="text-sm italic">Sin productos registrados.</p>
            <button onClick={openNew} className="mt-1 text-xs text-blossom-dark hover:underline">
              Agregar el primero
            </button>
          </div>
        )}
      </div>

      {/* Modal: Crear / Editar producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-olive italic">
                {editing ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-olive/30 hover:text-olive/60 text-lg leading-none">✕</button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Nombre del producto</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Serum Vitamina C"
                  className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Marca (opcional)</label>
                  <input
                    value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    placeholder="Ej. Aspipro"
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Unidad</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                    Capacidad/envase ({form.unit})
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="any"
                    value={form.capacityPerUnit}
                    onChange={e => setForm(f => ({ ...f, capacityPerUnit: e.target.value }))}
                    placeholder="Ej. 120"
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">Costo por envase (MXN)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={form.costPerUnit}
                    onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value }))}
                    placeholder="Ej. 489"
                    className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
                  />
                </div>
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
                  {saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Agregar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restock */}
      {restockTarget && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-modal p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-xl text-olive italic">Reabastecer</h2>
              <button onClick={() => setRestockTarget(null)} className="text-olive/30 hover:text-olive/60 text-lg leading-none">✕</button>
            </div>
            <p className="text-sm text-olive/50 mb-4">
              {restockTarget.name}
              {restockTarget.brand && <span className="text-olive/30"> · {restockTarget.brand}</span>}
            </p>
            <div>
              <label className="text-[10px] text-olive/50 uppercase tracking-widest mb-1 block">
                Cantidad a agregar ({restockTarget.unit})
              </label>
              <input
                autoFocus
                type="number"
                min="0.01"
                step="any"
                value={restockQty}
                onChange={e => setRestockQty(e.target.value)}
                placeholder={`Ej. ${restockTarget.capacityPerUnit}`}
                className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setRestockTarget(null)}
                className="flex-1 border border-olive/20 text-olive text-sm py-2.5 rounded-lg hover:bg-olive/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestock}
                disabled={!restockQty || restocking}
                className="flex-1 bg-moss text-white text-sm py-2.5 rounded-lg hover:bg-moss/80 transition-colors disabled:opacity-50"
              >
                {restocking ? 'Guardando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
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
