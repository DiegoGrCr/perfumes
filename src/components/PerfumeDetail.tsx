'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Check, MessageCircle, ShieldCheck, Sparkles, Clock, Wind,
  Leaf, Sun, Snowflake, CloudSun, Moon, Briefcase, Heart, Coffee, Zap, Pencil, Pin, ArrowRight,
} from 'lucide-react'
import { Perfume, Decant, CATEGORY_LABELS, GENDER_LABELS } from '@/types/perfume'
import { useCart } from '@/context/CartContext'
import { discountPct, formatPrice, orderedImages, stockLabel, waLink } from '@/lib/brand'
import { useAdmin, useLivePerfume } from '@/context/AdminContext'
import BottleSilhouette from '@/components/ui/BottleSilhouette'
import Reveal from '@/components/ui/Reveal'
import PerfumeCard from '@/components/PerfumeCard'
import DecantPicker from '@/components/DecantPicker'

const SEASON_ICONS: Record<string, React.ReactNode> = {
  Primavera: <Leaf size={16} strokeWidth={1.3} />,
  Verano:    <Sun size={16} strokeWidth={1.3} />,
  Otoño:     <CloudSun size={16} strokeWidth={1.3} />,
  Invierno:  <Snowflake size={16} strokeWidth={1.3} />,
}
const OCCASION_ICONS: Record<string, React.ReactNode> = {
  Día:                <Sun size={16} strokeWidth={1.3} />,
  Noche:              <Moon size={16} strokeWidth={1.3} />,
  Trabajo:            <Briefcase size={16} strokeWidth={1.3} />,
  Romántico:          <Heart size={16} strokeWidth={1.3} />,
  Casual:             <Coffee size={16} strokeWidth={1.3} />,
  Sport:              <Zap size={16} strokeWidth={1.3} />,
  'Ocasión especial': <Sparkles size={16} strokeWidth={1.3} />,
}

function SectionHeading({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div className="mb-12 sm:mb-16">
      <p className="eyebrow mb-4 text-rose">{kicker}</p>
      <h2 className="display text-4xl sm:text-5xl lg:text-6xl">{children}</h2>
    </div>
  )
}

export function PerfumeDetail({ perfume: base, related = [], decants = [] }: { perfume: Perfume; related?: Perfume[]; decants?: Decant[] }) {
  const { addItem, flyToCart, openDrawer } = useCart()
  const { isAdmin, openEditor, save } = useAdmin()
  const perfume = useLivePerfume(base)

  // Always open a product at the top (photo + description in view), no matter
  // how far down the catalog the visitor was when they tapped it.
  useLayoutEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [base.id])
  const images = orderedImages(perfume)
  const [imgIdx, setImgIdx] = useState(0)
  const [added, setAdded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const discount = discountPct(perfume)
  const titleSize =
    perfume.name.length > 40 ? 'text-[clamp(2.1rem,4vw,3.1rem)]'
    : perfume.name.length > 22 ? 'text-[clamp(2.4rem,5vw,3.9rem)]'
    : 'text-[clamp(2.8rem,6vw,4.75rem)]'

  const tiers = [
    { title: 'Salida',  sub: 'Primera impresión · 15–30 min', notes: perfume.notes_top },
    { title: 'Corazón', sub: 'El alma · 2–4 horas',           notes: perfume.notes_heart },
    { title: 'Fondo',   sub: 'La huella · toda la jornada',  notes: perfume.notes_base },
  ].filter(t => (t.notes?.length ?? 0) > 0)

  const profile = [
    perfume.scent_type && { icon: <Sparkles size={16} strokeWidth={1.3} />, label: 'Familia', value: perfume.scent_type },
    perfume.longevity  && { icon: <Clock size={16} strokeWidth={1.3} />,    label: 'Duración', value: perfume.longevity },
    perfume.sillage    && { icon: <Wind size={16} strokeWidth={1.3} />,     label: 'Estela', value: perfume.sillage },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[]

  const hasRecs = (perfume.seasons?.length ?? 0) + (perfume.occasions?.length ?? 0) > 0

  function handleAdd(e: React.MouseEvent) {
    addItem(perfume, perfume.volume_ml)
    flyToCart(imgRef.current ?? (e.currentTarget as HTMLElement), images[imgIdx]?.url)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <main className="bg-ivory">
      {/* Breadcrumb */}
      <nav className="mx-auto max-w-7xl px-5 pt-8 sm:px-8" aria-label="Ruta">
        <ol className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-faint">
          <li><Link href="/" className="link-underline hover:text-ink">Inicio</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/#coleccion" className="link-underline hover:text-ink">{CATEGORY_LABELS[perfume.category]}</Link></li>
          <li aria-hidden>/</li>
          <li className="max-w-[50vw] truncate text-ink-soft">{perfume.name}</li>
        </ol>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-24 pt-8 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:pb-32">
        {/* Gallery */}
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-24 flex flex-col-reverse gap-4 sm:flex-row">
            {images.length > 1 && (
              <div className="no-scrollbar flex gap-3 overflow-x-auto p-1 sm:flex-col sm:overflow-visible sm:p-0">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setImgIdx(i)}
                    aria-label={`Imagen ${i + 1}`}
                    className={`relative h-20 w-16 shrink-0 overflow-hidden bg-sand transition-all duration-500 ease-lux sm:h-24 sm:w-20 ${
                      i === imgIdx ? 'opacity-100 ring-1 ring-ink ring-offset-2 ring-offset-ivory' : 'opacity-50 hover:opacity-90'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-contain p-2" />
                  </button>
                ))}
              </div>
            )}

            <div className="group relative aspect-[4/5] flex-1 overflow-hidden bg-sand anim-fade-in lg:aspect-square">
              <div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(55% 45% at 50% 45%, rgba(255,255,255,0.95), transparent 72%)' }}
              />
              {images.length > 0 ? (
                images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id}
                    ref={i === imgIdx ? imgRef : undefined}
                    src={img.url}
                    alt={i === 0 ? perfume.name : ''}
                    className="absolute inset-0 h-full w-full object-contain p-[12%] drop-shadow-[0_30px_30px_rgba(23,18,15,0.2)] transition-all duration-[900ms] ease-lux"
                    style={{
                      opacity: i === imgIdx ? 1 : 0,
                      transform: i === imgIdx ? 'scale(1)' : 'scale(0.94)',
                    }}
                  />
                ))
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BottleSilhouette className="h-1/2 w-auto" />
                </div>
              )}

              <div className="pointer-events-none absolute left-5 top-5 flex flex-col items-start gap-2">
                {perfume.featured && <span className="eyebrow rounded-full bg-paper/90 px-3 py-1.5 text-[8px] backdrop-blur">Destacado</span>}
              </div>
              {discount && (
                <span className="absolute right-5 top-5 rounded-full bg-rose px-3 py-1.5 text-xs font-medium text-paper">−{discount}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-5 lg:pt-6">
          {isAdmin && (
            <div className="mb-6 flex flex-wrap items-center gap-2 rounded-full border border-line bg-paper p-1.5 pl-4">
              <span className="eyebrow mr-auto text-[8px] text-rose">Admin</span>
              <button
                onClick={() => save(perfume, { in_stock: !perfume.in_stock })}
                className="rounded-full px-3 py-1.5 text-[11px] text-ink-soft transition-colors hover:bg-sand"
              >
                {perfume.in_stock ? 'Marcar sobre pedido' : 'Marcar en existencia'}
              </button>
              <button
                onClick={() => save(perfume, { featured: !perfume.featured })}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] transition-colors ${perfume.featured ? 'bg-sand text-ink' : 'text-ink-soft hover:bg-sand'}`}
              >
                <Pin size={12} className={perfume.featured ? 'fill-current' : ''} /> {perfume.featured ? 'Fijado' : 'Fijar'}
              </button>
              <button
                onClick={() => openEditor(perfume)}
                className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-[11px] text-ivory transition-colors hover:bg-black"
              >
                <Pencil size={12} /> Editar
              </button>
            </div>
          )}
          <p className="eyebrow text-muted anim-fade-up" style={{ animationDelay: '100ms' }}>{perfume.brand}</p>
          <h1 className={`display mt-4 leading-[1] ${titleSize}`}>
            <span className="line-mask"><span style={{ animationDelay: '180ms' }}>{perfume.name}</span></span>
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-muted anim-fade-up" style={{ animationDelay: '320ms' }}>
            <span>{perfume.concentration}</span>
            <span className="h-3 w-px bg-line" />
            <span>{perfume.volume_ml} ml</span>
            <span className="h-3 w-px bg-line" />
            <span>{GENDER_LABELS[perfume.gender]}</span>
          </div>

          {discount && perfume.original_price && (
            <Link
              href="/ofertas"
              className="group mt-8 flex items-center justify-between gap-4 rounded-full bg-wine py-2 pl-2 pr-5 text-ivory anim-fade-up"
              style={{ animationDelay: '380ms' }}
            >
              <span className="flex items-center gap-3">
                <span className="display flex h-9 items-center rounded-full bg-rose-light px-3 text-[15px] font-medium text-velvet">−{discount}%</span>
                <span className="text-[12px]">
                  <span className="eyebrow mr-2 text-[8px] text-rose-light">Oferta</span>
                  Ahorras {formatPrice(perfume.original_price - perfume.price)}
                </span>
              </span>
              <span className="hidden items-center gap-1 text-[11px] text-ivory/60 transition-colors group-hover:text-ivory sm:flex">
                Más ofertas <ArrowRight size={12} className="transition-transform duration-500 group-hover:translate-x-1" />
              </span>
            </Link>
          )}

          <div className={`${discount ? 'mt-4' : 'mt-8'} flex items-baseline gap-3 border-y border-line py-6 anim-fade-up`} style={{ animationDelay: '420ms' }}>
            <span className="display text-5xl">{formatPrice(perfume.price)}</span>
            {discount && perfume.original_price && (
              <span className="text-lg text-faint line-through">{formatPrice(perfume.original_price)}</span>
            )}
            <span className={`ml-auto flex items-center gap-2 text-[11px] ${perfume.in_stock ? 'text-ink-soft' : 'text-muted'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${perfume.in_stock ? 'bg-emerald-600' : 'border border-faint'}`} />
              {stockLabel(perfume)}
            </span>
          </div>

          {!perfume.in_stock && (
            <p className="mt-4 text-[12px] leading-relaxed text-muted">
              La conseguimos para ti. Te confirmamos el tiempo de entrega por WhatsApp antes de cualquier pago.
            </p>
          )}

          {perfume.description && (
            <p className="mt-8 text-[15px] leading-[1.8] text-ink-soft anim-fade-up" style={{ animationDelay: '520ms' }}>
              {perfume.description}
            </p>
          )}

          {(perfume.available_volumes?.length ?? 0) > 1 && (
            <div className="mt-8 anim-fade-up" style={{ animationDelay: '580ms' }}>
              <p className="eyebrow mb-3 text-[9px] text-muted">También disponible en</p>
              <div className="flex flex-wrap gap-2">
                {perfume.available_volumes!.map(v => (
                  <span key={v} className={`rounded-full border px-4 py-2 text-[12px] ${v === perfume.volume_ml ? 'border-ink text-ink' : 'border-line text-muted'}`}>
                    {v} ml
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 anim-fade-up" style={{ animationDelay: '640ms' }}>
            <button onClick={handleAdd} className="btn btn-ink w-full">
              {added ? <><Check size={15} /> Agregado a tu pedido</> : <><Plus size={15} /> Agregar al pedido</>}
            </button>
            <div className={`grid transition-all duration-500 ease-lux ${added ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <button onClick={openDrawer} className="overflow-hidden text-[11px] uppercase tracking-[0.2em] text-rose link-underline justify-self-center">
                Ver mi pedido →
              </button>
            </div>
            <a
              href={waLink(`¡Hola! Me interesa: ${perfume.name} (${perfume.brand}) – ${perfume.volume_ml}ml. ${perfume.in_stock ? '¿Está disponible?' : '¿Cuál es el tiempo de entrega sobre pedido?'}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost w-full"
            >
              <MessageCircle size={15} /> Preguntar por WhatsApp
            </a>
          </div>

          {decants.length > 0 && (
            <div id="decants" className="mt-10 border-t border-line pt-8 anim-fade-up" style={{ animationDelay: '680ms' }}>
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="display text-3xl">También en <em className="text-rose">decant</em></h2>
                <Link href="/decants" className="link-underline text-[11px] uppercase tracking-[0.2em] text-muted hover:text-ink">Ver todos</Link>
              </div>
              <p className="mb-5 text-[13px] leading-relaxed text-muted">Pruébalo antes del frasco completo: envasado de la botella original, con atomizador.</p>
              <DecantPicker perfume={perfume} decants={decants} />
            </div>
          )}

          <ul className="mt-10 grid grid-cols-2 gap-4 border-t border-line pt-8 text-[12px] text-muted anim-fade-up" style={{ animationDelay: '720ms' }}>
            <li className="flex items-start gap-3"><ShieldCheck size={16} strokeWidth={1.3} className="mt-0.5 shrink-0 text-rose" /> 100% original y sellado</li>
            <li className="flex items-start gap-3"><MessageCircle size={16} strokeWidth={1.3} className="mt-0.5 shrink-0 text-rose" /> Asesoría personalizada</li>
          </ul>

          {profile.length > 0 && (
            <dl
              className="mt-8 grid divide-x divide-line border border-line bg-paper anim-fade-up"
              style={{ animationDelay: '780ms', gridTemplateColumns: `repeat(${profile.length}, minmax(0, 1fr))` }}
            >
              {profile.map(p => (
                <div key={p.label} className="flex flex-col items-center gap-2 px-2 py-5 text-center">
                  <span className="text-rose">{p.icon}</span>
                  <dt className="eyebrow text-[8px] text-faint">{p.label}</dt>
                  <dd className="display text-lg leading-tight">{p.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* ── Olfactory pyramid ───────────────────────── */}
      {tiers.length > 0 && (
        <section className="border-t border-line bg-paper">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
            <Reveal>
              <SectionHeading kicker="Pirámide olfativa">
                Cómo <em className="text-rose">evoluciona</em> en tu piel
              </SectionHeading>
            </Reveal>
            <div className={`grid gap-px bg-line ${tiers.length === 3 ? 'md:grid-cols-3' : tiers.length === 2 ? 'md:grid-cols-2' : ''}`}>
              {tiers.map((t, i) => (
                <Reveal key={t.title} delay={i * 140} className="bg-paper">
                  <div className="group h-full p-8 sm:p-10">
                    <div className="flex items-baseline justify-between">
                      <span className="display text-6xl italic text-rose/40 transition-colors duration-700 group-hover:text-rose">
                        0{i + 1}
                      </span>
                      <span className="eyebrow text-[8px] text-faint">{t.sub.split(' · ')[1]}</span>
                    </div>
                    <h3 className="display mt-8 text-4xl">{t.title}</h3>
                    <p className="mt-2 text-[12px] text-muted">{t.sub.split(' · ')[0]}</p>
                    <ul className="mt-8 flex flex-wrap gap-2">
                      {t.notes!.map(n => (
                        <li key={n} className="rounded-full border border-line px-3.5 py-1.5 text-[12px] text-ink-soft transition-colors duration-300 hover:border-rose hover:text-rose">
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Ideal for ───────────────────────────────── */}
      {hasRecs && (
        <section className="border-t border-line">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <SectionHeading kicker="Cuándo usarlo">
                Ideal <em className="text-rose">para</em>
              </SectionHeading>
            </Reveal>
            <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8">
              {[
                { title: 'Temporadas', items: perfume.seasons ?? [], icons: SEASON_ICONS },
                { title: 'Ocasiones',  items: perfume.occasions ?? [], icons: OCCASION_ICONS },
              ].filter(g => g.items.length > 0).map((g, gi) => (
                <Reveal key={g.title} delay={gi * 120}>
                  <p className="eyebrow mb-5 text-[9px] text-muted">{g.title}</p>
                  <ul className="divide-y divide-line border-y border-line">
                    {g.items.map(it => (
                      <li key={it} className="flex items-center gap-4 py-4 text-[15px]">
                        <span className="text-rose">{g.icons[it] ?? <Sparkles size={16} strokeWidth={1.3} />}</span>
                        <span className="display text-2xl">{it}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Related ─────────────────────────────────── */}
      {related.length > 0 && (
        <section className="border-t border-line bg-paper">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
            <Reveal className="flex items-end justify-between gap-6">
              <SectionHeading kicker="Sigue explorando">
                También te puede <em className="text-rose">gustar</em>
              </SectionHeading>
              <Link href="/#coleccion" className="link-underline mb-16 hidden shrink-0 text-[11px] uppercase tracking-[0.2em] sm:block">
                Ver todo
              </Link>
            </Reveal>
            <div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 90}>
                  <PerfumeCard perfume={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-ivory/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] text-muted">{perfume.name}</p>
          <p className="display text-2xl leading-none">{formatPrice(perfume.price)}</p>
        </div>
        <button onClick={handleAdd} className="btn btn-ink h-12 px-6">
          {added ? <Check size={15} /> : <Plus size={15} />} {added ? 'Listo' : 'Agregar'}
        </button>
      </div>
      <div className="h-20 lg:hidden" />
    </main>
  )
}
