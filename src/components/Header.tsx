'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, ArrowUpRight, LayoutDashboard, LogOut, Tag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useAdmin } from '@/context/AdminContext'
import { useOffers } from '@/context/OffersContext'
import { waLink } from '@/lib/brand'

const NAV = [
  { href: '/#coleccion', label: 'Colección', dot: false },
  { href: '/ofertas',    label: 'Ofertas',   dot: true },
  { href: '/#familias',  label: 'Familias',  dot: false },
]

const BASE_ANNOUNCEMENTS = [
  '100% originales · garantizado',
  'Pide en un mensaje por WhatsApp',
  'Asesoría olfativa sin costo',
]

/**
 * `overlay` — floats transparent over a dark hero (home) and turns
 * solid ivory once the user scrolls.
 */
export default function Header({ overlay = false }: { overlay?: boolean }) {
  const { totalItems, openDrawer, cartBagRef } = useCart()
  const { isAdmin, signOut } = useAdmin()
  const offers = useOffers()
  const hasOffers = offers.count > 0
  // Offers lead the rotation (and link to the offers page) whenever there are any
  const ANNOUNCEMENTS = hasOffers
    ? [`Ofertas activas · hasta −${offers.maxPct}% · Ver ofertas`, ...BASE_ANNOUNCEMENTS]
    : BASE_ANNOUNCEMENTS
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [msg, setMsg] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setMsg(m => (m + 1) % ANNOUNCEMENTS.length), 4000)
    return () => clearInterval(id)
  }, [ANNOUNCEMENTS.length])

  useEffect(() => {
    if (!menuOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const transparent = overlay && !scrolled && !menuOpen
  const fg = transparent ? 'text-ivory' : 'text-ink'

  return (
    <>
      <header
        className={`${overlay ? 'fixed' : 'sticky'} top-0 inset-x-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-700 ease-lux ${
          transparent
            ? 'bg-transparent'
            : 'bg-ivory/85 backdrop-blur-xl shadow-[0_1px_0_0_var(--line)]'
        }`}
      >
        {/* Announcement bar */}
        <div
          className={`overflow-hidden transition-all duration-700 ease-lux ${
            scrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'
          } ${transparent ? 'border-b border-white/10' : 'bg-velvet'}`}
        >
          <div className="relative h-8 text-center">
            {ANNOUNCEMENTS.map((a, i) => {
              const isOffer = hasOffers && i === 0
              const style = {
                opacity: i === msg ? 1 : 0,
                transform: `translateY(${i === msg ? 0 : i < msg ? -10 : 10}px)`,
                pointerEvents: i === msg ? 'auto' : 'none',
              } as const
              const cls = `eyebrow absolute inset-0 flex items-center justify-center gap-2 text-[9px] transition-all duration-700 ease-lux ${isOffer ? 'text-rose-light' : 'text-ivory/70'}`
              return isOffer ? (
                <Link key={a} href="/ofertas" className={`${cls} hover:text-ivory`} style={style}>
                  <span className="h-1 w-1 rounded-full bg-rose-light" /> {a} →
                </Link>
              ) : (
                <p key={a} className={cls} style={style}>{a}</p>
              )
            })}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className={`grid grid-cols-[1fr_auto_1fr] items-center transition-all duration-700 ease-lux ${scrolled ? 'h-16' : 'h-20'}`}>
            {/* Left: nav / menu */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className={`lg:hidden -ml-2 p-2 ${fg} transition-colors`}
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              </button>
              <nav className="hidden lg:flex items-center gap-8">
                {NAV.map(n => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`eyebrow relative text-[10px] link-underline pb-1 ${fg} transition-colors duration-500 hover:opacity-70`}
                  >
                    {n.label}
                    {n.dot && hasOffers && (
                      <span
                        className={`ml-2 inline-block rounded-full px-1.5 py-0.5 align-[1px] text-[8px] font-semibold tracking-normal ${
                          transparent ? 'bg-rose-light text-velvet' : 'bg-rose text-paper'
                        }`}
                      >
                        −{offers.maxPct}%
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center: logo */}
            <Link href="/" aria-label="Velvet Perfumes — inicio" className="relative block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-light.png"
                alt=""
                className={`w-auto transition-all duration-700 ease-lux ${scrolled ? 'h-7 sm:h-8' : 'h-8 sm:h-10'} ${transparent ? 'opacity-100' : 'opacity-0'}`}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-dark.png"
                alt="Velvet Perfumes"
                className={`absolute inset-0 w-auto transition-all duration-700 ease-lux ${scrolled ? 'h-7 sm:h-8' : 'h-8 sm:h-10'} ${transparent ? 'opacity-0' : 'opacity-100'}`}
              />
            </Link>

            {/* Right: actions */}
            <div className="flex items-center justify-end gap-2 sm:gap-5">
              {isAdmin && (
                <div className={`hidden md:flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 transition-colors duration-500 ${transparent ? 'border-white/20' : 'border-line bg-paper'}`}>
                  <span className="mr-1 flex items-center gap-1.5 eyebrow text-[8px] text-rose-light">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className={transparent ? 'text-rose-light' : 'text-rose'}>Admin</span>
                  </span>
                  <Link href="/admin/dashboard" title="Panel" aria-label="Ir al panel" className={`rounded-full p-1.5 transition-colors ${transparent ? 'text-ivory hover:bg-white/10' : 'text-ink hover:bg-sand'}`}>
                    <LayoutDashboard size={14} strokeWidth={1.5} />
                  </Link>
                  <button onClick={signOut} title="Salir" aria-label="Cerrar sesión" className={`rounded-full p-1.5 transition-colors ${transparent ? 'text-ivory hover:bg-white/10' : 'text-ink hover:bg-sand'}`}>
                    <LogOut size={14} strokeWidth={1.5} />
                  </button>
                </div>
              )}
              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={`hidden sm:inline-flex eyebrow text-[10px] link-underline pb-1 ${fg} transition-colors duration-500 hover:opacity-70`}
              >
                Contacto
              </a>
              {/* Mobile / tablet: offers shortcut next to the bag */}
              {hasOffers && (
                <Link
                  href="/ofertas"
                  aria-label={`Ofertas activas, hasta ${offers.maxPct}% de descuento`}
                  className={`relative p-2 lg:hidden ${fg} transition-colors duration-500`}
                >
                  <Tag size={19} strokeWidth={1.4} />
                  <span
                    className={`absolute -right-1 top-0 rounded-full px-1 text-[8px] font-semibold leading-4 ${
                      transparent ? 'bg-rose-light text-velvet' : 'bg-rose text-paper'
                    }`}
                  >
                    −{offers.maxPct}%
                  </span>
                </Link>
              )}
              <button
                ref={cartBagRef}
                onClick={openDrawer}
                className={`relative -mr-2 p-2 ${fg} transition-colors duration-500`}
                aria-label={`Abrir pedido (${totalItems} artículos)`}
              >
                <ShoppingBag size={20} strokeWidth={1.4} />
                <span
                  className={`absolute top-0.5 right-0 min-w-4 h-4 px-1 rounded-full text-[9px] font-semibold flex items-center justify-center transition-all duration-500 ease-lux ${
                    totalItems > 0 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  } ${transparent ? 'bg-rose-light text-velvet' : 'bg-ink text-ivory'}`}
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-30 bg-ivory lg:hidden transition-[opacity,visibility] duration-500 ${
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <nav className="flex h-full flex-col justify-center px-8 pt-24">
          {NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMenuOpen(false)}
              className="display block border-b border-line py-5 text-5xl text-ink transition-all duration-700 ease-lux"
              style={{
                transitionDelay: menuOpen ? `${120 + i * 70}ms` : '0ms',
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'none' : 'translateY(20px)',
              }}
            >
              {n.dot ? <em className="text-rose">{n.label}</em> : n.label}
            </Link>
          ))}
          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex items-center gap-2 eyebrow text-rose"
          >
            WhatsApp <ArrowUpRight size={14} />
          </a>
          {isAdmin && (
            <div className="mt-8 flex items-center gap-6 border-t border-line pt-6">
              <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className="eyebrow flex items-center gap-2 text-ink">
                <LayoutDashboard size={14} /> Panel
              </Link>
              <button onClick={() => { signOut(); setMenuOpen(false) }} className="eyebrow flex items-center gap-2 text-muted">
                <LogOut size={14} /> Salir
              </button>
            </div>
          )}
        </nav>
      </div>
    </>
  )
}
