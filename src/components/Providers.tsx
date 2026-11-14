'use client'
import { ReactNode } from 'react'
import { CartProvider } from '@/context/CartContext'
import { AdminProvider } from '@/context/AdminContext'
import CartDrawer from '@/components/CartDrawer'
import QuickEditPanel from '@/components/admin/QuickEditPanel'
import AdminToast from '@/components/admin/AdminToast'
import OffersFloat from '@/components/OffersFloat'
import SearchOverlay from '@/components/SearchOverlay'
import { OffersProvider } from '@/context/OffersContext'
import type { OffersSummary } from '@/lib/offers'

export function Providers({ children, offers }: { children: ReactNode; offers: OffersSummary }) {
  return (
    <OffersProvider value={offers}>
    <AdminProvider>
      <CartProvider>
        {children}
        <CartDrawer />
        <QuickEditPanel />
        <AdminToast />
        <OffersFloat />
        <SearchOverlay />
      </CartProvider>
    </AdminProvider>
    </OffersProvider>
  )
}
