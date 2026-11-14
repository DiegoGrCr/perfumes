'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, X, ArrowRight, MessageCircle, Clock, CornerDownLeft, Loader2 } from 'lucide-react'
import { GENDER_LABELS } from '@/types/perfume'
import { formatPrice, waLink } from '@/lib/brand'
import { highlight, notFoundWhatsAppText, searchPerfumes, suggest, SearchablePerfume } from '@/lib/search'
import BottleSilhouette from '@/components/ui/BottleSilhouette'

export const OPEN_SEARCH_EVENT = 'velvet:open-search'
export const PREFETCH_SEARCH_EVENT = 'velvet:prefetch-search'
export const APPLY_SEARCH_EVENT = 'velvet:apply-search'

const RECENT_KEY = 'velvet_recent_searches'
const MAX_RESULTS = 8

let indexPromise: Promise<SearchablePerfume[]> | null = null
function loadIndex() {
  indexPromise ??= fetch('/api/search-index')
    .then(r => (r.ok ? r.json() : []))
    .catch(() => { indexPromise = null; return [] })
  return indexPromise
}

export const openSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))
export const prefetchSearch = () => window.dispatchEvent(new Event(PREFETCH_SEARCH_EVENT))

function readRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}
function saveRecent(q: string) {
  const v = q.trim()
  if (v.length < 2) return
  try {
    const next = [v, ...readRecent().filter(x => x.toLowerCase() !== v.toLowerCase())].slice(0, 6)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {}
}

function Hl({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlight(text, query).map((part, i) =>
        part.hit ? <mark key={i} className="bg-rose-soft text-ink rounded-[2px]">{part.text}</mark> : <span key={i}>{part.text}</span>,
      )}
    </>
  )
}

export default function SearchOverlay() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [list, setList] = useState<SearchablePerfume[] | null>(null)
  const [active, setActive] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const q = useDeferredValue(query)

  const ensureIndex = useCallback(() => { loadIndex().then(setList) }, [])

  const show = useCallback(() => {
    setOpen(true)
    setRecent(readRecent())
    ensureIndex()
  }, [ensureIndex])

  // Open from anywhere (header button, events) + keyboard shortcuts "/" and Ctrl/⌘+K
  useEffect(() => {
    const onOpen = () => show()
    const onPrefetch = () => ensureIndex()
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        if (pathname.startsWith('/admin')) return
        e.preventDefault()
        show()
      }
    }
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen)
    window.addEventListener(PREFETCH_SEARCH_EVENT, onPrefetch)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen)
      window.removeEventListener(PREFETCH_SEARCH_EVENT, onPrefetch)
      window.removeEventListener('keydown', onKey)
    }
  }, [show, ensureIndex, pathname])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => { document.body.style.overflow = ''; cancelAnimationFrame(id) }
  }, [open])

  const close = useCallback(() => { setOpen(false); setActive(0) }, [])

  const result = useMemo(() => (list && q.trim() ? searchPerfumes(list, q) : { items: [], partial: false }), [list, q])
  const shown = result.items.slice(0, MAX_RESULTS)
  const suggestions = useMemo(
    () => (list && q.trim() && result.items.length === 0 ? suggest(list, q) : []),
    [list, q, result.items.length],
  )

  const brands = useMemo(() => {
    if (!list) return []
    const m = new Map<string, number>()
    list.forEach(p => { const b = p.brand.trim(); m.set(b, (m.get(b) ?? 0) + 1) })
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [list])
  const families = useMemo(() => {
    if (!list) return []
    const m = new Map<string, number>()
    list.forEach(p => { if (p.scent_type) m.set(p.scent_type, (m.get(p.scent_type) ?? 0) + 1) })
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f]) => f)
  }, [list])
  const matchedBrands = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (n.length < 2) return []
    return brands.filter(([b]) => b.toLowerCase().includes(n) || n.includes(b.toLowerCase())).slice(0, 3)
  }, [brands, q])

  function goToProduct(p: SearchablePerfume) {
    saveRecent(query)
    close()
    router.push(`/perfume/${p.id}`)
  }

  function goToCatalog(term = query) {
    const v = term.trim()
    if (!v) return
    saveRecent(v)
    close()
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent(APPLY_SEARCH_EVENT, { detail: { q: v } }))
      document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push(`/?q=${encodeURIComponent(v)}#coleccion`)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return }
    if (!shown.length) { if (e.key === 'Enter') goToCatalog(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % shown.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a - 1 + shown.length) % shown.length) }
    else if (e.key === 'Enter') { e.preventDefault(); goToProduct(shown[Math.min(active, shown.length - 1)]) }
  }

  // keep the highlighted row visible while using the arrows
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const loading = open && list === null
  const hasQuery = q.trim().length > 0
  const noResults = hasQuery && !loading && result.items.length === 0

  return (
    <div
      className={`fixed inset-0 z-[65] transition-[opacity,visibility] duration-500 ${open ? 'visible opacity-100' : 'invisible opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Buscar fragancias"
    >
      <div className="absolute inset-0 bg-velvet/50 backdrop-blur-sm" onClick={close} />

      <div
        className={`absolute inset-x-0 top-0 flex max-h-[100svh] flex-col bg-ivory shadow-[0_30px_80px_-30px_rgba(18,12,11,0.6)] transition-transform duration-700 ease-lux sm:max-h-[86vh] ${
          open ? 'translate-y-0' : '-translate-y-6'
        }`}
      >
        {/* Input */}
        <div className="border-b border-line">
          <div className="mx-auto flex max-w-4xl items-center gap-4 px-5 py-5 sm:px-8 sm:py-7">
            <Search size={22} strokeWidth={1.3} className="shrink-0 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setActive(0) }}
              onKeyDown={onKeyDown}
              placeholder="Busca por fragancia, marca o nota…"
              aria-label="Buscar"
              className="display min-w-0 flex-1 bg-transparent text-3xl text-ink outline-none placeholder:text-faint sm:text-4xl"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button onClick={() => { setQuery(''); inputRef.current?.focus() }} className="eyebrow shrink-0 text-[9px] text-muted hover:text-ink">
                Borrar
              </button>
            )}
            <button onClick={close} aria-label="Cerrar búsqueda" className="-mr-2 shrink-0 p-2 text-muted transition-transform duration-500 hover:rotate-90 hover:text-ink">
              <X size={22} strokeWidth={1.3} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-5 py-7 sm:px-8 sm:py-9">
            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={15} className="animate-spin" /> Cargando catálogo…</p>
            )}

            {/* Empty query: recent / brands / families */}
            {!hasQuery && !loading && (
              <div className="grid gap-10 sm:grid-cols-2">
                {recent.length > 0 && (
                  <div className="sm:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="eyebrow text-[9px] text-muted">Búsquedas recientes</p>
                      <button
                        onClick={() => { try { localStorage.removeItem(RECENT_KEY) } catch {} ; setRecent([]) }}
                        className="text-[11px] text-faint link-underline hover:text-ink"
                      >
                        Borrar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recent.map(r => (
                        <button key={r} onClick={() => { setQuery(r); inputRef.current?.focus() }}
                          className="flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-[13px] text-ink-soft transition-colors hover:border-ink">
                          <Clock size={12} className="text-faint" /> {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="eyebrow mb-4 text-[9px] text-muted">Marcas populares</p>
                  <div className="flex flex-wrap gap-2">
                    {brands.slice(0, 10).map(([b, n]) => (
                      <button key={b} onClick={() => { setQuery(b); inputRef.current?.focus() }}
                        className="rounded-full border border-line px-3.5 py-2 text-[13px] text-ink-soft transition-colors hover:border-ink">
                        {b} <span className="text-[10px] text-faint">{n}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="eyebrow mb-4 text-[9px] text-muted">Por aroma</p>
                  <div className="flex flex-wrap gap-2">
                    {families.map(f => (
                      <button key={f} onClick={() => { setQuery(f); inputRef.current?.focus() }}
                        className="rounded-full bg-sand px-3.5 py-2 text-[13px] text-ink-soft transition-colors hover:bg-rose-soft">
                        {f === 'Gourmand' ? 'Dulce' : f}
                      </button>
                    ))}
                    <Link href="/ofertas" onClick={close}
                      className="rounded-full bg-wine px-3.5 py-2 text-[13px] text-rose-light transition-opacity hover:opacity-90">
                      Ofertas activas
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {hasQuery && !loading && result.items.length > 0 && (
              <>
                {matchedBrands.length > 0 && (
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span className="eyebrow mr-1 text-[9px] text-muted">Marcas</span>
                    {matchedBrands.map(([b, n]) => (
                      <button key={b} onClick={() => goToCatalog(b)}
                        className="rounded-full border border-line px-3 py-1.5 text-[12px] text-ink-soft transition-colors hover:border-ink">
                        Todo de {b} <span className="text-[10px] text-faint">{n}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mb-3 flex items-baseline justify-between">
                  <p className="eyebrow text-[9px] text-muted">
                    {result.partial ? 'Resultados parecidos' : `${result.items.length} ${result.items.length === 1 ? 'resultado' : 'resultados'}`}
                  </p>
                  <p className="hidden items-center gap-1.5 text-[11px] text-faint sm:flex">
                    <kbd className="rounded border border-line px-1.5">↑</kbd><kbd className="rounded border border-line px-1.5">↓</kbd> navegar
                    <kbd className="ml-2 flex items-center rounded border border-line px-1.5"><CornerDownLeft size={10} /></kbd> abrir
                  </p>
                </div>

                <ul ref={listRef} className="divide-y divide-line border-y border-line">
                  {shown.map((p, i) => {
                    const pct = p.original_price && p.original_price > p.price ? Math.round((1 - p.price / p.original_price) * 100) : null
                    return (
                      <li key={p.id} data-i={i}>
                        <button
                          onClick={() => goToProduct(p)}
                          onMouseEnter={() => setActive(i)}
                          className={`flex w-full items-center gap-4 px-2 py-3 text-left transition-colors sm:gap-5 sm:px-3 ${i === active ? 'bg-paper' : ''}`}
                        >
                          <span className="flex h-16 w-14 shrink-0 items-center justify-center bg-sand">
                            {p.image
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={p.image} alt="" decoding="async" className="h-full w-full object-contain p-1.5" />
                              : <BottleSilhouette className="h-10 w-auto" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="eyebrow block text-[8px] text-muted"><Hl text={p.brand} query={q} /></span>
                            <span className="display mt-0.5 block truncate text-xl leading-tight"><Hl text={p.name} query={q} /></span>
                            <span className="mt-0.5 block text-[11px] text-faint">
                              {p.concentration} · {p.volume_ml} ml · {GENDER_LABELS[p.gender]} ·{' '}
                              <span className={p.in_stock ? 'text-emerald-700' : ''}>{p.in_stock ? 'En existencia' : 'Sobre pedido'}</span>
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-[14px] font-medium">{formatPrice(p.price)}</span>
                            {pct && (
                              <span className="mt-0.5 inline-block rounded-full bg-rose px-1.5 text-[10px] font-medium text-paper">−{pct}%</span>
                            )}
                          </span>
                          <ArrowRight size={15} className={`hidden shrink-0 transition-all duration-300 sm:block ${i === active ? 'translate-x-0 text-ink opacity-100' : '-translate-x-1 opacity-0'}`} />
                        </button>
                      </li>
                    )
                  })}
                </ul>

                <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <button onClick={() => goToCatalog()} className="btn btn-ghost group h-11 px-5">
                    Ver {result.items.length > MAX_RESULTS ? `los ${result.items.length} resultados` : 'en el catálogo'}
                    <ArrowRight size={14} className="transition-transform duration-500 group-hover:translate-x-1" />
                  </button>
                  <a href={waLink(notFoundWhatsAppText(query))} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[12px] text-muted link-underline hover:text-ink">
                    <MessageCircle size={13} /> ¿No es lo que buscas? Lo pedimos para ti
                  </a>
                </div>
              </>
            )}

            {/* Nothing found → special order on WhatsApp */}
            {noResults && (
              <div className="py-4 sm:py-8">
                <p className="eyebrow mb-4 text-[9px] text-rose">Sobre pedido</p>
                <h3 className="display text-4xl leading-tight sm:text-5xl">
                  No tenemos <span className="italic">“{query.trim()}”</span> en el catálogo… <em className="text-rose">todavía.</em>
                </h3>
                <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-muted">
                  Lo conseguimos para ti. Escríbenos por WhatsApp y te confirmamos precio y tiempo de entrega,
                  sin compromiso. Siempre originales.
                </p>
                <a href={waLink(notFoundWhatsAppText(query))} target="_blank" rel="noopener noreferrer" className="btn btn-ink mt-7">
                  <MessageCircle size={15} />
                  <span className="sm:hidden">Pedir por WhatsApp</span>
                  <span className="hidden sm:inline">Pedir “{query.trim().slice(0, 28)}” por WhatsApp</span>
                </a>

                {suggestions.length > 0 && (
                  <div className="mt-10">
                    <p className="eyebrow mb-3 text-[9px] text-muted">¿Quisiste decir…?</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map(p => (
                        <button key={p.id} onClick={() => goToProduct(p)}
                          className="rounded-full border border-line px-3.5 py-2 text-[13px] text-ink-soft transition-colors hover:border-ink">
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-8">
                  <p className="eyebrow mb-3 text-[9px] text-muted">O explora</p>
                  <div className="flex flex-wrap gap-2">
                    {brands.slice(0, 6).map(([b]) => (
                      <button key={b} onClick={() => { setQuery(b); inputRef.current?.focus() }}
                        className="rounded-full bg-sand px-3.5 py-2 text-[13px] text-ink-soft transition-colors hover:bg-rose-soft">
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
