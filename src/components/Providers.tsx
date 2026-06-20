'use client'
import { ReactNode } from 'react'
import { CartProvider } from '@/context/CartContext'
import CartDrawer from '@/components/CartDrawer'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  )
}
