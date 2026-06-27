'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ShoppingBag, LayoutList, PlusCircle, BarChart2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { getAllPerfumesAdmin, getAllSales } from '@/lib/admin-api'
import { Perfume, Sale } from '@/types/perfume'
import { AdminPerfumeList } from '@/components/admin/AdminPerfumeList'
import { SaleForm } from '@/components/admin/SaleForm'
import { SalesHistory } from '@/components/admin/SalesHistory'

type Tab = 'catalogo' | 'nueva-venta' | 'historial'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'catalogo',    label: 'Catálogo',     icon: <LayoutList size={14} /> },
  { id: 'nueva-venta', label: 'Nueva Venta',  icon: <PlusCircle size={14} /> },
  { id: 'historial',   label: 'Ventas',       icon: <BarChart2  size={14} /> },
]

export default function DashboardPage() {
  const router = useRouter()
  const [tab,      setTab]      = useState<Tab>('catalogo')
  const [perfumes, setPerfumes] = useState<Perfume[]>([])
  const [sales,    setSales]    = useState<Sale[]>([])
  const [loading,  setLoading]  = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    setUserEmail(data.session?.user.email ?? null)
    const [perfumeData, salesData] = await Promise.all([
      getAllPerfumesAdmin(),
      getAllSales(),
    ])
    setPerfumes(perfumeData)
    setSales(salesData)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.replace('/admin/login')
  }

  // Refresca ventas después de registrar una nueva
  async function handleSaleCreated() {
    const fresh = await getAllSales()
    setSales(fresh)
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
            <button onClick={() => router.push('/')}
              className="text-xs px-3 py-1.5 rounded transition-colors hover:opacity-80"
              style={{ color: '#C9A84C', border: '1px solid #2a2a2a' }}>
              Ver catálogo
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors hover:opacity-80"
              style={{ color: '#f87171', border: '1px solid #2a2a2a' }}>
              <LogOut size={12} />
              Salir
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-3 text-xs font-medium uppercase tracking-widest transition-all"
              style={{
                color: tab === t.id ? '#C9A84C' : '#444',
                borderBottom: tab === t.id ? '2px solid #C9A84C' : '2px solid transparent',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <>
            {tab === 'catalogo' && (
              <AdminPerfumeList initialPerfumes={perfumes} />
            )}

            {tab === 'nueva-venta' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-light tracking-widest" style={{ color: '#F5F0E8' }}>
                    Registrar Venta
                  </h1>
                  <p className="text-sm mt-1" style={{ color: '#666' }}>
                    Busca el perfume, ajusta el costo y el precio, y guarda la venta.
                  </p>
                </div>
                <SaleForm perfumes={perfumes} onSaved={handleSaleCreated} />
              </div>
            )}

            {tab === 'historial' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-light tracking-widest" style={{ color: '#F5F0E8' }}>
                    Historial de Ventas
                  </h1>
                  <p className="text-sm mt-1" style={{ color: '#666' }}>
                    {sales.length} venta{sales.length !== 1 ? 's' : ''} registrada{sales.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <SalesHistory initialSales={sales} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
