'use client'
import Link from 'next/link'
import { ShoppingBag, Phone } from 'lucide-react'
import { useCart } from '@/context/CartContext'

export default function Header() {
  const { totalItems, openDrawer } = useCart()

  return (
    <header
      className="sticky top-0 z-30 w-full"
      style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">

          {/* Logo → inicio */}
          <Link href="/" className="flex flex-col leading-none">
            <span
              className="text-2xl font-light tracking-[0.35em] uppercase"
              style={{ color: '#C9A84C', letterSpacing: '0.3em' }}
            >
              Essence
            </span>
            <span className="text-[9px] tracking-[0.55em] uppercase ml-0.5" style={{ color: '#C4B48A' }}>
              Parfumerie
            </span>
          </Link>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/527299427673"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs tracking-widest uppercase rounded-full transition-all duration-200"
              style={{ color: '#888', border: '1px solid #E5E5E5' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.borderColor = '#C9A84C' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#E5E5E5' }}
            >
              <Phone size={11} />
              Contacto
            </a>

            {/* Carrito */}
            <button
              onClick={openDrawer}
              className="relative p-2 transition-colors duration-200"
              style={{ color: '#888' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#888' }}
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-semibold"
                  style={{ background: '#C9A84C', color: '#fff' }}
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
