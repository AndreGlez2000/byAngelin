'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    })
    if (result?.error) {
      setError('Credenciales incorrectas')
      setLoading(false)
    } else {
      router.push('/agenda')
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left brand panel */}
      <div className="w-2/5 bg-olive-dark flex flex-col items-center justify-center p-12 shrink-0">
        <div className="font-script text-8xl text-white/90 leading-none mb-4">Ae</div>
        <div className="font-display text-xl text-white/75 italic tracking-wide">Angelin Esthetician</div>
        <div className="text-white/35 text-xs mt-1 tracking-widest uppercase">Facial &amp; Skincare Studio</div>
        <div className="mt-12 text-white/25 text-xs text-center">
          Sistema de administración privada
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-parchment flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-sm">
          <h1 className="font-display text-2xl text-olive italic mb-1">Bienvenida de vuelta</h1>
          <p className="text-xs text-olive/50 mb-6">Ingresa tu cuenta de administradora</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] text-olive/50 mb-1.5 block uppercase tracking-widest">
                Correo Electrónico
              </label>
              <input
                name="email"
                type="text"
                placeholder="correo@angelin.com"
                required
                className="w-full border border-olive/20 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
              />
            </div>
            <div>
              <label className="text-[10px] text-olive/50 mb-1.5 block uppercase tracking-widest">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="w-full border border-olive/20 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-blossom-dark text-white rounded-lg py-3 text-sm font-medium mt-1 hover:bg-blossom transition-colors disabled:opacity-50"
            >
              {loading ? 'Iniciando…' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
