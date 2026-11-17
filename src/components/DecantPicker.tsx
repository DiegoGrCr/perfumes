'use client'

import { useRef, useState } from 'react'
import { Plus, Check } from 'lucide-react'
import type { Decant, Perfume } from '@/types/perfume'
import { useCart } from '@/context/CartContext'
import { decantImage } from '@/lib/decants'
import { formatPrice } from '@/lib/brand'

/** 5 / 10 ml options of one perfume, each addable to the order. */
export default function DecantPicker({ perfume, decants, compact = false }: { perfume: Perfume; decants: Decant[]; compact?: boolean }) {
  const { addItem, flyToCart } = useCart()
  const [added, setAdded] = useState<number | null>(null)
  const imgs = useRef<Record<number, HTMLImageElement | null>>({})
  const sorted = [...decants].sort((a, b) => a.volume_ml - b.volume_ml)
  if (sorted.length === 0) return null

  function add(d: Decant) {
    const image = decantImage(perfume.id, d.volume_ml)
    addItem(perfume, d.volume_ml, { id: d.id, price: d.price, image })
    const el = imgs.current[d.volume_ml]
    if (el) flyToCart(el, image)
    setAdded(d.volume_ml)
    setTimeout(() => setAdded(a => (a === d.volume_ml ? null : a)), 1600)
  }

  return (
    <div className={`grid gap-3 ${sorted.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {sorted.map(d => (
        <div key={d.id} className="group flex flex-col items-center rounded-sm border border-line bg-paper p-4 text-center transition-colors hover:border-ink/30">
          <div className={`relative w-full ${compact ? 'h-32' : 'h-44'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={el => { imgs.current[d.volume_ml] = el }}
              src={decantImage(perfume.id, d.volume_ml)}
              alt={`Decant ${d.volume_ml} ml de ${perfume.name}`}
              className="h-full w-full object-contain drop-shadow-[0_14px_14px_rgba(23,18,15,0.18)] transition-transform duration-700 ease-lux group-hover:-translate-y-1"
            />
          </div>
          <p className="eyebrow mt-3 text-[9px] text-muted">Decant</p>
          <p className="display text-2xl leading-none">{d.volume_ml} ml</p>
          <p className="mt-1.5 text-[15px] font-medium">{formatPrice(d.price)}</p>
          {d.in_stock ? (
            <button onClick={() => add(d)} className="btn btn-ink mt-3 h-10 w-full px-3 text-[10px]">
              {added === d.volume_ml ? <><Check size={13} /> Agregado</> : <><Plus size={13} /> Agregar</>}
            </button>
          ) : (
            <p className="mt-3 flex h-10 items-center text-[11px] text-muted">Agotado por ahora</p>
          )}
        </div>
      ))}
    </div>
  )
}
