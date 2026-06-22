'use client'
import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si ya hay sesión, redirigir directo
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/admin/dashboard')
    })
  }, [router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    console.log('signInData:', signInData)
    console.log('authError:', authError)

    if (authError) {
      setError(`${authError.message || authError.code || JSON.stringify(authError)}`)
      setLoading(false)
      return
    }

    router.replace('/admin/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#080808' }}>
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <Lock size={22} style={{ color: '#C9A84C' }} />
          </div>
          <h1 className="text-2xl font-light tracking-[0.3em] uppercase" style={{ color: '#F5F0E8' }}>
            Velvet
          </h1>
          <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: '#555' }}>
            Panel de administración
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="rounded-lg p-8 space-y-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
          {error && (
            <div className="px-4 py-3 rounded text-sm" style={{ background: '#2a0a0a', border: '1px solid #5a1a1a', color: '#f87171' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#C9A84C' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded text-sm outline-none transition-colors"
              style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#F5F0E8' }}
              placeholder="admin@ejemplo.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-medium mb-2" style={{ color: '#C9A84C' }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded text-sm outline-none transition-colors"
              style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#F5F0E8' }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded font-medium text-sm uppercase tracking-widest transition-opacity disabled:opacity-50 mt-2"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C86D)', color: '#000' }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: '#333' }}>
          El usuario admin se crea desde el panel de Supabase → Authentication → Users
        </p>
      </div>
    </div>
  )
}
