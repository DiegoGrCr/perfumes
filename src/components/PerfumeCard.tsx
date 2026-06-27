'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

import { useRouter } from 'next/navigation'
import { ShoppingBag, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Perfume, CATEGORY_LABELS, GENDER_LABELS } from '@/types/perfume'
import { useCart } from '@/context/CartContext'

interface Props { perfume: Perfume }


const CATEGORY_ACCENT: Record<string, string> = {
  arabe:     '#C9A84C',
  disenador: '#4A7EC9',
  nicho:     '#8B6DD4',
  otros:     '#4CAF7D',
}

const CATEGORY_BG: Record<string, string> = {
  arabe:     '#FBF6EC',
  disenador: '#EEF4FB',
  nicho:     '#F4F0FB',
  otros:     '#EEF7F2',
}

const GENDER_BG: Record<string, string> = {
  hombre: '#EEF4FB',
  mujer:  '#FBF0F5',
  unisex: '#F7F5EC',
}
const GENDER_TEXT: Record<string, string> = {
  hombre: '#4A7EC9',
  mujer:  '#C94A7E',
  unisex: '#8B7E3A',
}

function BottleIcon({ category }: { category: string }) {
  const c = CATEGORY_ACCENT[category] ?? '#C9A84C'
  return (
    <svg viewBox="0 0 80 140" className="w-20 h-32 drop-shadow-sm" fill="none">
      <rect x="28" y="4"  width="24" height="14" rx="4" fill={c} opacity="0.7" />
      <rect x="24" y="18" width="32" height="6"  rx="3" fill={c} opacity="0.4" />
      <rect x="32" y="24" width="16" height="18" rx="2" fill={c} opacity="0.3" />
      <path d="M20 42 Q20 37 32 37 L48 37 Q60 37 60 42 L60 44 L20 44 Z" fill={c} opacity="0.25" />
      <rect x="16" y="44" width="48" height="76" rx="8" fill={c} opacity="0.12" />
      <rect x="20" y="50" width="8"  height="54" rx="4" fill="white" opacity="0.5" />
      <rect x="22" y="60" width="36" height="40" rx="4" fill={c} opacity="0.1" />
      <rect x="22" y="60" width="36" height="40" rx="4" stroke={c} strokeWidth="0.5" opacity="0.4" />
      <rect x="28" y="70" width="24" height="1.5" rx="1" fill={c} opacity="0.5" />
      <rect x="30" y="76" width="20" height="1"   rx="0.5" fill={c} opacity="0.3" />
      <rect x="30" y="81" width="20" height="1"   rx="0.5" fill={c} opacity="0.3" />
      <rect x="16" y="116" width="48" height="4"  rx="2" fill={c} opacity="0.15" />
    </svg>
  )
}

export default function PerfumeCard({ perfume }: Props) {
  const router = useRouter()
  const { addItem, flyToCart } = useCart()
  const images = perfume.images ?? []
  const hasImages = images.length > 0
  const [imgIdx, setImgIdx] = useState(0)
  const pausedRef = useRef(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(perfume, perfume.volume_ml)
    const el = imgRef.current ?? (e.currentTarget as HTMLElement)
    flyToCart(el, images[imgIdx]?.url)
  }, [addItem, flyToCart, perfume, images, imgIdx])

  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => {
      if (!pausedRef.current) setImgIdx(i => (i + 1) % images.length)
    }, 3500)
    return () => clearInterval(id)
  }, [images.length])

  const accent  = CATEGORY_ACCENT[perfume.category] ?? '#C9A84C'
  const catBg   = CATEGORY_BG[perfume.category]     ?? '#FBF6EC'
  const genBg   = GENDER_BG[perfume.gender]          ?? '#F0F0F0'
  const genText = GENDER_TEXT[perfume.gender]        ?? '#666'

  const discount = perfume.original_price
    ? Math.round((1 - perfume.price / perfume.original_price) * 100)
    : null

  function prev(e: React.MouseEvent) {
    e.stopPropagation()
    setImgIdx(i => (i - 1 + images.length) % images.length)
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation()
    setImgIdx(i => (i + 1) % images.length)
  }

  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: '#fff',
        border: '1px solid #EBEBEB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        cursor: 'pointer',
      }}
      onClick={() => router.push(`/perfume/${perfume.id}`)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; pausedRef.current = true }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; pausedRef.current = false }}
    >
      {/* ── Imagen / carrusel ────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '180px', background: catBg }}>

        {hasImages ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={images[imgIdx].url}
              alt={perfume.name}
              className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            />

            {/* Flechas (solo con > 1 imagen) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
                >
                  <ChevronLeft size={14} style={{ color: '#333' }} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
                >
                  <ChevronRight size={14} style={{ color: '#333' }} />
                </button>

                {/* Puntos indicadores */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={e => { e.stopPropagation(); setImgIdx(i) }}
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: i === imgIdx ? 16 : 6,
                        height: 6,
                        background: i === imgIdx ? accent : 'rgba(255,255,255,0.6)',
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            <BottleIcon category={perfume.category} />
          </div>
        )}

        {/* Badges sobre la imagen */}
        {perfume.featured && (
          <div className="absolute top-3 left-3">
            <span className="text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full font-semibold"
              style={{ background: accent, color: '#fff' }}>
              Destacado
            </span>
          </div>
        )}
        {discount && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: '#FF4B4B', color: '#fff' }}>
              -{discount}%
            </span>
          </div>
        )}
      </div>

      {/* ── Info ─────────────────────────────────────── */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full font-medium"
            style={{ background: catBg, color: accent }}>
            {CATEGORY_LABELS[perfume.category]}
          </span>
          <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full font-medium"
            style={{ background: genBg, color: genText }}>
            {GENDER_LABELS[perfume.gender]}
          </span>
          <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full ml-auto"
            style={{ background: '#F5F5F5', color: '#999' }}>
            {perfume.concentration} · {perfume.volume_ml}ml
          </span>
        </div>

        {/* Marca */}
        <p className="text-[10px] tracking-widest uppercase font-medium" style={{ color: '#999' }}>
          {perfume.brand}
        </p>

        {/* Nombre */}
        <h3 className="text-sm font-medium leading-snug" style={{ color: '#1a1a1a' }}>
          {perfume.name}
        </h3>

        {/* Notas */}
        {perfume.notes_top && perfume.notes_top.length > 0 && (
          <p className="text-[10px] leading-relaxed line-clamp-1" style={{ color: '#bbb' }}>
            {perfume.notes_top.join(' · ')}
          </p>
        )}

        {/* Precio + CTA */}
        <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid #F0F0F0' }}>
          <div>
            <span className="text-lg font-semibold" style={{ color: accent }}>
              ${perfume.price.toFixed(2)}
            </span>
            {perfume.original_price && (
              <span className="text-xs line-through ml-1.5" style={{ color: '#ccc' }}>
                ${perfume.original_price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] tracking-widest uppercase font-medium transition-all duration-200"
            style={{ background: accent, color: '#fff' }}
            onClick={handleAddToCart}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            <ShoppingBag size={11} /> Pedir
          </button>
        </div>
      </div>
    </div>
  )
}
