import type { SupabaseClient } from '@supabase/supabase-js'
import type { Decant, DecantSize } from '@/types/perfume'
import { PUBLIC_DECANT_SELECT, PUBLIC_DECANT_SELECT_LEGACY } from '@/lib/columns'
import { cleanName } from '@/lib/names'
import { DEFAULT_JUICE, decantSvg, hexToJuice, type DecantArt } from '@/lib/decant-svg'

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

/** Longest label name the admin may type. */
export const LABEL_MAX = 40

/** Text printed on the label: the admin's short name, or the perfume's cleaned name. */
export const decantLabel = (perfume: { name: string; brand: string }, label?: string | null) =>
  label?.trim() || cleanName(perfume.name, perfume.brand)

type ArtSource = {
  perfume: { name: string; brand: string; concentration?: string }
  label?: string | null
  liquid_color?: string | null
}

/** Everything needed to draw a perfume's decant vial(s). */
export function decantArt({ perfume, label, liquid_color }: ArtSource, size: DecantSize | 'par'): DecantArt {
  return {
    label: decantLabel(perfume, label),
    brand: perfume.brand,
    concentration: perfume.concentration,
    juice: hexToJuice(liquid_color) ?? DEFAULT_JUICE,
    size,
  }
}

/** Vial as an image URL (for the fly-to-cart animation). */
export const decantDataUrl = (art: DecantArt) =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(decantSvg(art))

/** Active decants (optionally of one perfume). Returns [] if the table doesn't exist yet. */
export async function fetchDecants(supabase: SupabaseClient, perfumeId?: string): Promise<Decant[]> {
  const run = (cols: string) => {
    let q = supabase.from('decants').select(cols).eq('active', true).order('volume_ml')
    if (perfumeId) q = q.eq('perfume_id', perfumeId)
    return q
  }
  let { data, error } = await run(PUBLIC_DECANT_SELECT)
  // label/liquid_color columns missing (migration 005 not applied yet) → keep selling with defaults
  if (error) ({ data, error } = await run(PUBLIC_DECANT_SELECT_LEGACY))
  if (error || !data) return []
  return data as unknown as Decant[]
}
