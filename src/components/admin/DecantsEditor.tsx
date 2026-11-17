'use client'

import { useEffect, useState } from 'react'
import { Loader2, Check, ImageIcon, AlertCircle } from 'lucide-react'
import { getDecantAdminData, saveDecants, DecantAdminData, DecantInput } from '@/app/actions/decants'
import { DECANT_SIZES, DECANT_PRICING, decantImage, hasCustomDecantImage, suggestedDecantPrice, wholeBottleRevenue } from '@/lib/decants'
import { formatPrice } from '@/lib/brand'
import type { DecantSize } from '@/types/perfume'

type Row = { volume_ml: DecantSize; price: string; in_stock: boolean; active: boolean }

/** Admin: enable 5/10 ml decants for a perfume, with a suggested price from the acquisition cost. */
export default function DecantsEditor({ perfumeId }: { perfumeId: string }) {
  const [info, setInfo] = useState<DecantAdminData | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [state, setState] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getDecantAdminData(perfumeId).then(res => {
      if (!alive) return
      if (!res.ok) { setError(res.error); setState('error'); return }
      setInfo(res.data)
      setRows(DECANT_SIZES.map(ml => {
        const d = res.data.decants.find(x => x.volume_ml === ml)
        return { volume_ml: ml, price: d ? String(d.price) : '', in_stock: d?.in_stock ?? true, active: d?.active ?? false }
      }))
      setState('idle')
    })
    return () => { alive = false }
  }, [perfumeId])

  const set = (ml: DecantSize, patch: Partial<Row>) => setRows(rs => rs.map(r => (r.volume_ml === ml ? { ...r, ...patch } : r)))

  async function onSave() {
    setState('saving'); setError(null)
    const payload: DecantInput[] = rows.map(r => ({ volume_ml: r.volume_ml, price: Number(r.price) || 0, in_stock: r.in_stock, active: r.active }))
    const res = await saveDecants(perfumeId, payload)
    if (!res.ok) { setError(res.error); setState('error'); return }
    setState('saved'); setTimeout(() => setState(s => (s === 'saved' ? 'idle' : s)), 1800)
  }

  if (state === 'loading') return <p className="flex items-center gap-2 text-[12px] text-muted"><Loader2 size={13} className="animate-spin" /> Cargando decants…</p>

  if (info?.tableMissing) {
    return (
      <p className="flex items-start gap-2 rounded-sm bg-rose-soft px-4 py-3 text-[12px] leading-relaxed text-ink-soft">
        <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose" />
        Para vender decants primero hay que crear su tabla en Supabase (migración 004).
      </p>
    )
  }

  const perMl = info?.costPrice && info.bottleMl ? info.costPrice / info.bottleMl : null
  const customImg = hasCustomDecantImage(perfumeId)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={decantImage(perfumeId, 'par')} alt="" className="h-20 w-24 shrink-0 rounded-sm bg-sand object-contain" />
        <div className="text-[12px] leading-relaxed text-muted">
          {perMl
            ? <>Costo: {formatPrice(info!.costPrice!)} por {info!.bottleMl} ml → <span className="text-ink">{formatPrice(perMl)}/ml</span></>
            : <>Sin costo de adquisición registrado: agrégalo en la edición completa para ver el precio sugerido.</>}
          <span className="mt-1 flex items-center gap-1.5">
            <ImageIcon size={12} />
            {customImg ? <span className="text-emerald-700">Imagen del decant lista</span> : <>Usa la imagen genérica · pídele a Claude la imagen propia</>}
          </span>
        </div>
      </div>

      {rows.map(r => {
        const suggested = suggestedDecantPrice(info?.costPrice, info?.bottleMl ?? 0, r.volume_ml)
        return (
          <div key={r.volume_ml} className={`rounded-sm border p-4 transition-colors ${r.active ? 'border-ink/30 bg-paper' : 'border-line'}`}>
            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={r.active} onChange={e => set(r.volume_ml, { active: e.target.checked })} className="h-4 w-4" />
                <span className="display text-2xl">Decant {r.volume_ml} ml</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted">
                <input type="checkbox" checked={r.in_stock} onChange={e => set(r.volume_ml, { in_stock: e.target.checked })} disabled={!r.active} />
                En existencia
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[14px] text-muted">$</span>
                <input
                  inputMode="decimal"
                  value={r.price}
                  disabled={!r.active}
                  onChange={e => set(r.volume_ml, { price: e.target.value.replace(/[^\d.]/g, '') })}
                  placeholder="Precio"
                  className="w-28 border-b border-line bg-transparent py-1.5 pl-4 text-[15px] outline-none focus:border-ink disabled:opacity-40"
                />
              </div>
              {suggested && (
                <button
                  type="button"
                  disabled={!r.active}
                  onClick={() => set(r.volume_ml, { price: String(suggested) })}
                  className="rounded-full border border-line px-3 py-1.5 text-[11px] text-ink-soft transition-colors hover:border-ink disabled:opacity-40"
                  title={`(${formatPrice(perMl!)}/ml × ${r.volume_ml} ml × ${DECANT_PRICING.margin}) + ${formatPrice(DECANT_PRICING.atomizerCost)} atomizador`}
                >
                  Usar sugerido {formatPrice(suggested)}
                </button>
              )}
            </div>
            {(() => {
              // what the whole bottle would bring in at this price (vs. what it cost)
              const total = wholeBottleRevenue(info?.bottleMl ?? 0, r.volume_ml, Number(r.price))
              if (!r.active || !total) return null
              const cost = info?.costPrice
              return (
                <p className="mt-2.5 text-[11px] text-muted">
                  Decantando toda la botella ({Math.floor((info?.bottleMl ?? 0) / r.volume_ml)} decants): <span className="text-ink">{formatPrice(total)}</span>
                  {cost ? <> · la botella te costó {formatPrice(cost)} <span className={total >= cost * 1.5 ? 'text-emerald-700' : 'text-rose'}>({(total / cost).toFixed(2)}×)</span></> : null}
                </p>
              )
            })()}
          </div>
        )
      })}

      {error && <p className="rounded-sm bg-rose-soft px-4 py-2.5 text-[12px] text-ink-soft">{error}</p>}
      <button type="button" onClick={onSave} disabled={state === 'saving'} className="btn btn-ghost h-11 w-full">
        {state === 'saving' ? <><Loader2 size={14} className="animate-spin" /> Guardando…</>
          : state === 'saved' ? <><Check size={14} /> Decants guardados</>
          : 'Guardar decants'}
      </button>
    </div>
  )
}
