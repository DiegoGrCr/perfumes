'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ShoppingBag, LayoutList, PlusCircle, BarChart2, Boxes, TrendingUp, DollarSign } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { getAllPerfumesAdmin, getAllSales } from '@/lib/admin-api'
import { Perfume, Sale } from '@/types/perfume'
import { AdminPerfumeList } from '@/components/admin/AdminPerfumeList'
import { SaleForm } from '@/components/admin/SaleForm'
import { SalesHistory } from '@/components/admin/SalesHistory'

function InventorySummary({ perfumes }: { perfumes: Perfume[] }) {
  const withData = perfumes.filter(p => p.cost_price != null && (p.stock_quantity ?? 0) > 0)

  const totalUnits    = perfumes.reduce((s, p) => s + (p.stock_quantity ?? 0), 0)
  const totalInvested = withData.reduce((s, p) => s + p.cost_price! * p.stock_quantity!, 0)
  const potentialRevenue = withData.reduce((s, p) => s + p.price * p.stock_quantity!, 0)
  const potentialProfit  = potentialRevenue - totalInvested

  if (totalUnits === 0 && withData.length === 0) return null

  const card = (color: string) => ({
    background: '#111',
    border: '1px solid #1e1e1e',
    borderLeft: `3px solid ${color}`,
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="rounded-lg px-5 py-4 flex items-center gap-4" style={card('#C9A84C')}>
        <Boxes size={20} style={{ color: '#C9A84C' }} />
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#555' }}>Unidades en inventario</p>
          <p className="text-xl font-light" style={{ color: '#F5F0E8' }}>{totalUnits}</p>
          <p className="text-[10px] hidden sm:block" style={{ color: '#444' }}>{withData.length} productos con costo registrado</p>
        </div>
      </div>
      <div className="rounded-lg px-5 py-4 flex items-center gap-4" style={card('#f87171')}>
        <DollarSign size={20} style={{ color: '#f87171' }} />
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#555' }}>Inversión actual</p>
          <p className="text-xl font-light" style={{ color: '#F5F0E8' }}>${totalInvested.toFixed(2)}</p>
          <p className="text-[10px] hidden sm:block" style={{ color: '#444' }}>Costo × unidades en stock</p>
        </div>
      </div>
      <div className="rounded-lg px-5 py-4 flex items-center gap-4" style={card('#4CAF50')}>
        <TrendingUp size={20} style={{ color: '#4CAF50' }} />
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#555' }}>Ganancia potencial</p>
          <p className="text-xl font-light" style={{ color: potentialProfit >= 0 ? '#4CAF50' : '#f87171' }}>
            ${potentialProfit.toFixed(2)}
          </p>
          <p className="text-[10px] hidden sm:block" style={{ color: '#444' }}>Si se vende todo al precio actual</p>
        </div>
      </div>
    </div>
  )
}

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} style={{ color: '#C9A84C' }} />
            <span className="text-sm font-light tracking-[0.2em] uppercase" style={{ color: '#F5F0E8' }}>
              Velvet <span style={{ color: '#C9A84C' }}>Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {userEmail && (
              <span className="hidden sm:block text-xs truncate max-w-[140px]" style={{ color: '#555' }}>{userEmail}</span>
            )}
            <button onClick={() => router.push('/')}
              className="hidden sm:block text-xs px-3 py-1.5 rounded transition-colors hover:opacity-80"
              style={{ color: '#C9A84C', border: '1px solid #2a2a2a' }}>
              Ver catálogo
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors hover:opacity-80"
              style={{ color: '#f87171', border: '1px solid #2a2a2a' }}>
              <LogOut size={12} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Tabs — scrollable en móvil */}
        <div className="max-w-7xl mx-auto px-2 sm:px-6 flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-3 text-xs font-medium uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <>
            {tab === 'catalogo' && (
              <>
                <InventorySummary perfumes={perfumes} />
                <AdminPerfumeList initialPerfumes={perfumes} />
              </>
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
