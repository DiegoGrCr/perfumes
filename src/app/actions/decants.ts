'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type { Decant, DecantSize } from '@/types/perfume'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

export interface DecantAdminData {
  costPrice: number | null
  bottleMl: number
  decants: Decant[]
  tableMissing: boolean
}

async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? supabase : null
}

/** Admin only: acquisition cost + current decants of a perfume (cost never reaches visitors). */
export async function getDecantAdminData(perfumeId: string): Promise<Result<DecantAdminData>> {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró. Inicia sesión de nuevo.' }

  const [{ data: perfume }, { data: decants, error }] = await Promise.all([
    supabase.from('perfumes').select('cost_price, volume_ml').eq('id', perfumeId).single(),
    supabase.from('decants').select('id, perfume_id, volume_ml, price, in_stock, active').eq('perfume_id', perfumeId),
  ])
  return {
    ok: true,
    data: {
      costPrice: perfume?.cost_price ?? null,
      bottleMl: perfume?.volume_ml ?? 0,
      decants: (decants ?? []) as Decant[],
      // table not created yet (migration 004 pending)
      tableMissing: Boolean(error && /does not exist|relation|schema cache/i.test(error.message)),
    },
  }
}

export interface DecantInput { volume_ml: DecantSize; price: number; in_stock: boolean; active: boolean }

export async function saveDecants(perfumeId: string, rows: DecantInput[]): Promise<Result<null>> {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró. Inicia sesión de nuevo.' }

  const clean = rows
    .filter(r => r.active || r.price > 0)
    .map(r => ({ perfume_id: perfumeId, volume_ml: r.volume_ml, price: Math.round(r.price), in_stock: r.in_stock, active: r.active, updated_at: new Date().toISOString() }))
  if (clean.some(r => r.active && !(r.price > 0))) return { ok: false, error: 'Pon un precio a cada decant activo.' }
  if (clean.length === 0) return { ok: true, data: null }

  const { data, error } = await supabase.from('decants').upsert(clean, { onConflict: 'perfume_id,volume_ml' }).select('id')
  if (error) {
    return { ok: false, error: /does not exist|schema cache/i.test(error.message)
      ? 'Falta crear la tabla de decants en Supabase (migración 004).'
      : error.message }
  }
  if (!data || data.length === 0) return { ok: false, error: 'No tienes permiso para editar decants.' }

  revalidatePath('/', 'layout')
  return { ok: true, data: null }
}
