import { createBrowserClient } from '@supabase/ssr'
import { Perfume } from '@/types/perfume'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = url && key
  ? createBrowserClient(url, key)
  : null

export async function getPerfumes(): Promise<Perfume[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('perfumes')
    .select('*, images:perfume_images(*)')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) { console.error('Error al obtener perfumes:', error); return [] }
  return data ?? []
}
