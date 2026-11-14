'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Perfume } from '@/types/perfume'
import { useLivePerfumes } from '@/context/AdminContext'
import { discountPct } from '@/lib/brand'
import { activeOffers } from '@/components/OffersClient'
import PerfumeCard from '@/components/PerfumeCard'
import Reveal from '@/components/ui/Reveal'

const AUTO_MS = 4000

/** Offers carousel: snap-scrolling row, arrows, gentle auto-advance (paused on hover/touch). */
export default function OffersTeaser({ perfumes: server }: { perfumes: Perfume[] }) {
  const offers = activeOffers(useLivePerfumes(server))
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [edges, setEdges] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setProgress(max > 0 ? el.scrollLeft / max : 1)
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft > max - 8 })
  }, [])

  const step = useCallback((dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-slide]')
    const w = card ? card.offsetWidth + 24 : el.clientWidth * 0.8
    const max = el.scrollWidth - el.clientWidth
    // loop back to the start after the last card
    if (dir === 1 && el.scrollLeft > max - 8) el.scrollTo({ left: 0, behavior: 'smooth' })
    else el.scrollBy({ left: dir * w, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (paused || offers.length <= 2) return
    const id = setInterval(() => step(1), AUTO_MS)
    return () => clearInterval(id)
  }, [paused, offers.length, step])

  useEffect(() => { measure() }, [measure, offers.length])

  if (offers.length === 0) return null
  const maxPct = Math.max(...offers.map(p => discountPct(p) ?? 0))

  return (
    <section id="ofertas" className="overflow-hidden border-t border-line bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28">
        <Reveal className="mb-12 flex flex-col gap-6 sm:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-5 flex items-center gap-3 text-rose">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose" />
              </span>
              Ofertas activas
            </p>
            <h2 className="display text-5xl sm:text-6xl lg:text-7xl">
              Hasta <em className="text-rose">−{maxPct}%</em> hoy.
            </h2>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="hidden gap-2 sm:flex">
              {([-1, 1] as const).map(d => (
                <button
                  key={d}
                  onClick={() => step(d)}
                  disabled={d === -1 && edges.start}
                  aria-label={d === -1 ? 'Anterior' : 'Siguiente'}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink transition-all duration-500 ease-lux hover:border-ink hover:bg-ink hover:text-ivory disabled:pointer-events-none disabled:opacity-30"
                >
                  {d === -1 ? <ChevronLeft size={18} strokeWidth={1.4} /> : <ChevronRight size={18} strokeWidth={1.4} />}
                </button>
              ))}
            </div>
            <Link href="/ofertas" className="btn btn-ink group">
              Ver {offers.length} {offers.length === 1 ? 'oferta' : 'ofertas'}
              <ArrowRight size={15} className="transition-transform duration-500 ease-lux group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <div
          ref={trackRef}
          onScroll={measure}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 sm:-mx-8 sm:gap-6 sm:scroll-px-8 sm:px-8"
        >
          {offers.map((p, i) => (
            <div key={p.id} data-slide className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23.4%]">
              <Reveal delay={Math.min(i, 3) * 90}>
                <PerfumeCard perfume={p} showSavings />
              </Reveal>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mx-auto mt-10 h-px w-40 overflow-hidden bg-line">
          <div
            className="h-full bg-ink transition-[width] duration-500 ease-lux"
            style={{ width: `${Math.max(12, progress * 100)}%` }}
          />
        </div>
      </div>
    </section>
  )
}
