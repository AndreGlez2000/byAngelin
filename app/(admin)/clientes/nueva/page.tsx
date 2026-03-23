'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type SkinForm = {
  fecha: string; edad: string; fototipo: string; biotipo: string
  sensibilidad: string; hidratacion: string; grosorPiel: string
  alteracionesCutaneas: string; elasticidad: string; resistencias: string
  pigmentaciones: string; vitalidadOxigenacion: string; habitos: string
  embarazo: string; exposicionSolar: string; deporte: string
  enfermedades: string; medicamentos: string; apoyoEnCasa: string; comentarios: string
}

const FOTOTIPO_OPTIONS = ['Tipo I - Muy clara', 'Tipo II - Clara', 'Tipo III - Media', 'Tipo IV - Morena clara', 'Tipo V - Morena', 'Tipo VI - Muy morena']
const BIOTIPO_OPTIONS = ['Normal', 'Seca', 'Grasa', 'Mixta', 'Sensible']
const SENSIBILIDAD_OPTIONS = ['Nula', 'Leve', 'Moderada', 'Alta']
const HIDRATACION_OPTIONS = ['Bien hidratada', 'Deshidratada', 'Muy deshidratada']
const GROSOR_OPTIONS = ['Fina', 'Media', 'Gruesa']
const ELASTICIDAD_OPTIONS = ['Buena', 'Normal', 'Reducida']
const EMBARAZO_OPTIONS = ['No', 'Sí', 'Lactancia']
const EXPOSICION_OPTIONS = ['Baja', 'Media', 'Alta']
const APOYO_OPTIONS = ['Baja', 'Media', 'Alta']

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Select({ name: _name, label, options, value, onChange, required }: {
  name: string; label: string; options: string[]
  value: string; onChange: (v: string) => void; required?: boolean
}) {
  return (
    <div>
      <label className="text-[10px] text-olive/70 uppercase tracking-widest mb-1 block">{label}</label>
      <select
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blossom"
      >
        <option value="">— Seleccionar —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="text-[10px] text-olive/70 uppercase tracking-widest mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blossom"
      />
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="text-[10px] text-olive/70 uppercase tracking-widest mb-1 block">{label}</label>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="w-full border border-olive/20 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blossom resize-none"
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-blossom-dark rounded-full" />
        <h2 className="text-xs font-semibold text-olive/80 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

export default function NuevaClientaPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [skin, setSkin] = useState<SkinForm>({
    fecha: new Date().toISOString().split('T')[0],
    edad: '', fototipo: '', biotipo: '', sensibilidad: '', hidratacion: '',
    grosorPiel: '', alteracionesCutaneas: '', elasticidad: '', resistencias: '',
    pigmentaciones: '', vitalidadOxigenacion: '', habitos: '', embarazo: '',
    exposicionSolar: '', deporte: '', enfermedades: '', medicamentos: '',
    apoyoEnCasa: '', comentarios: '',
  })
  const [saving, setSaving] = useState(false)

  const s = (key: keyof SkinForm) => (v: string) => setSkin(prev => ({ ...prev, [key]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, phone, email: email || null,
        skinProfile: skin.fototipo || skin.biotipo ? skin : null,
      }),
    })
    if (res.ok) {
      const client = await res.json()
      router.push(`/clientes/${client.id}`)
    } else {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-olive/10 bg-parchment flex items-center justify-between shrink-0">
        <div>
          <nav className="text-xs text-olive/40 mb-1">
            <Link href="/clientes" className="hover:text-olive">Clientas</Link>
            <span className="mx-1.5">/</span>
            <span className="text-olive/60">Nueva Clienta</span>
          </nav>
          <h1 className="font-display text-2xl text-olive italic font-bold">Nueva Clienta</h1>
          <p className="text-xs text-olive/40 mt-0.5">Completa la ficha de piel para registrar a la nueva clienta.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/clientes"
            className="border border-olive/20 text-olive text-sm px-4 py-2 rounded-lg hover:bg-white/60 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            form="nueva-clienta-form"
            disabled={saving}
            className="flex items-center gap-1.5 bg-blossom-dark text-white text-sm px-4 py-2 rounded-lg hover:bg-blossom transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar Clienta'}
          </button>
        </div>
      </div>

      {/* Form */}
      <form id="nueva-clienta-form" onSubmit={handleSubmit} className="flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6">
        <div className="max-w-3xl space-y-8">
          {/* Datos de identificación */}
          <Section title="Datos de Identificación">
            <Input label="Fecha" type="date" value={skin.fecha} onChange={s('fecha')} />
            <div className="col-span-1 md:col-span-2">
              <Input label="Nombre Completo" placeholder="Nombre completo de la clienta" value={name} onChange={setName} />
            </div>
            <div style={{ display: 'none' }}>
              {/* hidden col spacer - edad below */}
            </div>
            <Input label="Edad" type="number" placeholder="Ej. 24" value={skin.edad} onChange={s('edad')} />
            <Input label="Teléfono" type="tel" placeholder="Número de teléfono" value={phone} onChange={setPhone} />
            <Input label="Correo Electrónico (opcional)" type="email" placeholder="correo@ejemplo.com" value={email} onChange={setEmail} />
          </Section>

          {/* Análisis de piel */}
          <Section title="Análisis de Piel">
            <Select label="Fototipo" name="fototipo" options={FOTOTIPO_OPTIONS} value={skin.fototipo} onChange={s('fototipo')} />
            <Select label="Biotipo" name="biotipo" options={BIOTIPO_OPTIONS} value={skin.biotipo} onChange={s('biotipo')} />
            <Select label="Sensibilidad" name="sensibilidad" options={SENSIBILIDAD_OPTIONS} value={skin.sensibilidad} onChange={s('sensibilidad')} />
            <Select label="Hidratación" name="hidratacion" options={HIDRATACION_OPTIONS} value={skin.hidratacion} onChange={s('hidratacion')} />
            <Select label="Grosor de Piel" name="grosorPiel" options={GROSOR_OPTIONS} value={skin.grosorPiel} onChange={s('grosorPiel')} />
            <Input label="Alteraciones Cutáneas" value={skin.alteracionesCutaneas} onChange={s('alteracionesCutaneas')} />
            <Select label="Elasticidad" name="elasticidad" options={ELASTICIDAD_OPTIONS} value={skin.elasticidad} onChange={s('elasticidad')} />
            <Input label="Resistencias" value={skin.resistencias} onChange={s('resistencias')} />
            <Input label="Pigmentaciones" value={skin.pigmentaciones} onChange={s('pigmentaciones')} />
            <Input label="Vitalidad / Oxigenación" value={skin.vitalidadOxigenacion} onChange={s('vitalidadOxigenacion')} />
          </Section>

          {/* Estilo de vida */}
          <Section title="Estilo de Vida">
            <Input label="Hábitos" value={skin.habitos} onChange={s('habitos')} />
            <Select label="Embarazo" name="embarazo" options={EMBARAZO_OPTIONS} value={skin.embarazo} onChange={s('embarazo')} />
            <Select label="Apoyo en Casa" name="apoyoEnCasa" options={APOYO_OPTIONS} value={skin.apoyoEnCasa} onChange={s('apoyoEnCasa')} />
            <Select label="Exposición Solar" name="exposicionSolar" options={EXPOSICION_OPTIONS} value={skin.exposicionSolar} onChange={s('exposicionSolar')} />
          </Section>

          {/* Historia médica */}
          <Section title="Historia Médica">
            <div className="col-span-1 md:col-span-2">
              <Textarea label="Enfermedades" value={skin.enfermedades} onChange={s('enfermedades')} placeholder="Enfermedades relevantes…" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Textarea label="Medicamentos" value={skin.medicamentos} onChange={s('medicamentos')} placeholder="Medicamentos actuales…" />
            </div>
          </Section>

          {/* Deporte */}
          <Section title="Deporte / Actividad Física">
            <div className="col-span-1 md:col-span-2">
              <Input label="Actividad física" value={skin.deporte} onChange={s('deporte')} placeholder="Tipo y frecuencia de ejercicio…" />
            </div>
          </Section>

          {/* Comentarios */}
          <Section title="Comentarios Adicionales">
            <div className="col-span-1 md:col-span-2">
              <Textarea
                label="Comentarios"
                value={skin.comentarios}
                onChange={s('comentarios')}
                placeholder="Observaciones generales, notas adicionales…"
              />
            </div>
          </Section>
        </div>
      </form>
    </div>
  )
}
