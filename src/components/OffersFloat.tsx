'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, ArrowRight } from 'lucide-react'
import { useOffers } from '@/context/OffersContext'

const DISMISS_KEY = 'velvet_offers_float_dismissed'

/** Discreet floating "Ofertas" pill that slides in once the visitor starts scrolling. */
export default function OffersFloat() {
  const { count, maxPct } = useOffers()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  // Read once on the client; the pill starts hidden anyway, so SSR markup matches
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return true
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 700)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const hiddenHere = pathname.startsWith('/admin') || pathname.startsWith('/ofertas')
  if (count === 0 || hiddenHere) return null
  const visible = scrolled && !dismissed
  const onProduct = pathname.startsWith('/perfume/')

  function dismiss() {
    setDismissed(true)
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  return (
    <div
      className={`fixed left-4 z-30 transition-all duration-700 ease-lux sm:left-6 ${
        onProduct ? 'bottom-24 lg:bottom-6' : 'bottom-5 sm:bottom-6'
      } ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`}
    >
      <div className="group flex items-center gap-1 rounded-full bg-velvet py-1.5 pl-1.5 pr-1.5 text-ivory shadow-[0_18px_40px_-14px_rgba(18,12,11,0.7)] ring-1 ring-white/10">
        <Link href="/ofertas" className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3">
          <span className="display flex h-10 w-10 items-center justify-center rounded-full bg-rose-light text-[15px] font-medium text-velvet">
            −{maxPct}%
          </span>
          <span className="leading-tight">
            <span className="eyebrow block text-[8px] text-rose-light">Ofertas activas</span>
            <span className="flex items-center gap-1.5 text-[12px]">
              Ver {count} {count === 1 ? 'fragancia' : 'fragancias'}
              <ArrowRight size={12} className="transition-transform duration-500 ease-lux group-hover:translate-x-1" />
            </span>
          </span>
        </Link>
        <button
          onClick={dismiss}
          aria-label="Ocultar aviso de ofertas"
          className="flex h-7 w-7 items-center justify-center rounded-full text-ivory/40 transition-colors hover:bg-white/10 hover:text-ivory"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
