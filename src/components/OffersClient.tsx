'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Perfume, Category, CATEGORY_LABELS } from '@/types/perfume'
import { useLivePerfumes } from '@/context/AdminContext'
import { discountPct, formatPrice } from '@/lib/brand'
import PerfumeCard from './PerfumeCard'
import Reveal from './ui/Reveal'

const ORDER: Category[] = ['arabe', 'disenador', 'otros']

/** Active offer = previous price above the current one. In stock first, then biggest discount. */
export function activeOffers(list: Perfume[]) {
  return list
    .filter(p => discountPct(p))
    .sort((a, b) =>
      Number(b.in_stock) - Number(a.in_stock) ||
      (discountPct(b) ?? 0) - (discountPct(a) ?? 0))
}

export default function OffersClient({ perfumes: server }: { perfumes: Perfume[] }) {
  const perfumes = useLivePerfumes(server)
  const offers = useMemo(() => activeOffers(perfumes), [perfumes])
  const [cat, setCat] = useState<Category | null>(null)

  const tabs = ORDER
    .map(c => [c, offers.filter(p => (p.category === 'nicho' ? 'otros' : p.category) === c).length] as const)
    .filter(([, n]) => n > 0)
  const shown = cat ? offers.filter(p => (p.category === 'nicho' ? 'otros' : p.category) === cat) : offers

  const maxPct = Math.max(0, ...offers.map(p => discountPct(p) ?? 0))
  const totalSave = offers.reduce((s, p) => s + ((p.original_price ?? p.price) - p.price), 0)

  return (
    <main className="bg-ivory">
      {/* Hero */}
      <section className="relative grain overflow-hidden bg-velvet text-ivory">
        <div
          className="pointer-events-none absolute -top-1/2 right-[-10%] h-[70vh] w-[70vh] rounded-full blur-3xl anim-glow"
          style={{ background: 'radial-gradient(closest-side, rgba(122,38,48,0.7), transparent)' }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow mb-6 flex items-center gap-4 text-rose-light anim-fade-up">
              <span className="h-px w-10 bg-rose-light/60 anim-draw" />
              Ofertas activas
            </p>
            <h1 className="display text-[clamp(3.2rem,8vw,6.5rem)]">
              <span className="line-mask"><span style={{ animationDelay: '120ms' }}>Tu favorita,</span></span>
              <span className="line-mask">
                <span style={{ animationDelay: '240ms' }}>
                  <em className="font-light text-rose-light">a mejor precio.</em>
                </span>
              </span>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ivory/60 anim-fade-up" style={{ animationDelay: '420ms' }}>
              Fragancias 100% originales con descuento. Por tiempo limitado o hasta agotar existencias.
            </p>
          </div>

          {offers.length > 0 && (
            <dl className="grid grid-cols-3 gap-8 border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0 anim-fade-up" style={{ animationDelay: '520ms' }}>
              <div>
                <dt className="display text-5xl text-rose-light">−{maxPct}%</dt>
                <dd className="eyebrow mt-2 text-[9px] text-ivory/45">Hasta</dd>
              </div>
              <div>
                <dt className="display text-5xl">{offers.length}</dt>
                <dd className="eyebrow mt-2 text-[9px] text-ivory/45">{offers.length === 1 ? 'Oferta' : 'Ofertas'}</dd>
              </div>
              <div>
                <dt className="display text-5xl">{formatPrice(totalSave)}</dt>
                <dd className="eyebrow mt-2 text-[9px] text-ivory/45">En ahorro</dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 sm:pb-32">
        {offers.length === 0 ? (
          <div className="flex flex-col items-center py-32 text-center">
            <p className="display text-4xl sm:text-5xl">Por ahora no hay <em className="text-rose">ofertas.</em></p>
            <p className="mt-4 max-w-sm text-sm text-muted">
              Las publicamos aquí en cuanto haya nuevas. Mientras, explora la colección completa.
            </p>
            <Link href="/#coleccion" className="btn btn-ink mt-8 group">
              Ver colección <ArrowRight size={15} className="transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
          </div>
        ) : (
          <>
            {tabs.length > 1 && (
              <div className="no-scrollbar -mx-5 mt-10 flex gap-7 overflow-x-auto border-b border-line px-5 sm:mx-0 sm:px-0">
                {[[null, offers.length] as const, ...tabs].map(([c, n]) => {
                  const active = c === cat
                  return (
                    <button
                      key={c ?? 'all'}
                      onClick={() => setCat(c)}
                      className={`relative shrink-0 py-4 text-[11px] uppercase tracking-[0.2em] transition-colors ${active ? 'text-ink' : 'text-faint hover:text-ink-soft'}`}
                    >
                      {c ? CATEGORY_LABELS[c] : 'Todas'}
                      <sup className="ml-1 text-[8px] tracking-normal">{n}</sup>
                      <span className={`absolute inset-x-0 bottom-0 h-px bg-ink transition-transform duration-500 ease-lux ${active ? 'scale-x-100' : 'scale-x-0'}`} />
                    </button>
                  )
                })}
              </div>
            )}

            <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 sm:gap-y-16 md:grid-cols-3 lg:grid-cols-4">
              {shown.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 90}>
                  <PerfumeCard perfume={p} priority={i < 4} showSavings />
                </Reveal>
              ))}
            </div>

            <p className="mt-16 text-center text-[12px] text-muted">
              Precios en MXN. Descuento sobre el precio anterior publicado en la tienda.
            </p>
          </>
        )}
      </section>
    </main>
  )
}
