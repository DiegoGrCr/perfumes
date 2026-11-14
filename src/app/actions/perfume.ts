'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { Perfume } from '@/types/perfume'

/** Fields an admin may change from the storefront. */
const EDITABLE = [
  'name', 'brand', 'description', 'price', 'original_price', 'category', 'gender',
  'concentration', 'volume_ml', 'available_volumes', 'notes_top', 'notes_heart', 'notes_base',
  'in_stock', 'featured', 'scent_type', 'seasons', 'occasions', 'longevity', 'sillage',
  'stock_quantity',
] as const

export type PerfumePatch = Partial<Pick<Perfume, (typeof EDITABLE)[number]>>

export async function savePerfume(id: string, patch: PerfumePatch): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Tu sesión expiró. Inicia sesión de nuevo.' }

  const clean: Record<string, unknown> = {}
  for (const k of EDITABLE) if (k in patch) clean[k] = patch[k] ?? null
  if (Object.keys(clean).length === 0) return { ok: true }

  // RLS still applies: the update runs with the admin's own session.
  const { data, error } = await supabase.from('perfumes').update(clean).eq('id', id).select('id')
  if (error) return { ok: false, error: error.message }
  // RLS silently skips rows it doesn't allow — surface that instead of faking success
  if (!data || data.length === 0) return { ok: false, error: 'No tienes permiso para editar esta fragancia.' }

  // Whole site: offer counts live in the root layout, prices show on many pages
  revalidatePath('/', 'layout')
  return { ok: true }
}
