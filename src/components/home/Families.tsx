'use client'

import { ArrowUpRight } from 'lucide-react'
import { Category, CATEGORY_LABELS } from '@/types/perfume'
import Reveal from '@/components/ui/Reveal'
import BottleSilhouette from '@/components/ui/BottleSilhouette'

export interface FamilyInfo {
  category: Exclude<Category, 'nicho'>
  count: number
  images: string[]
}

const COPY: Record<Exclude<Category, 'nicho'>, { kicker: string; line: string }> = {
  arabe:     { kicker: 'Oriente',   line: 'Oud, ámbar y especias. Intensidad que perdura en la piel.' },
  disenador: { kicker: 'Iconos',    line: 'Las casas que definieron la perfumería moderna.' },
  otros:     { kicker: 'Hallazgos', line: 'Body mists, sprays y pequeños placeres diarios.' },
}

export function selectCategory(category: Category) {
  window.dispatchEvent(new CustomEvent('velvet:filter', { detail: { category } }))
  document.getElementById('coleccion')?.scrollIntoView({ behavior: 'smooth' })
}

export default function Families({ families }: { families: FamilyInfo[] }) {
  if (families.length === 0) return null

  return (
    <section id="familias" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="mb-14 flex flex-col gap-6 sm:mb-20 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-5 text-rose">Familias</p>
          <h2 className="display text-5xl sm:text-6xl lg:text-7xl">
            Elige tu <em className="text-rose">mundo.</em>
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Cada familia cuenta una historia distinta. Empieza por la que más se parece a ti.
        </p>
      </Reveal>

      <div className={`grid gap-4 sm:gap-6 ${families.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {families.map((f, i) => (
          <Reveal key={f.category} delay={i * 120}>
            <button
              onClick={() => selectCategory(f.category)}
              className="group relative flex h-[420px] w-full flex-col overflow-hidden rounded-[2px] bg-sand text-left sm:h-[520px]"
            >
              {/* Imagery */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="absolute h-[70%] aspect-square rounded-full opacity-70 blur-2xl transition-transform duration-[1200ms] ease-lux group-hover:scale-125"
                  style={{ background: 'radial-gradient(closest-side, #fff, transparent)' }}
                />
                {f.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.images[0]}
                    alt=""
                    className="relative -mt-10 h-[52%] w-[78%] object-contain drop-shadow-[0_28px_28px_rgba(23,18,15,0.22)] transition-transform duration-[1200ms] ease-lux group-hover:-translate-y-3 group-hover:scale-[1.06]"
                  />
                ) : (
                  <BottleSilhouette className="relative h-1/2 w-auto" />
                )}
              </div>

              {/* Copy */}
              <div className="relative z-10 flex items-start justify-between p-7">
                <span className="eyebrow text-[9px] text-muted">{COPY[f.category].kicker}</span>
                <span className="eyebrow text-[9px] text-muted">{String(f.count).padStart(2, '0')} piezas</span>
              </div>
              <div className="relative z-10 mt-auto bg-gradient-to-t from-sand via-sand/90 to-transparent p-7 pt-16">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h3 className="display text-5xl">{CATEGORY_LABELS[f.category]}</h3>
                    <p className="mt-3 max-w-[16rem] text-[13px] leading-relaxed text-muted">{COPY[f.category].line}</p>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-all duration-500 ease-lux group-hover:rotate-45 group-hover:border-ink group-hover:bg-ink group-hover:text-ivory">
                    <ArrowUpRight size={18} strokeWidth={1.4} />
                  </span>
                </div>
              </div>
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
