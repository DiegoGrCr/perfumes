'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ShoppingBag } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { getAllPerfumesAdmin } from '@/lib/admin-api'
import { Perfume } from '@/types/perfume'
import { AdminPerfumeList } from '@/components/admin/AdminPerfumeList'

export default function DashboardPage() {
  const router = useRouter()
  const [perfumes, setPerfumes] = useState<Perfume[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      setUserEmail(data.session?.user.email ?? null)
      const perfumeData = await getAllPerfumesAdmin()
      setPerfumes(perfumeData)
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.replace('/admin/login')
  }

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      {/* Top bar */}
      <header style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} style={{ color: '#C9A84C' }} />
            <span className="text-sm font-light tracking-[0.2em] uppercase" style={{ color: '#F5F0E8' }}>
              Velvet <span style={{ color: '#C9A84C' }}>Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && <span className="text-xs" style={{ color: '#555' }}>{userEmail}</span>}
            <button onClick={() => router.push('/')} className="text-xs px-3 py-1.5 rounded transition-colors hover:opacity-80" style={{ color: '#C9A84C', border: '1px solid #2a2a2a' }}>
              Ver catálogo
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors hover:opacity-80" style={{ color: '#f87171', border: '1px solid #2a2a2a' }}>
              <LogOut size={12} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <AdminPerfumeList initialPerfumes={perfumes} />
        )}
      </main>
    </div>
  )
}
