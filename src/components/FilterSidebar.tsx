'use client'

import { Search, X, SlidersHorizontal } from 'lucide-react'
import { FilterState, Category, Gender, CATEGORY_LABELS, GENDER_LABELS } from '@/types/perfume'

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
  totalCount: number
  filteredCount: number
}

const CATEGORIES: Category[] = ['arabe', 'disenador', 'nicho', 'otros']
const GENDERS: Gender[]      = ['hombre', 'mujer', 'unisex']

const CATEGORY_ICONS: Record<Category, string> = {
  arabe: '☽', disenador: '◆', nicho: '◈', otros: '○',
}

const DIVIDER = <div className="h-px" style={{ background: '#F0F0EE' }} />

export default function FilterSidebar({ filters, onChange, totalCount, filteredCount }: Props) {
  const activeCount =
    filters.categories.length +
    filters.genders.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.search ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 5000 ? 1 : 0)

  const toggleCategory = (cat: Category) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat]
    onChange({ ...filters, categories: next })
  }

  const toggleGender = (g: Gender) => {
    const next = filters.genders.includes(g)
      ? filters.genders.filter(x => x !== g)
      : [...filters.genders, g]
    onChange({ ...filters, genders: next })
  }

  const clearAll = () =>
    onChange({ categories: [], genders: [], minPrice: 0, maxPrice: 5000, search: '', inStockOnly: false, sortBy: filters.sortBy })

  const label = (text: string) => (
    <span className="text-[10px] tracking-[0.35em] uppercase font-medium" style={{ color: '#aaa' }}>{text}</span>
  )

  return (
    <aside className="flex flex-col gap-5 w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} style={{ color: '#C9A84C' }} />
          <span className="text-xs tracking-widest uppercase font-medium" style={{ color: '#1a1a1a' }}>Filtros</span>
          {activeCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#C9A84C', color: '#fff' }}>
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-[10px] tracking-widest uppercase flex items-center gap-1 transition-colors"
            style={{ color: '#ccc' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#ccc' }}>
            <X size={10} /> Limpiar
          </button>
        )}
      </div>

      {/* Result count */}
      <div className="text-[10px] tracking-widest text-center py-2 rounded-full" style={{ background: '#F5F5F3', color: '#aaa' }}>
        <span style={{ color: '#C9A84C', fontWeight: 600 }}>{filteredCount}</span> de {totalCount} fragancias
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2">
        {label('Buscar')}
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#ccc' }} />
          <input
            type="text"
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            placeholder="Nombre, marca…"
            className="w-full pl-8 pr-8 py-2.5 rounded-full text-sm transition-all"
            style={{ background: '#F5F5F3', border: '1px solid #EBEBEB', color: '#1a1a1a', fontSize: '12px' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#C9A84C' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#EBEBEB' }}
          />
          {filters.search && (
            <button onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#ccc' }}>
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {DIVIDER}

      {/* Categories */}
      <div className="flex flex-col gap-2.5">
        {label('Categoría')}
        <div className="flex flex-col gap-1">
          {CATEGORIES.map(cat => {
            const active = filters.categories.includes(cat)
            return (
              <button key={cat} onClick={() => toggleCategory(cat)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                style={{
                  background: active ? '#FBF6EC' : 'transparent',
                  border: `1px solid ${active ? '#E8D9A8' : 'transparent'}`,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F8F8F6' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: active ? '#C9A84C' : '#ccc', fontSize: 13 }}>{CATEGORY_ICONS[cat]}</span>
                <span className="text-xs tracking-wider flex-1" style={{ color: active ? '#C9A84C' : '#888' }}>
                  {CATEGORY_LABELS[cat]}
                </span>
                <div className="w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all"
                  style={{ background: active ? '#C9A84C' : 'transparent', borderColor: active ? '#C9A84C' : '#DDD' }}>
                  {active && <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {DIVIDER}

      {/* Gender */}
      <div className="flex flex-col gap-2.5">
        {label('Para')}
        <div className="grid grid-cols-3 gap-1.5">
          {GENDERS.map(g => {
            const active = filters.genders.includes(g)
            return (
              <button key={g} onClick={() => toggleGender(g)}
                className="py-2 rounded-full text-[10px] tracking-wider uppercase font-medium transition-all"
                style={{
                  background: active ? '#C9A84C' : '#F5F5F3',
                  color: active ? '#fff' : '#888',
                  border: `1px solid ${active ? '#C9A84C' : '#EBEBEB'}`,
                }}>
                {GENDER_LABELS[g]}
              </button>
            )
          })}
        </div>
      </div>

      {DIVIDER}

      {/* Price */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          {label('Precio')}
          <span className="text-[10px] font-medium" style={{ color: '#C9A84C' }}>
            ${filters.minPrice} – ${filters.maxPrice >= 5000 ? '5000+' : filters.maxPrice}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <input type="range" min={0} max={5000} step={10} value={filters.minPrice}
            onChange={e => onChange({ ...filters, minPrice: Number(e.target.value) })}
            className="w-full" style={{ accentColor: '#C9A84C' }} />
          <input type="range" min={0} max={5000} step={10} value={filters.maxPrice}
            onChange={e => onChange({ ...filters, maxPrice: Number(e.target.value) })}
            className="w-full" style={{ accentColor: '#C9A84C' }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '< $50', min: 0, max: 50 },
            { label: '$50–$150', min: 50, max: 150 },
            { label: '$150–$500', min: 150, max: 500 },
            { label: '$500+', min: 500, max: 5000 },
          ].map(({ label: l, min, max }) => (
            <button key={l} onClick={() => onChange({ ...filters, minPrice: min, maxPrice: max })}
              className="text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-full transition-all"
              style={{ border: '1px solid #EBEBEB', color: '#888', background: '#F5F5F3' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#EBEBEB'; e.currentTarget.style.color = '#888' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {DIVIDER}

      {/* In stock */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          className="relative w-9 h-5 rounded-full transition-all"
          onClick={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
          style={{ background: filters.inStockOnly ? '#C9A84C' : '#E5E5E5' }}
        >
          <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
            style={{ background: '#fff', left: filters.inStockOnly ? '18px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
        <span className="text-xs tracking-wider" style={{ color: '#888' }}>Solo disponibles</span>
      </label>

    </aside>
  )
}
