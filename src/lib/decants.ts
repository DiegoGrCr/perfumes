import type { SupabaseClient } from '@supabase/supabase-js'
import type { Decant, DecantSize } from '@/types/perfume'
import { PUBLIC_DECANT_SELECT } from '@/lib/columns'
import decantImages from '@/data/decant-images.json'

export const DECANT_SIZES: DecantSize[] = [5, 10]

/**
 * Suggested price, shown only in the admin (never to customers):
 *   (acquisition cost ÷ bottle ml) × decant ml × margin + packaging, rounded up.
 *
 * Calibrated with the owner's example: Le Beau, cost ≈ $1,500 / 125 ml → ~$2,400+
 * when the whole bottle is decanted (10 ml ≈ $200 · 5 ml ≈ $110).
 */
export const DECANT_PRICING = {
  margin: 1.4,        // × cost of the juice
  atomizerCost: 25,   // MXN per decant: glass atomizer + pouch + label
  roundTo: 10,        // round up to the next $10
}

/** Revenue if the whole bottle were sold as decants of this size at this price. */
export const wholeBottleRevenue = (bottleMl: number, ml: DecantSize, price: number) =>
  bottleMl > 0 && price > 0 ? Math.floor(bottleMl / ml) * price : null

export function suggestedDecantPrice(costPrice: number | null | undefined, bottleMl: number, ml: DecantSize) {
  if (!costPrice || !bottleMl) return null
  const raw = (costPrice / bottleMl) * ml * DECANT_PRICING.margin + DECANT_PRICING.atomizerCost
  return Math.ceil(raw / DECANT_PRICING.roundTo) * DECANT_PRICING.roundTo
}

type ImageEntry = { [k: string]: string }
const IMAGES = decantImages as Record<string, ImageEntry>

/** Generated decant image for a perfume (falls back to the generic Velvet vial). */
export function decantImage(perfumeId: string, size: DecantSize | 'par') {
  return IMAGES[perfumeId]?.[String(size)] ?? `/decants/generico-${size}.png`
}
export const hasCustomDecantImage = (perfumeId: string) => Boolean(IMAGES[perfumeId])

/** Active decants (optionally of one perfume). Returns [] if the table doesn't exist yet. */
export async function fetchDecants(supabase: SupabaseClient, perfumeId?: string): Promise<Decant[]> {
  let q = supabase.from('decants').select(PUBLIC_DECANT_SELECT).eq('active', true).order('volume_ml')
  if (perfumeId) q = q.eq('perfume_id', perfumeId)
  const { data, error } = await q
  if (error || !data) return []
  return data as unknown as Decant[]
}
