'use client'
import { createContext, useContext, useState, useEffect, useRef, ReactNode, RefObject } from 'react'
import { Perfume } from '@/types/perfume'

export interface CartItem {
  perfume: Perfume
  quantity: number
  volume: number
}

interface CartContextType {
  items: CartItem[]
  drawerOpen: boolean
  addItem: (perfume: Perfume, volume: number) => void
  removeItem: (id: string, volume: number) => void
  updateQty: (id: string, volume: number, qty: number) => void
  clearCart: () => void
  openDrawer: () => void
  closeDrawer: () => void
  totalItems: number
  cartBagRef: RefObject<HTMLButtonElement | null>
  flyToCart: (fromEl: HTMLElement, imageUrl?: string) => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]           = useState<CartItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const cartBagRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ep_cart')
      if (saved) setItems(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('ep_cart', JSON.stringify(items))
  }, [items])

  function addItem(perfume: Perfume, volume: number) {
    setItems(prev => {
      const hit = prev.find(i => i.perfume.id === perfume.id && i.volume === volume)
      if (hit) return prev.map(i => i.perfume.id === perfume.id && i.volume === volume
        ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { perfume, quantity: 1, volume }]
    })
  }

  function removeItem(id: string, volume: number) {
    setItems(prev => prev.filter(i => !(i.perfume.id === id && i.volume === volume)))
  }

  function updateQty(id: string, volume: number, qty: number) {
    if (qty <= 0) { removeItem(id, volume); return }
    setItems(prev => prev.map(i => i.perfume.id === id && i.volume === volume
      ? { ...i, quantity: qty } : i))
  }

  function clearCart() { setItems([]) }

  // Animación: el producto vuela en arco desde fromEl hasta el icono del carrito
  function flyToCart(fromEl: HTMLElement, imageUrl?: string) {
    const toEl = cartBagRef.current
    if (!toEl) return

    const from = fromEl.getBoundingClientRect()
    const to   = toEl.getBoundingClientRect()

    const size = 52
    const startX = from.left + from.width  / 2 - size / 2
    const startY = from.top  + from.height / 2 - size / 2
    const endX   = to.left   + to.width    / 2 - size / 2
    const endY   = to.top    + to.height   / 2 - size / 2

    const fly = document.createElement('div')
    fly.style.cssText = [
      'position:fixed',
      `width:${size}px`,
      `height:${size}px`,
      `left:${startX}px`,
      `top:${startY}px`,
      'border-radius:50%',
      'overflow:hidden',
      'z-index:9999',
      'pointer-events:none',
      'border:2px solid #C9A84C',
      imageUrl
        ? `background:url(${imageUrl}) center/cover no-repeat`
        : 'background:#C9A84C33',
      'box-shadow:0 4px 16px rgba(201,168,76,0.35)',
    ].join(';')
    document.body.appendChild(fly)

    const duration = 620
    const start = performance.now()

    function frame(now: number) {
      const raw = Math.min((now - start) / duration, 1)
      const t   = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw  // ease in-out

      const arc = -130 * Math.sin(Math.PI * raw)   // arco parabólico
      const x   = startX + (endX - startX) * t
      const y   = startY + (endY - startY) * t + arc
      const s   = 1 - 0.78 * raw
      const op  = raw < 0.82 ? 1 : 1 - (raw - 0.82) / 0.18

      fly.style.left      = `${x}px`
      fly.style.top       = `${y}px`
      fly.style.transform = `scale(${s})`
      fly.style.opacity   = `${op}`

      if (raw < 1) {
        requestAnimationFrame(frame)
      } else {
        fly.remove()
        toEl.classList.add('cart-bounce')
        setTimeout(() => toEl?.classList.remove('cart-bounce'), 560)
      }
    }

    requestAnimationFrame(frame)
  }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, drawerOpen, totalItems,
      addItem, removeItem, updateQty, clearCart,
      openDrawer:  () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      cartBagRef,
      flyToCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
