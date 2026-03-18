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
    <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-card p-8 w-full max-w-sm">
        <h1 className="font-display text-3xl text-olive italic text-center mb-2">Angelin</h1>
        <p className="text-sm text-olive/60 text-center mb-8">Panel de administración</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="email"
            type="email"
            placeholder="Correo"
            required
            className="border border-olive/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            required
            className="border border-olive/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blossom"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blossom text-white rounded-lg py-3 text-sm font-medium min-h-[44px] hover:bg-blossom/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Iniciando…' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
