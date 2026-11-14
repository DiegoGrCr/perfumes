'use client'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus, Package, Star, Download, Search, X, Check, Loader2 } from 'lucide-react'
import { Perfume, Category } from '@/types/perfume'
import { CATEGORY_LABELS, GENDER_LABELS } from '@/types/perfume'
import { deletePerfume } from '@/lib/admin-api'
import { savePerfume, PerfumePatch } from '@/app/actions/perfume'

const PAGE_SIZE = 20

/** The three tabs; legacy 'nicho' rows are shown under "Otros" so nothing gets lost. */
type Tab = Exclude<Category, 'nicho'>
const TABS: Tab[] = ['arabe', 'disenador', 'otros']
const tabOf = (p: Perfume): Tab => (p.category === 'nicho' ? 'otros' : p.category)

function exportCSV(perfumes: Perfume[]) {
  const headers = [
    'Nombre', 'Marca', 'Categoría', 'Género', 'Concentración',
    'Volumen (ml)', 'Costo referencia', 'Precio venta', 'Unidades en stock', 'En stock',
  ]
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = perfumes.map(p => [
    p.name, p.brand, CATEGORY_LABELS[p.category], GENDER_LABELS[p.gender],
    p.concentration, p.volume_ml, p.cost_price ?? '', p.price, p.stock_quantity ?? 0, p.in_stock ? 'Sí' : 'No',
  ].map(escape).join(','))

  const csv = '﻿' + [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `velvet-catalogo-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Inline number editor (price / units) ─────────────────────── */
function InlineNumber({
  value, onSave, prefix = '', suffix = '', min = 0, decimals = false, width = 'w-20', disabled,
}: {
  value: number
  onSave: (v: number) => Promise<boolean>
  prefix?: string
  suffix?: string
  min?: number
  decimals?: boolean
  width?: string
  disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const [saving, setSaving] = useState(false)

  function start() { setDraft(String(value)); setEditing(true) }

  async function commit() {
    const n = decimals ? parseFloat(draft) : parseInt(draft, 10)
    if (Number.isNaN(n) || n < min) return
    if (n === value) { setEditing(false); return }
    setSaving(true)
    const ok = await onSave(n)
    setSaving(false)
    if (ok) setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={start}
        disabled={disabled}
        title="Clic para editar"
        className="group flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors hover:bg-[#1a1a1a] disabled:opacity-50"
        style={{ border: '1px solid #2a2a2a', color: '#F5F0E8' }}
      >
        {prefix}{decimals ? value.toLocaleString('es-MX', { maximumFractionDigits: 2 }) : value}{suffix}
        <Pencil size={10} className="opacity-40 transition-opacity group-hover:opacity-100" style={{ color: '#C9A84C' }} />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#666' }}>{prefix}</span>}
        <input
          type="number" min={min} step={decimals ? '0.01' : '1'} autoFocus inputMode={decimals ? 'decimal' : 'numeric'}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          className={`${width} rounded py-1 pr-2 text-xs outline-none ${prefix ? 'pl-5' : 'pl-2'}`}
          style={{ background: '#0d0d0d', border: '1px solid #C9A84C', color: '#F5F0E8' }}
        />
      </div>
      <button onClick={commit} disabled={saving} aria-label="Guardar"
        className="flex h-6 w-6 items-center justify-center rounded"
        style={{ background: '#1a2a1a', color: '#4CAF50', border: '1px solid #2a4a2a' }}>
        {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={12} />}
      </button>
      <button onClick={() => setEditing(false)} aria-label="Cancelar"
        className="flex h-6 w-6 items-center justify-center rounded"
        style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a' }}>
        <X size={12} />
      </button>
    </div>
  )
}

/* ── Sí / No switch ───────────────────────────────────────────── */
function StockSwitch({ on, onToggle, busy }: { on: boolean; onToggle: () => void; busy: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={busy}
      role="switch"
      aria-checked={on}
      title={on ? 'En existencia — clic para marcar “Sobre pedido”' : 'Sobre pedido — clic para marcar “En existencia”'}
      className="flex items-center gap-2 disabled:opacity-60"
    >
      <span className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-300"
        style={{ background: on ? '#1f5f2f' : '#3a1a1a' }}>
        <span className="absolute top-0.5 h-4 w-4 rounded-full transition-transform duration-300"
          style={{ background: on ? '#4CAF50' : '#f87171', transform: `translateX(${on ? 18 : 2}px)` }} />
      </span>
      <span className="text-xs font-medium" style={{ color: on ? '#4CAF50' : '#f87171' }}>
        {busy ? '…' : on ? 'Sí' : 'No'}
      </span>
    </button>
  )
}

interface AdminPerfumeListProps {
  initialPerfumes: Perfume[]
  /** Lets the dashboard keep its summary / sale form in sync with inline edits. */
  onPerfumeUpdated?: (p: Perfume) => void
  onPerfumeDeleted?: (id: string) => void
}

export function AdminPerfumeList({ initialPerfumes, onPerfumeUpdated, onPerfumeDeleted }: AdminPerfumeListProps) {
  const router = useRouter()
  const [perfumes, setPerfumes]   = useState(initialPerfumes)
  const [tab, setTab]             = useState<Tab>('arabe')
  const [query, setQuery]         = useState('')
  const [pager, setPager]         = useState<{ key: string; n: number }>({ key: '', n: PAGE_SIZE })
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busy, setBusy]           = useState<Record<string, boolean>>({})
  const [error, setError]         = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Search across everything, so each tab can show how many matches it holds
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return perfumes
    return perfumes.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
  }, [perfumes, query])

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { arabe: 0, disenador: 0, otros: 0 }
    matches.forEach(p => { c[tabOf(p)]++ })
    return c
  }, [matches])

  const filtered = useMemo(() => matches.filter(p => tabOf(p) === tab), [matches, tab])

  // Page size resets whenever the tab or search changes
  const pagerKey = `${tab}|${query}`
  const visible  = pager.key === pagerKey ? pager.n : PAGE_SIZE
  const displayed = filtered.slice(0, visible)
  const hasMore   = visible < filtered.length

  const loadMore = useCallback(() => {
    setPager({ key: pagerKey, n: Math.min(visible + PAGE_SIZE, filtered.length) })
  }, [pagerKey, visible, filtered.length])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore()
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  /** Optimistic update → server action (also refreshes the public storefront). */
  async function update(p: Perfume, patch: PerfumePatch): Promise<boolean> {
    const next = { ...p, ...patch } as Perfume
    setBusy(b => ({ ...b, [p.id]: true }))
    setError(null)
    setPerfumes(ps => ps.map(x => (x.id === p.id ? next : x)))
    const res = await savePerfume(p.id, patch)
    setBusy(b => ({ ...b, [p.id]: false }))
    if (!res.ok) {
      setPerfumes(ps => ps.map(x => (x.id === p.id ? p : x)))
      setError(`${p.name}: ${res.error}`)
      return false
    }
    onPerfumeUpdated?.(next)
    return true
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const ok = await deletePerfume(id)
    if (ok) { setPerfumes(p => p.filter(x => x.id !== id)); onPerfumeDeleted?.(id) }
    setDeleting(null)
    setConfirmId(null)
  }

  const tabUnits = filtered.reduce((s, p) => s + (p.stock_quantity ?? 0), 0)
  const tabInStock = filtered.filter(p => p.in_stock).length
  const tabOffers = filtered.filter(p => p.original_price && p.original_price > p.price).length

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-light tracking-widest" style={{ color: '#F5F0E8' }}>Catálogo</h1>
          <p className="text-sm mt-0.5" style={{ color: '#666' }}>
            {perfumes.length} perfume{perfumes.length !== 1 ? 's' : ''} · los cambios se publican al instante en la tienda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(filtered.length > 0 ? filtered : perfumes)}
            disabled={perfumes.length === 0}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded text-xs sm:text-sm font-medium uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#1a1a1a', color: '#C9A84C', border: '1px solid #2a2a2a' }}
            title={`Exportar ${CATEGORY_LABELS[tab]} como CSV`}
          >
            <Download size={14} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={() => router.push('/admin/perfumes/new')}
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded text-xs sm:text-sm font-medium uppercase tracking-widest transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C86D)', color: '#000' }}
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Nuevo perfume</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mb-4 flex overflow-x-auto" style={{ borderBottom: '1px solid #1e1e1e', scrollbarWidth: 'none' }}>
        {TABS.map(t => {
          const active = t === tab
          return (
            <button
              key={t}
              onClick={() => { setTab(t); setConfirmId(null) }}
              className="flex shrink-0 items-center gap-2 px-4 sm:px-6 py-3 text-xs font-medium uppercase tracking-widest transition-colors"
              style={{
                color: active ? '#C9A84C' : '#555',
                borderBottom: `2px solid ${active ? '#C9A84C' : 'transparent'}`,
                marginBottom: -1,
              }}
            >
              {CATEGORY_LABELS[t]}
              <span className="rounded-full px-2 py-0.5 text-[10px]"
                style={{ background: active ? '#2a2210' : '#151515', color: active ? '#C9A84C' : '#555' }}>
                {counts[t]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search + tab summary */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#444' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Buscar en ${CATEGORY_LABELS[tab]} por nombre o marca…`}
            className="w-full pl-9 pr-9 py-2.5 rounded text-sm outline-none"
            style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#F5F0E8' }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: '#444' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <p className="shrink-0 text-xs" style={{ color: '#555' }}>
          <span style={{ color: '#4CAF50' }}>{tabInStock}</span> en stock · {filtered.length - tabInStock} sobre pedido · {tabUnits} uds
          {tabOffers > 0 && <> · <span style={{ color: '#E4B8AC' }}>{tabOffers} en oferta</span></>}
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded px-4 py-3 text-xs"
          style={{ background: '#200a0a', border: '1px solid #4a1a1a', color: '#f87171' }}>
          <span>No se guardó — {error}</span>
          <button onClick={() => setError(null)} aria-label="Cerrar"><X size={13} /></button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: '#444' }}>
          <Package size={36} />
          <p className="text-sm">
            {query ? `Sin resultados para "${query}" en ${CATEGORY_LABELS[tab]}` : `No hay perfumes en ${CATEGORY_LABELS[tab]}.`}
          </p>
          {query
            ? <button onClick={() => setQuery('')} className="text-xs underline" style={{ color: '#C9A84C' }}>Limpiar búsqueda</button>
            : <button onClick={() => router.push('/admin/perfumes/new')} className="text-xs underline" style={{ color: '#C9A84C' }}>Agregar perfume</button>
          }
        </div>
      ) : (
        <>
          <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid #1e1e1e' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
                  {['Perfume', 'Precio venta', 'Unidades', 'En stock', 'Fijar', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium whitespace-nowrap" style={{ color: '#555' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((p, idx) => {
                  const primaryImg = p.images?.find(i => i.is_primary) ?? p.images?.[0]
                  const isBusy = !!busy[p.id]
                  return (
                    <tr key={p.id}
                      style={{ background: idx % 2 === 0 ? '#111' : '#0f0f0f', borderBottom: '1px solid #1a1a1a' }}>

                      {/* Perfume */}
                      <td className="px-4 py-3 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
                            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                            {primaryImg
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={primaryImg.url} alt="" className="w-full h-full object-contain" />
                              : <Package size={14} style={{ color: '#333' }} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium leading-snug" style={{ color: '#F5F0E8' }}>{p.name}</p>
                            <p className="text-xs" style={{ color: '#666' }}>{p.brand} · {p.concentration} · {p.volume_ml}ml</p>
                          </div>
                        </div>
                      </td>

                      {/* Precio editable */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <InlineNumber
                          value={p.price}
                          prefix="$"
                          decimals
                          min={1}
                          width="w-24"
                          disabled={isBusy}
                          onSave={v => update(p, { price: v })}
                        />
                        {/* Precio anterior → oferta activa cuando es mayor al precio actual (0 = sin oferta) */}
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>Antes</span>
                          <InlineNumber
                            value={p.original_price ?? 0}
                            prefix="$"
                            decimals
                            width="w-24"
                            disabled={isBusy}
                            onSave={v => update(p, { original_price: v > 0 ? v : undefined })}
                          />
                          {p.original_price && p.original_price > p.price ? (
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: '#2a1418', color: '#E4B8AC' }}>
                              −{Math.round((1 - p.price / p.original_price) * 100)}%
                            </span>
                          ) : p.original_price ? (
                            <span className="text-[10px]" style={{ color: '#666' }} title="El precio anterior debe ser mayor al actual">sin oferta</span>
                          ) : null}
                        </div>
                        {p.cost_price != null && (
                          <p className="mt-1 text-[11px]" style={{ color: '#555' }}>costo: ${p.cost_price}</p>
                        )}
                      </td>

                      {/* Unidades editables — crossing zero flips the stock switch */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <InlineNumber
                          value={p.stock_quantity ?? 0}
                          suffix=" uds"
                          width="w-16"
                          disabled={isBusy}
                          onSave={v => update(p, { stock_quantity: v, in_stock: v > 0 })}
                        />
                      </td>

                      {/* En stock Sí / No */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StockSwitch on={p.in_stock} busy={isBusy} onToggle={() => update(p, { in_stock: !p.in_stock })} />
                      </td>

                      {/* Fijar arriba */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => update(p, { featured: !p.featured })}
                          disabled={isBusy}
                          title={p.featured ? 'Fijado arriba — clic para quitar' : 'Fijar arriba en la tienda'}
                          className="rounded p-1.5 transition-transform hover:scale-110 disabled:opacity-50"
                        >
                          <Star size={15} style={{ color: p.featured ? '#C9A84C' : '#333' }} fill={p.featured ? '#C9A84C' : 'none'} />
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        {confirmId === p.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs whitespace-nowrap" style={{ color: '#aaa' }}>¿Eliminar?</span>
                            <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                              className="text-xs px-2 py-1 rounded"
                              style={{ background: '#4a1a1a', color: '#f87171', border: '1px solid #6a2a2a' }}>
                              {deleting === p.id ? '…' : 'Sí'}
                            </button>
                            <button onClick={() => setConfirmId(null)}
                              className="text-xs px-2 py-1 rounded"
                              style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a' }}>
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button onClick={() => router.push(`/admin/perfumes/${p.id}/edit`)}
                              className="p-2 rounded hover:opacity-80" style={{ color: '#C9A84C' }} title="Edición completa">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setConfirmId(p.id)}
                              className="p-2 rounded hover:opacity-80" style={{ color: '#f87171' }} title="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Sentinel para infinite scroll */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#2a2a2a', borderTopColor: '#C9A84C' }} />
            </div>
          )}

          {!hasMore && filtered.length > PAGE_SIZE && (
            <p className="text-center text-xs py-4" style={{ color: '#333' }}>
              — {filtered.length} perfumes en {CATEGORY_LABELS[tab]} —
            </p>
          )}
        </>
      )}
    </div>
  )
}
