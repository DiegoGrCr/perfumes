import { createClient } from '@supabase/supabase-js'
import type { SearchablePerfume } from '@/lib/search'

// Lightweight catalog for the global search overlay, regenerated at most every 60 s.
export const dynamic = 'force-static'
export const revalidate = 60

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return Response.json([])

  const { data, error } = await createClient(url, key)
    .from('perfumes')
    .select(`id, name, brand, price, original_price, in_stock, featured, category, gender,
             concentration, volume_ml, scent_type, notes_top, notes_heart, notes_base, description,
             images:perfume_images(url, is_primary, sort_order)`)
  if (error || !data) return Response.json([])

  const items: SearchablePerfume[] = data.map(({ images, description, ...p }) => {
    const sorted = [...(images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    )
    return {
      ...p,
      // keep the payload small: only the start of the description is searched
      description: (description ?? '').slice(0, 220),
      image: sorted[0]?.url,
    }
  })
  return Response.json(items)
}
