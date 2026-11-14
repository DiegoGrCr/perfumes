'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, Check, Pin, Pencil, PackageCheck, Clock } from 'lucide-react'
import { Perfume, GENDER_LABELS } from '@/types/perfume'
import { useCart } from '@/context/CartContext'
import { useAdmin, useLivePerfume } from '@/context/AdminContext'
import { discountPct, formatPrice, orderedImages, stockLabel } from '@/lib/brand'
import BottleSilhouette from '@/components/ui/BottleSilhouette'

interface Props { perfume: Perfume; priority?: boolean; showSavings?: boolean }

export default function PerfumeCard({ perfume: base, priority = false, showSavings = false }: Props) {
  const { addItem, flyToCart } = useCart()
  const { isAdmin, save, openEditor } = useAdmin()
  const perfume = useLivePerfume(base)
  const images = orderedImages(perfume)
  const primary = images[0]?.url ?? perfume.image_url
  const secondary = images[1]?.url
  const imgRef = useRef<HTMLImageElement>(null)
  const [added, setAdded] = useState(false)

  const discount = discountPct(perfume)

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(perfume, perfume.volume_ml)
    flyToCart(imgRef.current ?? (e.currentTarget as HTMLElement), primary)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }, [addItem, flyToCart, perfume, primary])

  const href = `/perfume/${perfume.id}`

  return (
    <article className="group relative flex flex-col">
      {/* ── Image ─────────────────────────────────── */}
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <div
          className="absolute inset-0 transition-opacity duration-700 group-hover:opacity-100 opacity-70"
          style={{ background: 'radial-gradient(60% 50% at 50% 45%, rgba(255,255,255,0.85), transparent 70%)' }}
        />

        {primary ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={primary}
              alt={perfume.name}
              loading={priority ? 'eager' : 'lazy'}
              className={`absolute inset-0 h-full w-full object-contain p-[14%] drop-shadow-[0_18px_18px_rgba(23,18,15,0.18)] transition-all duration-[900ms] ease-lux group-hover:scale-[1.06] ${
                secondary ? 'group-hover:opacity-0' : ''
              }`}
            />
            {secondary && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={secondary}
                alt=""
                aria-hidden
                loading="lazy"
                className="absolute inset-0 h-full w-full scale-95 object-contain p-[14%] opacity-0 drop-shadow-[0_18px_18px_rgba(23,18,15,0.18)] transition-all duration-[900ms] ease-lux group-hover:scale-100 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center transition-transform duration-[900ms] ease-lux group-hover:scale-105">
            <BottleSilhouette className="h-1/2 w-auto" />
          </div>
        )}

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5 sm:left-4 sm:top-4">
          {perfume.featured && (
            <span className="eyebrow rounded-full bg-paper/90 px-2 py-1 text-[7px] tracking-[0.18em] text-ink backdrop-blur sm:px-2.5 sm:text-[8px] sm:tracking-[0.32em]">
              Destacado
            </span>
          )}
        </div>
        {discount && (
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-rose px-1.5 py-0.5 text-[9px] font-medium sm:px-2 sm:py-1 sm:text-[10px] text-paper sm:right-4 sm:top-4">
            −{discount}%
          </span>
        )}

        {/* Admin controls — sit above the stretched link */}
        {isAdmin && (
          <div className="absolute bottom-14 right-2.5 z-30 flex flex-col gap-1.5 sm:bottom-auto sm:right-3 sm:top-12 sm:opacity-80 sm:transition-opacity sm:group-hover:opacity-100">
            {[
              {
                label: perfume.featured ? 'Quitar de arriba' : 'Fijar arriba',
                icon: <Pin size={13} className={perfume.featured ? 'fill-current' : ''} />,
                active: perfume.featured,
                onClick: () => save(perfume, { featured: !perfume.featured }),
              },
              {
                label: perfume.in_stock ? 'Marcar sobre pedido' : 'Marcar en existencia',
                icon: perfume.in_stock ? <PackageCheck size={13} /> : <Clock size={13} />,
                active: perfume.in_stock,
                onClick: () => save(perfume, { in_stock: !perfume.in_stock }),
              },
              { label: 'Editar', icon: <Pencil size={13} />, active: false, onClick: () => openEditor(perfume) },
            ].map(b => (
              <button
                key={b.label}
                title={b.label}
                aria-label={b.label}
                onClick={e => { e.preventDefault(); e.stopPropagation(); b.onClick() }}
                className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-300 hover:scale-110 ${
                  b.active ? 'bg-ink text-ivory' : 'bg-paper text-ink'
                }`}
              >
                {b.icon}
              </button>
            ))}
          </div>
        )}

        {/* Quick add — desktop: slides up, mobile: round button */}
        <button
          onClick={handleAdd}
          aria-label={`Agregar ${perfume.name} al pedido`}
          className="absolute inset-x-3 bottom-3 z-20 hidden h-11 items-center justify-center gap-2 rounded-full bg-ink text-[10px] font-medium uppercase tracking-[0.22em] text-ivory opacity-0 translate-y-3 transition-all duration-500 ease-lux hover:bg-black group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 sm:flex"
        >
          {added ? <><Check size={13} /> Agregado</> : <><Plus size={13} /> Agregar al pedido</>}
        </button>
        <button
          onClick={handleAdd}
          aria-label={`Agregar ${perfume.name} al pedido`}
          className="absolute bottom-2.5 right-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ivory shadow-lg transition-transform active:scale-90 sm:hidden"
        >
          {added ? <Check size={15} /> : <Plus size={15} />}
        </button>
      </div>

      {/* ── Info ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col pt-4 sm:pt-5">
        <p className="eyebrow text-[9px] text-muted">{perfume.brand}</p>
        <h3 className="display mt-2 line-clamp-2 text-[1.3rem] leading-[1.1] sm:text-2xl">
          <Link href={href} className="after:absolute after:inset-0 after:z-10 after:content-['']">
            {perfume.name}
          </Link>
        </h3>
        <p className="mt-2 text-[11px] tracking-wide text-faint">
          {perfume.concentration} · {perfume.volume_ml} ml · {GENDER_LABELS[perfume.gender]}
        </p>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-3">
          <span className="text-[15px] font-medium text-ink">{formatPrice(perfume.price)}</span>
          {discount && perfume.original_price && (
            <span className="text-xs text-faint line-through">{formatPrice(perfume.original_price)}</span>
          )}
        </div>
        {showSavings && discount && perfume.original_price && (
          <p className="mt-1 text-[11px] font-medium text-rose">Ahorras {formatPrice(perfume.original_price - perfume.price)}</p>
        )}
        <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${perfume.in_stock ? 'text-ink-soft' : 'text-muted'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${perfume.in_stock ? 'bg-emerald-600' : 'border border-faint'}`} />
          {stockLabel(perfume)}
        </p>
      </div>
    </article>
  )
}
