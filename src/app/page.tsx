import Header from '@/components/Header'
import CatalogClient from '@/components/CatalogClient'
import { mockPerfumes } from '@/lib/mock-data'
import { createClient } from '@supabase/supabase-js'
import { Perfume } from '@/types/perfume'

export const dynamic = 'force-dynamic'

async function fetchPerfumes(): Promise<Perfume[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('[catalog] url:', !!url, '| key:', !!key)
  if (!url || !key) {
    console.log('[catalog] → sin env vars, usando mock')
    return mockPerfumes
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('perfumes')
    .select('*, images:perfume_images(*)')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  console.log('[catalog] data:', data?.length, '| error:', error?.message)
  if (error || !data || data.length === 0) {
    console.log('[catalog] → fallback a mock')
    return mockPerfumes
  }
  return data
}

export default async function Home() {
  const perfumes = await fetchPerfumes()

  return (
    <div style={{ background: '#F8F7F4', minHeight: '100vh' }}>
      <Header />

      {/* Hero banner */}
      <section className="relative overflow-hidden" style={{ background: '#fff', borderBottom: '1px solid #EBEBEB' }}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C55)' }} />
            <span className="text-xs" style={{ color: '#C9A84C' }}>✦</span>
            <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(90deg, #C9A84C55, transparent)' }} />
          </div>

          <p className="text-[10px] tracking-[0.6em] uppercase mb-3" style={{ color: '#C9A84C' }}>
            Colección Exclusiva
          </p>

          <h2 className="text-3xl sm:text-4xl font-light leading-tight mb-3" style={{ color: '#1a1a1a', letterSpacing: '0.05em' }}>
            El arte de la fragancia
          </h2>

          <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: '#999' }}>
            Árabes, de diseñador y de nicho. Cada botella es una historia.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-10 mt-8">
            {[
              { value: `${perfumes.length}+`, label: 'Fragancias' },
              { value: '100%', label: 'Originales' },
              { value: '4', label: 'Categorías' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-semibold" style={{ color: '#C9A84C' }}>{value}</p>
                <p className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: '#bbb' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <CatalogClient perfumes={perfumes} />
      </section>

      {/* Footer */}
      <footer className="text-center py-8" style={{ borderTop: '1px solid #EBEBEB', background: '#fff' }}>
        <p className="text-[10px] tracking-widest uppercase" style={{ color: '#ccc' }}>
          © 2025 Essence Parfumerie · Fragancias 100% auténticas
        </p>
      </footer>
    </div>
  )
}
