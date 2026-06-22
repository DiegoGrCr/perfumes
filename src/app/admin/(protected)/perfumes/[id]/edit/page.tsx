'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'
import { getPerfumeById } from '@/lib/admin-api'
import { Perfume } from '@/types/perfume'
import { PerfumeForm } from '@/components/admin/PerfumeForm'

export default function EditPerfumePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [perfume, setPerfume] = useState<Perfume | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getPerfumeById(id).then(data => {
      if (!data) setNotFound(true)
      else setPerfume(data)
      setLoading(false)
    })
  }, [id])

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      <header style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <ShoppingBag size={18} style={{ color: '#C9A84C' }} />
          <span className="text-sm font-light tracking-[0.2em] uppercase" style={{ color: '#F5F0E8' }}>
            Velvet <span style={{ color: '#C9A84C' }}>Admin</span>
          </span>
          <span style={{ color: '#333' }}>/</span>
          <button onClick={() => router.push('/admin/dashboard')} className="text-sm hover:underline" style={{ color: '#666' }}>
            Catálogo
          </button>
          <span style={{ color: '#333' }}>/</span>
          <span className="text-sm" style={{ color: '#C9A84C' }}>Editar</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
          </div>
        )}
        {notFound && (
          <div className="text-center py-24" style={{ color: '#666' }}>Perfume no encontrado.</div>
        )}
        {perfume && <PerfumeForm initialData={perfume} />}
      </main>
    </div>
  )
}
