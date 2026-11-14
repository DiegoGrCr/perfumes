'use client'

import { createContext, useContext, ReactNode } from 'react'
import { NO_OFFERS, OffersSummary } from '@/lib/offers'

// Singleton on globalThis — see CartContext for why.
const g = globalThis as typeof globalThis & { __velvetOffersCtx?: React.Context<OffersSummary> }
const OffersContext = (g.__velvetOffersCtx ??= createContext<OffersSummary>(NO_OFFERS))

export function OffersProvider({ value, children }: { value: OffersSummary; children: ReactNode }) {
  return <OffersContext.Provider value={value}>{children}</OffersContext.Provider>
}

export const useOffers = () => useContext(OffersContext)
