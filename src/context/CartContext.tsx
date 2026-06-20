'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]           = useState<CartItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, drawerOpen, totalItems,
      addItem, removeItem, updateQty, clearCart,
      openDrawer:  () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
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
