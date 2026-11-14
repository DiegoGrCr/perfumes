import { createClient } from '@supabase/supabase-js'

export interface OffersSummary {
  count: number
  maxPct: number
}

export const NO_OFFERS: OffersSummary = { count: 0, maxPct: 0 }

/** Server-side: how many active offers exist and the biggest discount. */
export async function getOffersSummary(): Promise<OffersSummary> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NO_OFFERS
  try {
    const { data } = await createClient(url, key)
      .from('perfumes')
      .select('price, original_price')
      .not('original_price', 'is', null)
    const active = (data ?? []).filter(p => p.original_price > p.price)
    return {
      count: active.length,
      maxPct: Math.max(0, ...active.map(p => Math.round((1 - p.price / p.original_price) * 100))),
    }
  } catch {
    return NO_OFFERS
  }
}
