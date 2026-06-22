'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { SlidersHorizontal, X, ArrowUpDown, Sparkles, Loader2 } from 'lucide-react'
import { Perfume, FilterState, SortOption } from '@/types/perfume'
import PerfumeCard from './PerfumeCard'
import FilterSidebar from './FilterSidebar'

interface Props {
  perfumes: Perfume[]
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Destacados' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_asc', label: 'Nombre A-Z' },
]

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  genders: [],
  minPrice: 0,
  maxPrice: 5000,
  search: '',
  inStockOnly: false,
  sortBy: 'featured',
}

const PAGE_SIZE = 10

export default function CatalogClient({ perfumes }: Props) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    let list = [...perfumes]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
    }

    if (filters.categories.length > 0) {
      list = list.filter((p) => filters.categories.includes(p.category))
    }

    if (filters.genders.length > 0) {
      list = list.filter((p) => filters.genders.includes(p.gender))
    }

    list = list.filter((p) => p.price >= filters.minPrice && p.price <= filters.maxPrice)

    if (filters.inStockOnly) {
      list = list.filter((p) => p.in_stock)
    }

    switch (filters.sortBy) {
      case 'price_asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'name_asc':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'featured':
      default:
        list.sort((a, b) => Number(b.featured) - Number(a.featured))
        break
    }

    return list
  }, [perfumes, filters])

  // Reiniciar al cambiar filtros
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [filters])

  // Infinite scroll: cargar más cuando el sentinel entra en pantalla
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisibleCount(c => c + PAGE_SIZE) },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [filtered.length])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const activeFilterCount =
    filters.categories.length +
    filters.genders.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.search ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 500 ? 1 : 0)

  return (
    <div className="flex gap-0 min-h-screen">
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside
        className="hidden lg:block w-64 xl:w-72 shrink-0 pt-8 pr-8"
        style={{
          borderRight: '1px solid #EBEBEB',
          position: 'sticky',
          top: '80px',
          height: 'calc(100vh - 80px)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          totalCount={perfumes.length}
          filteredCount={filtered.length}
        />
      </aside>

      {/* ── Mobile Filter Modal ──────────────────────────── */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowMobileFilters(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-full overflow-y-auto p-6" style={{ background: '#fff', borderRight: '1px solid #EBEBEB' }}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm tracking-widest uppercase font-medium" style={{ color: '#1a1a1a' }}>Filtros</span>
              <button onClick={() => setShowMobileFilters(false)} style={{ color: '#bbb' }}><X size={18} /></button>
            </div>
            <FilterSidebar filters={filters} onChange={setFilters} totalCount={perfumes.length} filteredCount={filtered.length} />
            <button
              onClick={() => setShowMobileFilters(false)}
              className="mt-6 w-full py-3 rounded-full text-xs tracking-widest uppercase font-semibold"
              style={{ background: '#C9A84C', color: '#fff' }}
            >
              Ver {filtered.length} resultados
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 min-w-0 py-8 lg:pl-8">
        {/* Catalog header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-light" style={{ color: '#1a1a1a', letterSpacing: '0.03em' }}>
              Catálogo de Fragancias
            </h1>
            <p className="text-xs tracking-widest mt-1" style={{ color: '#bbb' }}>
              {filtered.length} {filtered.length === 1 ? 'fragancia' : 'fragancias'} encontradas
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-full text-xs tracking-widest uppercase transition-all duration-200"
              style={{
                border: `1px solid ${activeFilterCount > 0 ? '#C9A84C' : '#E5E5E5'}`,
                color: activeFilterCount > 0 ? '#C9A84C' : '#888',
                background: '#fff',
              }}
            >
              <SlidersHorizontal size={12} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#C9A84C', color: '#fff' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ border: '1px solid #E5E5E5', background: '#fff' }}>
              <ArrowUpDown size={11} style={{ color: '#ccc' }} />
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as SortOption })}
                className="text-xs tracking-wider uppercase appearance-none bg-transparent pr-2 cursor-pointer"
                style={{ color: '#888', outline: 'none', border: 'none' }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: '#fff', color: '#1a1a1a' }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilters({ ...filters, categories: filters.categories.filter((c) => c !== cat) })}
                className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full transition-all duration-200"
                style={{ background: '#FBF6EC', border: '1px solid #E8D9A8', color: '#C9A84C' }}
              >
                {cat === 'arabe' ? 'Árabe' : cat === 'disenador' ? 'Diseñador' : cat === 'nicho' ? 'Nicho' : 'Otros'}
                <X size={8} />
              </button>
            ))}
            {filters.genders.map((g) => (
              <button
                key={g}
                onClick={() => setFilters({ ...filters, genders: filters.genders.filter((x) => x !== g) })}
                className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full transition-all duration-200"
                style={{ background: '#FBF6EC', border: '1px solid #E8D9A8', color: '#C9A84C' }}
              >
                {g}
                <X size={8} />
              </button>
            ))}
            {(filters.minPrice > 0 || filters.maxPrice < 500) && (
              <button
                onClick={() => setFilters({ ...filters, minPrice: 0, maxPrice: 500 })}
                className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full"
                style={{ background: '#FBF6EC', border: '1px solid #E8D9A8', color: '#C9A84C' }}
              >
                ${filters.minPrice}–${filters.maxPrice}
                <X size={8} />
              </button>
            )}
            {filters.inStockOnly && (
              <button
                onClick={() => setFilters({ ...filters, inStockOnly: false })}
                className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full"
                style={{ background: '#FBF6EC', border: '1px solid #E8D9A8', color: '#C9A84C' }}
              >
                En stock
                <X size={8} />
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {visible.map((p) => (
                <PerfumeCard key={p.id} perfume={p} />
              ))}
            </div>
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-10">
                <Loader2 size={20} className="animate-spin" style={{ color: '#C9A84C' }} />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#F5F5F5' }}>
              <Sparkles size={24} style={{ color: '#ccc' }} />
            </div>
            <p className="text-sm tracking-widest uppercase" style={{ color: '#aaa' }}>Sin resultados</p>
            <p className="text-xs" style={{ color: '#ccc' }}>Intenta con otros filtros</p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-2 text-xs tracking-widest uppercase px-6 py-2 rounded-full transition-all duration-200"
              style={{ border: '1px solid #C9A84C', color: '#C9A84C' }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
