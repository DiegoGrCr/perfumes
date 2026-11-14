'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Perfume } from '@/types/perfume'
import { formatPrice, primaryImage, waLink } from '@/lib/brand'
import BottleSilhouette from '@/components/ui/BottleSilhouette'

const SLIDE_MS = 5000

interface Props {
  showcase: Perfume[]
  totalCount: number
  brandCount: number
}

export default function Hero({ showcase, totalCount, brandCount }: Props) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const count = showcase.length

  useEffect(() => {
    if (count <= 1 || paused) return
    const id = setTimeout(() => setIdx(i => (i + 1) % count), SLIDE_MS)
    return () => clearTimeout(id)
  }, [idx, count, paused])

  // Subtle 3D tilt following the pointer
  function onMove(e: React.PointerEvent) {
    const el = stageRef.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`)
    el.style.setProperty('--tx', `${(x * 18).toFixed(1)}px`)
    el.style.setProperty('--ty', `${(y * 18).toFixed(1)}px`)
  }
  function onLeave() {
    const el = stageRef.current
    if (!el) return
    ;['--rx', '--ry'].forEach(p => el.style.setProperty(p, '0deg'))
    ;['--tx', '--ty'].forEach(p => el.style.setProperty(p, '0px'))
    setPaused(false)
  }

  const current = showcase[idx]

  return (
    <section className="relative grain overflow-hidden bg-velvet text-ivory">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-1/3 right-[-10%] h-[90vh] w-[90vh] rounded-full blur-3xl anim-glow"
          style={{ background: 'radial-gradient(closest-side, rgba(122,38,48,0.75), transparent)' }}
        />
        <div
          className="absolute bottom-[-30%] left-[-15%] h-[70vh] w-[70vh] rounded-full blur-3xl opacity-60"
          style={{ background: 'radial-gradient(closest-side, rgba(74,26,31,0.9), transparent)' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,12,11,0)_60%,rgba(18,12,11,0.9)_100%)]" />
      </div>

      <div className="relative mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-6 sm:gap-10 px-5 pt-28 pb-20 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:pt-40 lg:pb-24">
        {/* ── Copy ─────────────────────────────────── */}
        <div className="lg:col-span-7 order-2 lg:order-1">
          <p className="eyebrow mb-7 flex items-center gap-4 text-rose-light anim-fade-up" style={{ animationDelay: '150ms' }}>
            <span className="h-px w-10 bg-rose-light/60 anim-draw" style={{ animationDelay: '300ms' }} />
            Fragancias originales
          </p>

          <h1 className="display text-[clamp(3.4rem,9vw,7.25rem)]">
            <span className="line-mask"><span style={{ animationDelay: '250ms' }}>El arte</span></span>
            <span className="line-mask"><span style={{ animationDelay: '380ms' }}>de dejar</span></span>
            <span className="line-mask">
              <span style={{ animationDelay: '510ms' }}>
                <em className="font-light text-rose-light">huella.</em>
              </span>
            </span>
          </h1>

          <p
            className="mt-7 max-w-md text-[15px] leading-relaxed text-ivory/65 anim-fade-up"
            style={{ animationDelay: '800ms' }}
          >
            Árabes y de diseñador, elegidas una a una.
            Encuentra la fragancia que habla por ti antes de que digas una palabra.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 anim-fade-up" style={{ animationDelay: '950ms' }}>
            <Link href="#coleccion" className="btn btn-rose group">
              Explorar colección
              <ArrowRight size={15} className="transition-transform duration-500 ease-lux group-hover:translate-x-1" />
            </Link>
            <a
              href={waLink('¡Hola! Me gustaría asesoría para elegir una fragancia.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost-light"
            >
              <MessageCircle size={15} /> Asesoría
            </a>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-8 anim-fade-up" style={{ animationDelay: '1100ms' }}>
            {[
              { v: `${totalCount}+`, l: 'Fragancias' },
              { v: `${brandCount}`, l: 'Casas' },
              { v: '100%', l: 'Originales' },
            ].map(s => (
              <div key={s.l}>
                <dt className="display text-4xl text-ivory">{s.v}</dt>
                <dd className="eyebrow mt-2 text-[9px] text-ivory/45">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Showcase ─────────────────────────────── */}
        <div
          className="order-1 lg:order-2 lg:col-span-5 anim-fade-in"
          style={{ animationDelay: '200ms' }}
          onPointerMove={onMove}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={onLeave}
        >
          <div
            ref={stageRef}
            className="relative mx-auto aspect-square w-full max-w-[210px] sm:max-w-[400px] lg:max-w-none [perspective:1200px]"
          >
            {/* Rings */}
            <div className="absolute inset-[6%] rounded-full border border-white/10" />
            <div className="absolute inset-[14%] rounded-full border border-dashed border-rose-light/20 anim-spin-slow" />
            <div
              className="absolute inset-[18%] rounded-full blur-2xl anim-glow"
              style={{ background: 'radial-gradient(closest-side, rgba(228,184,172,0.32), rgba(122,38,48,0.15) 60%, transparent)' }}
            />

            {/* Bottles */}
            <div
              className="absolute inset-0 transition-transform duration-700 ease-out"
              style={{ transform: 'rotateX(var(--rx,0)) rotateY(var(--ry,0)) translate3d(var(--tx,0),var(--ty,0),0)' }}
            >
              <div className="absolute inset-[12%] anim-float">
                {count === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <BottleSilhouette tone="dark" className="h-3/4 w-auto" />
                  </div>
                ) : (
                  showcase.map((p, i) => {
                    const src = primaryImage(p)
                    const active = i === idx
                    return (
                      <div
                        key={p.id}
                        className="absolute inset-0 flex items-center justify-center transition-all duration-[1400ms] ease-lux"
                        style={{
                          opacity: active ? 1 : 0,
                          transform: active ? 'scale(1) translateY(0)' : 'scale(0.86) translateY(24px)',
                          filter: active ? 'blur(0)' : 'blur(8px)',
                        }}
                        aria-hidden={!active}
                      >
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt={p.name}
                            className="max-h-full max-w-full object-contain drop-shadow-[0_40px_50px_rgba(0,0,0,0.6)]"
                            loading={i === 0 ? 'eager' : 'lazy'}
                          />
                        ) : (
                          <BottleSilhouette tone="dark" className="h-3/4 w-auto" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Floor reflection */}
            <div className="absolute bottom-[6%] left-1/2 h-6 w-1/2 -translate-x-1/2 rounded-[50%] bg-black/60 blur-xl" />
          </div>

          {/* Caption + progress */}
          {current && (
            <div className="mx-auto mt-2 flex max-w-[420px] items-end justify-between gap-6 lg:max-w-none">
              <Link href={`/perfume/${current.id}`} className="group min-w-0" key={current.id}>
                <p className="eyebrow text-[9px] text-rose-light anim-fade-up">{current.brand}</p>
                <p className="display mt-1 truncate text-xl sm:text-3xl text-ivory anim-fade-up" style={{ animationDelay: '80ms' }}>
                  {current.name}
                </p>
                <p className="mt-2 flex items-center gap-3 text-sm text-ivory/60 anim-fade-up" style={{ animationDelay: '160ms' }}>
                  {formatPrice(current.price)}
                  <span className="inline-flex items-center gap-1 eyebrow text-[9px] text-ivory/80 transition-colors group-hover:text-rose-light">
                    Ver <ArrowRight size={11} className="transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </p>
              </Link>

              {count > 1 && (
                <div className="flex shrink-0 gap-1.5 pb-1">
                  {showcase.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setIdx(i)}
                      aria-label={`Ver ${p.name}`}
                      className="relative h-[2px] w-7 overflow-hidden rounded-full bg-white/15"
                    >
                      <span
                        key={`${idx}-${paused}`}
                        className="absolute inset-y-0 left-0 bg-rose-light"
                        style={{
                          width: i < idx ? '100%' : i === idx ? '100%' : '0%',
                          transformOrigin: 'left',
                          animation: i === idx && !paused ? `drawLine ${SLIDE_MS}ms linear both` : undefined,
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#familias"
        aria-label="Desplazarse"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex"
      >
        <span className="eyebrow text-[8px] text-ivory/40">Descubre</span>
        <span className="relative h-10 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-rose-light" style={{ animation: 'scrollCue 2.2s ease-in-out infinite' }} />
        </span>
      </a>
    </section>
  )
}
