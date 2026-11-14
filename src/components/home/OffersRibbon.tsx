'use client'

import Link from 'next/link'
import { useOffers } from '@/context/OffersContext'

/** Slow, wine-coloured ticker under the hero that links to the offers page. */
export default function OffersRibbon() {
  const { count, maxPct } = useOffers()
  if (count === 0) return null

  const items = [
    'Ofertas activas',
    `Hasta −${maxPct}%`,
    `${count} ${count === 1 ? 'fragancia' : 'fragancias'} con descuento`,
    'Ver ofertas →',
  ]
  const row = [...items, ...items, ...items, ...items]

  return (
    <Link
      href="/ofertas"
      aria-label={`Ver ofertas activas: hasta ${maxPct}% de descuento`}
      className="marquee group relative block overflow-hidden bg-wine py-4 text-rose-light"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-wine to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-wine to-transparent" />
      <div className="marquee-track items-center [animation-direction:reverse] [animation-duration:55s]">
        {[...row, ...row].map((t, i) => (
          <span key={i} className="flex items-center" aria-hidden>
            <span
              className={`whitespace-nowrap px-7 ${
                i % items.length === 1
                  ? 'display text-2xl italic text-ivory'
                  : 'eyebrow text-[10px] text-rose-light/90 transition-colors group-hover:text-ivory'
              }`}
            >
              {t}
            </span>
            <span className="text-[7px] text-rose-light/60">✦</span>
          </span>
        ))}
      </div>
    </Link>
  )
}
