'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, Check, Droplet, ShieldCheck, Gift, ArrowRight, MessageCircle } from 'lucide-react'
import type { Decant, Perfume } from '@/types/perfume'
import { GENDER_LABELS } from '@/types/perfume'
import { useCart } from '@/context/CartContext'
import { decantImage } from '@/lib/decants'
import { cleanNameOf } from '@/lib/names'
import { formatPrice, waLink } from '@/lib/brand'
import Reveal from './ui/Reveal'

type Group = { perfume: Perfume; decants: Decant[] }

/** The joined perfume of a decant, shaped as a Perfume for the cart. */
function asPerfume(d: Decant): Perfume {
  return { description: '', price: 0, featured: false, created_at: '', ...d.perfume } as Perfume
}

function Card({ perfume, decants }: Group) {
  const { addItem, flyToCart } = useCart()
  const img = useRef<HTMLImageElement>(null)
  const [added, setAdded] = useState<number | null>(null)
  const sorted = [...decants].sort((a, b) => a.volume_ml - b.volume_ml)

  function add(d: Decant) {
    const image = decantImage(perfume.id, d.volume_ml)
    addItem(perfume, d.volume_ml, { id: d.id, price: d.price, image })
    if (img.current) flyToCart(img.current, image)
    setAdded(d.volume_ml)
    setTimeout(() => setAdded(a => (a === d.volume_ml ? null : a)), 1600)
  }

  return (
    <article className="group flex flex-col">
      <Link href={`/perfume/${perfume.id}#decants`} className="relative block aspect-[4/5] overflow-hidden bg-sand">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(60% 50% at 50% 45%, rgba(255,255,255,0.9), transparent 70%)' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} src={decantImage(perfume.id, 'par')} alt={`Decants de ${perfume.name}`} loading="lazy"
          className="absolute inset-0 h-full w-full object-contain p-[8%] drop-shadow-[0_18px_18px_rgba(23,18,15,0.18)] transition-transform duration-[900ms] ease-lux group-hover:scale-[1.05]" />
      </Link>
      <div className="pt-4">
        <p className="eyebrow text-[9px] text-muted">{perfume.brand}</p>
        <h3 className="display mt-2 line-clamp-2 text-2xl leading-[1.1]">
          <Link href={`/perfume/${perfume.id}`} className="hover:text-rose">{cleanNameOf(perfume)}</Link>
        </h3>
        <p className="mt-1.5 text-[11px] text-faint">{perfume.concentration} · {GENDER_LABELS[perfume.gender] ?? ''}</p>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {sorted.map(d => (
            <div key={d.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[13px]"><span className="display text-xl">{d.volume_ml} ml</span></span>
              <span className="ml-auto text-[14px] font-medium">{formatPrice(d.price)}</span>
              {d.in_stock ? (
                <button onClick={() => add(d)} aria-label={`Agregar decant ${d.volume_ml} ml`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ivory transition-transform hover:scale-105 active:scale-95">
                  {added === d.volume_ml ? <Check size={14} /> : <Plus size={14} />}
                </button>
              ) : (
                <span className="w-9 text-right text-[10px] text-muted">Agotado</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function DecantsClient({ decants }: { decants: Decant[] }) {
  const groups = useMemo<Group[]>(() => {
    const m = new Map<string, Group>()
    for (const d of decants) {
      if (!d.perfume) continue
      const g = m.get(d.perfume_id) ?? { perfume: asPerfume(d), decants: [] }
      g.decants.push(d)
      m.set(d.perfume_id, g)
    }
    return [...m.values()].sort((a, b) => a.perfume.brand.localeCompare(b.perfume.brand))
  }, [decants])

  const from = decants.length ? Math.min(...decants.map(d => d.price)) : 0

  return (
    <main className="bg-ivory">
      {/* Hero */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-6 flex items-center gap-4 text-rose anim-fade-up">
              <span className="h-px w-10 bg-rose/60 anim-draw" /> Decants 5 y 10 ml
            </p>
            <h1 className="display text-[clamp(3rem,7vw,6rem)]">
              <span className="line-mask"><span style={{ animationDelay: '120ms' }}>Pruébalo</span></span>
              <span className="line-mask"><span style={{ animationDelay: '240ms' }}><em className="font-light text-rose">antes del frasco.</em></span></span>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted anim-fade-up" style={{ animationDelay: '400ms' }}>
              Fragancias originales envasadas en atomizadores de 5 y 10 ml. Ideales para descubrir tu próxima favorita, viajar o regalar.
            </p>
            {from > 0 && (
              <p className="mt-6 text-[13px] text-ink-soft anim-fade-up" style={{ animationDelay: '480ms' }}>
                Desde <span className="display text-3xl">{formatPrice(from)}</span>
              </p>
            )}
          </div>
          <div className="relative hidden aspect-[7/6] lg:col-span-5 lg:block anim-fade-in">
            <div className="absolute inset-[8%] rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(228,184,172,.45), transparent)' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={groups[0] ? decantImage(groups[0].perfume.id, 'par') : '/decants/generico-par.png'} alt="" className="relative h-full w-full object-contain anim-float drop-shadow-[0_30px_30px_rgba(23,18,15,0.22)]" />
          </div>
        </div>
      </section>

      {/* Why decants */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-px bg-line sm:grid-cols-3">
          {[
            { icon: <Droplet size={18} strokeWidth={1.3} />, t: 'Prueba sin arriesgar', d: 'Conoce cómo evoluciona en tu piel antes de invertir en el frasco.' },
            { icon: <ShieldCheck size={18} strokeWidth={1.3} />, t: '100% originales', d: 'Envasados directamente de botellas originales.' },
            { icon: <Gift size={18} strokeWidth={1.3} />, t: 'Para viaje o regalo', d: 'Atomizador de cristal, práctico y elegante.' },
          ].map(x => (
            <div key={x.t} className="bg-ivory px-6 py-8 sm:px-8">
              <span className="text-rose">{x.icon}</span>
              <h3 className="display mt-3 text-2xl">{x.t}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="display text-4xl sm:text-5xl">Muy <em className="text-rose">pronto.</em></p>
            <p className="mt-4 max-w-sm text-sm text-muted">Estamos preparando nuestros decants. Si buscas uno en especial, escríbenos y te avisamos.</p>
            <a href={waLink('¡Hola! Me interesan los decants. ¿Qué fragancias tienen disponibles?')} target="_blank" rel="noopener noreferrer" className="btn btn-ink mt-8">
              <MessageCircle size={15} /> Preguntar por WhatsApp
            </a>
          </div>
        ) : (
          <>
            <Reveal className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="display text-5xl sm:text-6xl">Decants <em className="text-rose">disponibles</em></h2>
              <Link href="/#coleccion" className="link-underline flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted hover:text-ink">
                Ver frascos completos <ArrowRight size={13} />
              </Link>
            </Reveal>
            <div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
              {groups.map((g, i) => (
                <Reveal key={g.perfume.id} delay={(i % 4) * 90}><Card {...g} /></Reveal>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
