'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, ArrowLeft,
  Leaf, Sun, Snowflake, Cloud,
  Moon, Briefcase, Heart, Coffee, Zap, Sparkles,
  Clock, Wind, Phone,
} from 'lucide-react'
import { Perfume, CATEGORY_LABELS, GENDER_LABELS } from '@/types/perfume'

const CATEGORY_ACCENT: Record<string, string> = {
  arabe: '#C9A84C', disenador: '#4A7EC9', nicho: '#8B6DD4', otros: '#4CAF7D',
}
const CATEGORY_BG: Record<string, string> = {
  arabe: '#FBF6EC', disenador: '#EEF4FB', nicho: '#F4F0FB', otros: '#EEF7F2',
}
const GENDER_BG: Record<string, string> = { hombre: '#EEF4FB', mujer: '#FBF0F5', unisex: '#F7F5EC' }
const GENDER_TEXT: Record<string, string> = { hombre: '#4A7EC9', mujer: '#C94A7E', unisex: '#8B7E3A' }

const SEASON_ICONS: Record<string, React.ReactNode> = {
  Primavera: <Leaf size={14} />,
  Verano:    <Sun size={14} />,
  Otoño:     <Cloud size={14} />,
  Invierno:  <Snowflake size={14} />,
}
const OCCASION_ICONS: Record<string, React.ReactNode> = {
  Día:               <Sun size={14} />,
  Noche:             <Moon size={14} />,
  Trabajo:           <Briefcase size={14} />,
  Romántico:         <Heart size={14} />,
  Casual:            <Coffee size={14} />,
  Sport:             <Zap size={14} />,
  'Ocasión especial': <Sparkles size={14} />,
}

function NotePill({ text }: { text: string }) {
  return (
    <span
      className="text-[10px] tracking-wider px-2.5 py-1 rounded-full"
      style={{ background: '#F5F5F3', color: '#666', border: '1px solid #EBEBEB' }}
    >
      {text}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="h-px flex-1" style={{ background: '#EBEBEB' }} />
      <span className="text-[10px] tracking-[0.4em] uppercase font-medium" style={{ color: '#bbb' }}>
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: '#EBEBEB' }} />
    </div>
  )
}

function BottleSVG({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 140" className="w-32 h-56 drop-shadow-sm" fill="none">
      <rect x="28" y="4"  width="24" height="14" rx="4" fill={color} opacity="0.7" />
      <rect x="24" y="18" width="32" height="6"  rx="3" fill={color} opacity="0.4" />
      <rect x="32" y="24" width="16" height="18" rx="2" fill={color} opacity="0.3" />
      <path d="M20 42 Q20 37 32 37 L48 37 Q60 37 60 42 L60 44 L20 44 Z" fill={color} opacity="0.25" />
      <rect x="16" y="44" width="48" height="76" rx="8" fill={color} opacity="0.12" />
      <rect x="20" y="50" width="8"  height="54" rx="4" fill="white" opacity="0.5" />
      <rect x="22" y="60" width="36" height="40" rx="4" fill={color} opacity="0.1" />
      <rect x="22" y="60" width="36" height="40" rx="4" stroke={color} strokeWidth="0.5" opacity="0.4" />
      <rect x="28" y="70" width="24" height="1.5" rx="1" fill={color} opacity="0.5" />
      <rect x="30" y="76" width="20" height="1"   rx="0.5" fill={color} opacity="0.3" />
      <rect x="30" y="81" width="20" height="1"   rx="0.5" fill={color} opacity="0.3" />
      <rect x="16" y="116" width="48" height="4"  rx="2" fill={color} opacity="0.15" />
    </svg>
  )
}

export function PerfumeDetail({ perfume }: { perfume: Perfume }) {
  const images  = perfume.images ?? []
  const [imgIdx, setImgIdx] = useState(0)

  const accent  = CATEGORY_ACCENT[perfume.category] ?? '#C9A84C'
  const catBg   = CATEGORY_BG[perfume.category]     ?? '#FBF6EC'
  const genBg   = GENDER_BG[perfume.gender]          ?? '#F0F0F0'
  const genText = GENDER_TEXT[perfume.gender]        ?? '#666'
  const discount = perfume.original_price
    ? Math.round((1 - perfume.price / perfume.original_price) * 100)
    : null

  const hasNotes   = (perfume.notes_top?.length ?? 0) + (perfume.notes_heart?.length ?? 0) + (perfume.notes_base?.length ?? 0) > 0
  const hasProfile = perfume.scent_type || perfume.longevity || perfume.sillage
  const hasRecs    = (perfume.seasons?.length ?? 0) + (perfume.occasions?.length ?? 0) > 0

  return (
    <div style={{ background: '#F8F7F4', minHeight: '100vh' }}>
      {/* Back */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase transition-colors"
          style={{ color: '#bbb' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = accent }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#bbb' }}
        >
          <ArrowLeft size={14} />
          Volver al catálogo
        </Link>
      </div>

      {/* Hero: imagen + info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* Columna imagen */}
          <div className="flex flex-col gap-4">
            {/* Imagen principal */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                height: '420px',
                background: catBg,
                border: '1px solid #EBEBEB',
              }}
            >
              {images.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[imgIdx].url}
                    alt={perfume.name}
                    className="w-full h-full object-contain p-8"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                        style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                      >
                        <ChevronLeft size={18} style={{ color: '#333' }} />
                      </button>
                      <button
                        onClick={() => setImgIdx(i => (i + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                        style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                      >
                        <ChevronRight size={18} style={{ color: '#333' }} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIdx(i)}
                            className="rounded-full transition-all duration-200"
                            style={{
                              width: i === imgIdx ? 20 : 7,
                              height: 7,
                              background: i === imgIdx ? accent : 'rgba(255,255,255,0.7)',
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8">
                  <BottleSVG color={accent} />
                </div>
              )}

              {/* Badges overlay */}
              {!perfume.in_stock && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.75)' }}>
                  <span className="text-xs tracking-widest uppercase px-4 py-2 rounded-full" style={{ background: '#fff', color: '#999', border: '1px solid #ddd' }}>
                    Agotado
                  </span>
                </div>
              )}
              {discount && (
                <div className="absolute top-4 right-4">
                  <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: '#FF4B4B', color: '#fff' }}>
                    -{discount}%
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setImgIdx(i)}
                    className="rounded-xl overflow-hidden transition-all"
                    style={{
                      width: 72, height: 72,
                      border: `2px solid ${i === imgIdx ? accent : '#EBEBEB'}`,
                      opacity: i === imgIdx ? 1 : 0.6,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna info */}
          <div className="flex flex-col gap-5 lg:pt-4">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full font-medium"
                style={{ background: catBg, color: accent }}>
                {CATEGORY_LABELS[perfume.category]}
              </span>
              <span className="text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full font-medium"
                style={{ background: genBg, color: genText }}>
                {GENDER_LABELS[perfume.gender]}
              </span>
              {perfume.featured && (
                <span className="text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: accent, color: '#fff' }}>
                  Destacado
                </span>
              )}
            </div>

            {/* Marca */}
            <p className="text-xs tracking-[0.3em] uppercase font-medium" style={{ color: '#aaa' }}>
              {perfume.brand}
            </p>

            {/* Nombre */}
            <h1 className="text-3xl sm:text-4xl font-light leading-tight" style={{ color: '#1a1a1a', letterSpacing: '0.03em' }}>
              {perfume.name}
            </h1>

            {/* Concentración / Volumen */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: '#F5F5F3', color: '#999', border: '1px solid #EBEBEB' }}>
                {perfume.concentration}
              </span>
              <span className="text-[10px] tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: '#F5F5F3', color: '#999', border: '1px solid #EBEBEB' }}>
                {perfume.volume_ml} ml
              </span>
            </div>

            {/* Precio */}
            <div className="flex items-baseline gap-3 py-3" style={{ borderTop: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0' }}>
              <span className="text-3xl font-semibold" style={{ color: accent }}>
                ${perfume.price.toFixed(2)}
              </span>
              {perfume.original_price && (
                <span className="text-lg line-through" style={{ color: '#ccc' }}>
                  ${perfume.original_price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Descripción */}
            {perfume.description && (
              <p className="text-sm leading-relaxed" style={{ color: '#666' }}>
                {perfume.description}
              </p>
            )}

            {/* Scent type + longevity + sillage (inline) */}
            {hasProfile && (
              <div className="flex flex-wrap gap-2">
                {perfume.scent_type && (
                  <span className="text-[10px] tracking-wider uppercase px-3 py-1 rounded-full"
                    style={{ background: catBg, color: accent, border: `1px solid ${accent}33` }}>
                    {perfume.scent_type}
                  </span>
                )}
                {perfume.longevity && (
                  <span className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-3 py-1 rounded-full"
                    style={{ background: '#F5F5F3', color: '#666', border: '1px solid #EBEBEB' }}>
                    <Clock size={11} /> {perfume.longevity}
                  </span>
                )}
                {perfume.sillage && (
                  <span className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-3 py-1 rounded-full"
                    style={{ background: '#F5F5F3', color: '#666', border: '1px solid #EBEBEB' }}>
                    <Wind size={11} /> {perfume.sillage}
                  </span>
                )}
              </div>
            )}

            {/* Volúmenes disponibles */}
            {(perfume.available_volumes?.length ?? 0) > 1 && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] tracking-widest uppercase" style={{ color: '#bbb' }}>Volúmenes</p>
                <div className="flex gap-2 flex-wrap">
                  {perfume.available_volumes!.map(v => (
                    <span key={v} className="text-[10px] px-3 py-1.5 rounded-full"
                      style={{ background: v === perfume.volume_ml ? accent : '#F5F5F3', color: v === perfume.volume_ml ? '#fff' : '#666', border: `1px solid ${v === perfume.volume_ml ? accent : '#EBEBEB'}` }}>
                      {v} ml
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <a
              href={`https://wa.me/527299427673?text=${encodeURIComponent(`¡Hola! Quisiera consultar la disponibilidad de: ${perfume.name} (${perfume.brand}) – ${perfume.volume_ml}ml`)}`}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-full text-sm tracking-widest uppercase font-medium transition-opacity hover:opacity-85 mt-2"
              style={{ background: accent, color: '#fff' }}
            >
              <Phone size={16} />
              Consultar disponibilidad
            </a>
          </div>
        </div>
      </section>

      {/* Pirámide Olfativa */}
      {hasNotes && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <SectionTitle>Pirámide Olfativa</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: 'Notas de Salida', sub: 'Primera impresión · 15–30 min', notes: perfume.notes_top },
              { title: 'Notas de Corazón', sub: 'El alma · 2–4 horas', notes: perfume.notes_heart },
              { title: 'Notas de Fondo', sub: 'La huella · toda la jornada', notes: perfume.notes_base },
            ].map(({ title, sub, notes }) =>
              (notes?.length ?? 0) > 0 && (
                <div
                  key={title}
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: '#fff', border: '1px solid #EBEBEB' }}
                >
                  <div>
                    <p className="text-xs font-medium tracking-wider" style={{ color: '#1a1a1a' }}>{title}</p>
                    <p className="text-[9px] tracking-wider mt-0.5" style={{ color: '#bbb' }}>{sub}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {notes!.map(n => <NotePill key={n} text={n} />)}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Recomendaciones */}
      {hasRecs && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <SectionTitle>Ideal para</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-6">
            {(perfume.seasons?.length ?? 0) > 0 && (
              <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #EBEBEB' }}>
                <p className="text-[10px] tracking-widest uppercase mb-3" style={{ color: '#bbb' }}>Temporadas</p>
                <div className="flex flex-wrap gap-2">
                  {perfume.seasons!.map(s => (
                    <span key={s} className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full"
                      style={{ background: '#F5F5F3', color: '#666', border: '1px solid #EBEBEB' }}>
                      {SEASON_ICONS[s] ?? null} {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(perfume.occasions?.length ?? 0) > 0 && (
              <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #EBEBEB' }}>
                <p className="text-[10px] tracking-widest uppercase mb-3" style={{ color: '#bbb' }}>Ocasiones</p>
                <div className="flex flex-wrap gap-2">
                  {perfume.occasions!.map(o => (
                    <span key={o} className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full"
                      style={{ background: '#F5F5F3', color: '#666', border: '1px solid #EBEBEB' }}>
                      {OCCASION_ICONS[o] ?? null} {o}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center py-8" style={{ borderTop: '1px solid #EBEBEB', background: '#fff' }}>
        <p className="text-[10px] tracking-widest uppercase" style={{ color: '#ccc' }}>
          © 2026 Velvet · Fragancias 100% auténticas
        </p>
      </footer>
    </div>
  )
}
