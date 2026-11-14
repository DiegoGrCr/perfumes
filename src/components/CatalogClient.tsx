'use client'

import { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react'
import { SlidersHorizontal, X, Search, ChevronDown, MessageCircle } from 'lucide-react'
import { Perfume, FilterState, SortOption, Category, Gender, CATEGORY_LABELS, GENDER_LABELS } from '@/types/perfume'
import { byAvailability, discountPct, formatPrice, waLink } from '@/lib/brand'
import { searchPerfumes, notFoundWhatsAppText } from '@/lib/search'
import { APPLY_SEARCH_EVENT } from './SearchOverlay'
import { useLivePerfumes } from '@/context/AdminContext'
import PerfumeCard from './PerfumeCard'
import FilterSidebar, { FilterOptions } from './FilterSidebar'
import Reveal from './ui/Reveal'

interface Props {
  perfumes: Perfume[]
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured',   label: 'Recomendados' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name_asc',   label: 'Nombre A–Z' },
]

const PAGE_SIZE = 24
const CATEGORY_ORDER: Category[] = ['arabe', 'disenador', 'otros']
const GENDER_ORDER: Gender[] = ['hombre', 'mujer', 'unisex']

function countBy<T extends string>(values: (T | undefined | null)[]): [T, number][] {
  const m = new Map<T, number>()
  values.forEach(v => { if (v) m.set(v, (m.get(v) ?? 0) + 1) })
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

const stockFirst = (a: Perfume, b: Perfume) => Number(b.in_stock) - Number(a.in_stock)


export default function CatalogClient({ perfumes: serverPerfumes }: Props) {
  // Admin edits show up immediately, before the server cache refreshes
  const perfumes = useLivePerfumes(serverPerfumes)
  const priceCeil = useMemo(() => {
    const max = Math.max(0, ...perfumes.map(p => p.price))
    return Math.max(500, Math.ceil(max / 500) * 500)
  }, [perfumes])

  const defaults = useMemo<FilterState>(() => ({
    categories: [], genders: [], scentTypes: [], seasons: [],
    minPrice: 0, maxPrice: priceCeil, search: '', inStockOnly: false, onSaleOnly: false, sortBy: 'featured',
  }), [priceCeil])

  const [filters, setFilters] = useState<FilterState>(defaults)
  const [sheetOpen, setSheetOpen] = useState(false)
  // Page size resets automatically whenever the filters object changes
  const [pager, setPager] = useState<{ key: FilterState | null; n: number }>({ key: null, n: PAGE_SIZE })
  const topRef = useRef<HTMLDivElement>(null)
  const search = useDeferredValue(filters.search)

  const options = useMemo<FilterOptions>(() => ({
    genders: GENDER_ORDER
      .map(g => [g, perfumes.filter(p => p.gender === g).length] as [Gender, number])
      .filter(([, n]) => n > 0),
    scentTypes: countBy(perfumes.map(p => p.scent_type)),
    seasons: countBy(perfumes.flatMap(p => p.seasons ?? [])),
    priceCeil,
    saleCount: perfumes.filter(p => discountPct(p)).length,
  }), [perfumes, priceCeil])

  const categoryCounts = useMemo(
    () => CATEGORY_ORDER
      .map(c => [c, perfumes.filter(p => p.category === c).length] as [Category, number])
      .filter(([, n]) => n > 0),
    [perfumes],
  )

  // Families tiles on the home page talk to us through this event
  useEffect(() => {
    const onFilter = (e: Event) => {
      const { category } = (e as CustomEvent<{ category: Category }>).detail
      setFilters(f => ({ ...f, categories: [category] }))
    }
    window.addEventListener('velvet:filter', onFilter)
    return () => window.removeEventListener('velvet:filter', onFilter)
  }, [])

  // Global search overlay → catalog: via event (already on home) or ?q= (coming from another page)
  useEffect(() => {
    const apply = (q: string) => setFilters(f => ({ ...f, search: q }))
    const fromUrl = new URLSearchParams(window.location.search).get('q')
    if (fromUrl) {
      apply(fromUrl)
      // clean the URL but keep the #coleccion anchor
      window.history.replaceState(null, '', `/${window.location.hash}`)
      requestAnimationFrame(() => document.getElementById('coleccion')?.scrollIntoView())
    }
    const onApply = (e: Event) => apply((e as CustomEvent<{ q: string }>).detail.q)
    window.addEventListener(APPLY_SEARCH_EVENT, onApply)
    return () => window.removeEventListener(APPLY_SEARCH_EVENT, onApply)
  }, [])

  useEffect(() => {
    if (!sheetOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [sheetOpen])

  const filtered = useMemo(() => {
    let list = [...perfumes]
    // Same typo-tolerant engine as the global search; keeps relevance order
    const ranked = search.trim() ? (searchPerfumes(perfumes, search).items as Perfume[]) : null
    if (ranked) list = ranked
    if (filters.categories.length) list = list.filter(p => filters.categories.includes(p.category))
    if (filters.genders.length)    list = list.filter(p => filters.genders.includes(p.gender))
    list = list.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice)
    if (filters.inStockOnly)       list = list.filter(p => p.in_stock)
    if (filters.onSaleOnly)        list = list.filter(p => discountPct(p))
    if (filters.scentTypes.length) list = list.filter(p => p.scent_type && filters.scentTypes.includes(p.scent_type))
    if (filters.seasons.length)    list = list.filter(p => p.seasons?.some(s => filters.seasons.includes(s)))

    switch (filters.sortBy) {
      // In-stock always leads; the chosen order applies inside each group
      case 'price_asc':  list.sort((a, b) => stockFirst(a, b) || a.price - b.price); break
      case 'price_desc': list.sort((a, b) => stockFirst(a, b) || b.price - a.price); break
      case 'name_asc':   list.sort((a, b) => stockFirst(a, b) || a.name.localeCompare(b.name)); break
      default:
        // while searching, "Recomendados" means most relevant first
        if (!ranked) list.sort(byAvailability)
    }
    return list
  }, [perfumes, filters, search])

  const visible = pager.key === filters ? pager.n : PAGE_SIZE

  const priceActive = filters.minPrice > 0 || filters.maxPrice < priceCeil
  const panelCount =
    filters.genders.length + filters.scentTypes.length + filters.seasons.length +
    (filters.inStockOnly ? 1 : 0) + (filters.onSaleOnly ? 1 : 0) + (priceActive ? 1 : 0)
  const anyActive = panelCount + filters.categories.length + (filters.search ? 1 : 0) > 0

  const chips: { key: string; label: string; clear: () => void }[] = [
    ...filters.categories.map(c => ({ key: `c-${c}`, label: CATEGORY_LABELS[c], clear: () => setFilters(f => ({ ...f, categories: f.categories.filter(x => x !== c) })) })),
    ...filters.genders.map(g => ({ key: `g-${g}`, label: GENDER_LABELS[g], clear: () => setFilters(f => ({ ...f, genders: f.genders.filter(x => x !== g) })) })),
    ...filters.scentTypes.map(s => ({ key: `s-${s}`, label: s, clear: () => setFilters(f => ({ ...f, scentTypes: f.scentTypes.filter(x => x !== s) })) })),
    ...filters.seasons.map(s => ({ key: `t-${s}`, label: s, clear: () => setFilters(f => ({ ...f, seasons: f.seasons.filter(x => x !== s) })) })),
    ...(priceActive ? [{ key: 'price', label: `${formatPrice(filters.minPrice)} – ${formatPrice(filters.maxPrice)}`, clear: () => setFilters(f => ({ ...f, minPrice: 0, maxPrice: priceCeil })) }] : []),
    ...(filters.inStockOnly ? [{ key: 'stock', label: 'En existencia', clear: () => setFilters(f => ({ ...f, inStockOnly: false })) }] : []),
    ...(filters.onSaleOnly ? [{ key: 'sale', label: 'En oferta', clear: () => setFilters(f => ({ ...f, onSaleOnly: false })) }] : []),
    ...(filters.search ? [{ key: 'q', label: `“${filters.search}”`, clear: () => setFilters(f => ({ ...f, search: '' })) }] : []),
  ]

  const clearAll = () => setFilters(f => ({ ...defaults, sortBy: f.sortBy }))
  const setCategory = (c: Category | null) => setFilters(f => ({ ...f, categories: c ? [c] : [] }))
  const shown = filtered.slice(0, visible)

  return (
    <section id="coleccion" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
      <div ref={topRef} />

      {/* ── Heading ─────────────────────────────────── */}
      <Reveal className="flex flex-col gap-8 border-t border-line pt-20 sm:pt-28 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-5 text-rose">La colección</p>
          <h2 className="display text-5xl sm:text-6xl lg:text-7xl">
            Todas las <em className="text-rose">fragancias</em>
          </h2>
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search size={15} strokeWidth={1.5} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Busca por nombre, marca o nota…"
            aria-label="Buscar fragancias"
            className="w-full border-b border-line bg-transparent py-3 pl-7 pr-8 text-[15px] text-ink placeholder:text-faint outline-none transition-colors focus:border-ink [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.search && (
            <button
              onClick={() => setFilters(f => ({ ...f, search: '' }))}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink"
              aria-label="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </Reveal>

      {/* ── Category tabs + sort (sticky) ───────────── */}
      <div className="sticky top-16 z-20 -mx-5 mt-10 bg-ivory/90 px-5 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between gap-4 border-b border-line">
          <div className="no-scrollbar -mb-px flex min-w-0 gap-7 overflow-x-auto pr-6 [mask-image:linear-gradient(90deg,#000_85%,transparent)] sm:pr-0 sm:[mask-image:none]">
            {[[null, perfumes.length] as [Category | null, number], ...categoryCounts].map(([c, n]) => {
              const active = c === null ? filters.categories.length === 0 : filters.categories.length === 1 && filters.categories[0] === c
              return (
                <button
                  key={c ?? 'all'}
                  onClick={() => setCategory(c)}
                  className={`relative shrink-0 py-4 text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                    active ? 'text-ink' : 'text-faint hover:text-ink-soft'
                  }`}
                >
                  {c ? CATEGORY_LABELS[c] : 'Todas'}
                  <sup className="ml-1 text-[8px] tracking-normal">{n}</sup>
                  <span
                    className={`absolute inset-x-0 bottom-0 h-px bg-ink transition-transform duration-500 ease-lux ${active ? 'scale-x-100' : 'scale-x-0'}`}
                  />
                </button>
              )
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-2 py-3 text-[11px] uppercase tracking-[0.2em] text-ink lg:hidden"
            >
              <SlidersHorizontal size={14} strokeWidth={1.5} />
              <span>Filtros</span>
              {panelCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] text-ivory">{panelCount}</span>
              )}
            </button>

            <label className="relative hidden items-center gap-2 sm:flex">
              <span className="sr-only">Ordenar</span>
              <select
                value={filters.sortBy}
                onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as SortOption }))}
                className="cursor-pointer appearance-none bg-transparent py-3 pr-6 text-right text-[11px] uppercase tracking-[0.2em] text-ink outline-none"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-0 text-muted" />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-10 flex gap-12 xl:gap-16">
        {/* ── Desktop sidebar ───────────────────────── */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto no-scrollbar pb-10">
            <FilterSidebar filters={filters} onChange={setFilters} options={options} />
            {anyActive && (
              <button onClick={clearAll} className="link-underline mt-2 text-[11px] uppercase tracking-[0.2em] text-muted hover:text-ink">
                Limpiar todo
              </button>
            )}
          </div>
        </aside>

        {/* ── Results ───────────────────────────────── */}
        <div className="min-w-0 flex-1">
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <p className="mr-2 text-[12px] text-muted">
              <span className="text-ink">{filtered.length}</span> {filtered.length === 1 ? 'fragancia' : 'fragancias'}
            </p>
            {chips.map(ch => (
              <button
                key={ch.key}
                onClick={ch.clear}
                className="group inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-[11px] text-ink-soft transition-colors hover:bg-rose-soft"
              >
                {ch.label}
                <X size={11} className="text-muted transition-transform duration-300 group-hover:rotate-90" />
              </button>
            ))}
            {filters.search.trim() && filtered.length > 0 && (
              <a href={waLink(notFoundWhatsAppText(filters.search))} target="_blank" rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1.5 text-[11px] text-muted link-underline hover:text-ink">
                <MessageCircle size={12} /> ¿No es lo que buscas? Lo pedimos para ti
              </a>
            )}
            {chips.length > 1 && (
              <button onClick={clearAll} className="link-underline ml-1 text-[11px] text-muted hover:text-ink">
                Limpiar
              </button>
            )}
          </div>

          {filtered.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 sm:gap-y-16 md:grid-cols-3">
                {shown.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) * 90}>
                    <PerfumeCard perfume={p} priority={i < 6} />
                  </Reveal>
                ))}
              </div>

              {filtered.length > visible && (
                <div className="mt-20 flex flex-col items-center gap-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
                    Mostrando {shown.length} de {filtered.length}
                  </p>
                  <div className="h-px w-48 bg-line">
                    <div className="h-full bg-ink transition-all duration-700 ease-lux" style={{ width: `${(shown.length / filtered.length) * 100}%` }} />
                  </div>
                  <button onClick={() => setPager({ key: filters, n: visible + PAGE_SIZE })} className="btn btn-ghost mt-2">
                    Ver más fragancias
                  </button>
                </div>
              )}
            </>
          ) : (
            filters.search.trim() ? (
              /* Searched for something we don't carry → offer it on special order */
              <div className="flex flex-col items-center py-24 text-center">
                <p className="eyebrow mb-4 text-[9px] text-rose">Sobre pedido</p>
                <p className="display max-w-2xl text-4xl leading-tight sm:text-5xl">
                  No tenemos <span className="italic">“{filters.search.trim()}”</span>… <em className="text-rose">todavía.</em>
                </p>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                  Lo conseguimos para ti. Escríbenos por WhatsApp y te confirmamos precio y tiempo de entrega, sin compromiso.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <a href={waLink(notFoundWhatsAppText(filters.search))} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
                    <MessageCircle size={15} /> Pedir por WhatsApp
                  </a>
                  <button onClick={clearAll} className="btn btn-ghost">Ver todo el catálogo</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-28 text-center">
                <p className="display text-4xl sm:text-5xl">Nada por aquí… <em className="text-rose">aún.</em></p>
                <p className="mt-4 max-w-xs text-sm text-muted">
                  No encontramos fragancias con esos filtros. Prueba quitando alguno o escríbenos y la buscamos por ti.
                </p>
                <button onClick={clearAll} className="btn btn-ink mt-8">Limpiar filtros</button>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Mobile bottom sheet ─────────────────────── */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sheetOpen ? '' : 'pointer-events-none'}`} aria-hidden={!sheetOpen}>
        <div
          className={`absolute inset-0 bg-velvet/50 backdrop-blur-sm transition-opacity duration-500 ${sheetOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSheetOpen(false)}
        />
        <div
          className={`absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl bg-paper transition-transform duration-500 ease-lux ${
            sheetOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line" />
          <div className="flex items-center justify-between px-6 pb-4 pt-5">
            <h3 className="display text-3xl">Filtrar</h3>
            <button onClick={() => setSheetOpen(false)} className="p-2 -mr-2 text-muted" aria-label="Cerrar filtros"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="border-b border-line pb-7 mb-7">
              <h4 className="display mb-4 text-xl">Ordenar por</h4>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setFilters(f => ({ ...f, sortBy: o.value }))}
                    className={`rounded-full border px-3.5 py-2 text-[11px] tracking-wide transition-all ${
                      filters.sortBy === o.value ? 'border-ink bg-ink text-ivory' : 'border-line text-ink-soft'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <FilterSidebar filters={filters} onChange={setFilters} options={options} />
          </div>
          <div className="flex gap-3 border-t border-line px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button onClick={clearAll} className="btn btn-ghost flex-1 px-4">Limpiar</button>
            <button
              onClick={() => { setSheetOpen(false); topRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
              className="btn btn-ink flex-[2] px-4"
            >
              Ver {filtered.length} resultados
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
