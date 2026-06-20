'use client'
import { ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PerfumeForm } from '@/components/admin/PerfumeForm'

export default function NewPerfumePage() {
  const router = useRouter()
  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      <header style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <ShoppingBag size={18} style={{ color: '#C9A84C' }} />
          <span className="text-sm font-light tracking-[0.2em] uppercase" style={{ color: '#F5F0E8' }}>
            Essence <span style={{ color: '#C9A84C' }}>Admin</span>
          </span>
          <span style={{ color: '#333' }}>/</span>
          <button onClick={() => router.push('/admin/dashboard')} className="text-sm hover:underline" style={{ color: '#666' }}>
            Catálogo
          </button>
          <span style={{ color: '#333' }}>/</span>
          <span className="text-sm" style={{ color: '#C9A84C' }}>Nuevo</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <PerfumeForm />
      </main>
    </div>
  )
}
