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
  /** label/liquid_color columns not created yet (migration 005 pending) */
  lookMissing: boolean
  perfume: { name: string; brand: string; concentration?: string; image?: string }
  label: string | null
  liquidColor: string | null
}

const missing = (msg?: string) => Boolean(msg && /does not exist|relation|schema cache|column/i.test(msg))

async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ? supabase : null
}

/** Admin only: acquisition cost + current decants of a perfume (cost never reaches visitors). */
export async function getDecantAdminData(perfumeId: string): Promise<Result<DecantAdminData>> {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró. Inicia sesión de nuevo.' }

  const base = 'id, perfume_id, volume_ml, price, in_stock, active'
  const [{ data: perfume }, first] = await Promise.all([
    supabase.from('perfumes')
      .select('name, brand, concentration, cost_price, volume_ml, images:perfume_images(url, is_primary, sort_order)')
      .eq('id', perfumeId).single(),
    supabase.from('decants').select(`${base}, label, liquid_color`).eq('perfume_id', perfumeId),
  ])
  let decants = first.data as Decant[] | null, error = first.error, lookMissing = false
  if (error && missing(error.message)) {
    // maybe only the 005 columns are missing → retry without them
    const r = await supabase.from('decants').select(base).eq('perfume_id', perfumeId)
    decants = r.data as Decant[] | null; lookMissing = !r.error; error = r.error
  }
  const imgs = [...(perfume?.images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
  const look = decants?.find(d => d.label || d.liquid_color)
  return {
    ok: true,
    data: {
      costPrice: perfume?.cost_price ?? null,
      bottleMl: perfume?.volume_ml ?? 0,
      decants: decants ?? [],
      tableMissing: missing(error?.message), // migration 004 pending
      lookMissing,
      perfume: { name: perfume?.name ?? '', brand: perfume?.brand ?? '', concentration: perfume?.concentration ?? undefined, image: imgs[0]?.url },
      label: look?.label ?? null,
      liquidColor: look?.liquid_color ?? null,
    },
  }
}

export interface DecantInput { volume_ml: DecantSize; price: number; in_stock: boolean; active: boolean }

export interface DecantLook { label: string | null; liquid_color: string | null }

export async function saveDecants(perfumeId: string, rows: DecantInput[], look?: DecantLook): Promise<Result<null>> {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, error: 'Tu sesión expiró. Inicia sesión de nuevo.' }

  const label = look?.label?.trim().slice(0, 40) || null
  const liquid_color = look?.liquid_color && /^#[0-9a-f]{6}$/i.test(look.liquid_color) ? look.liquid_color.toLowerCase() : null
  const clean = rows
    .filter(r => r.active || r.price > 0)
    .map(r => ({
      perfume_id: perfumeId, volume_ml: r.volume_ml, price: Math.round(r.price), in_stock: r.in_stock, active: r.active,
      updated_at: new Date().toISOString(),
      ...(look ? { label, liquid_color } : {}),
    }))
  if (clean.some(r => r.active && !(r.price > 0))) return { ok: false, error: 'Pon un precio a cada decant activo.' }
  if (clean.length === 0) return { ok: true, data: null }

  const { data, error } = await supabase.from('decants').upsert(clean, { onConflict: 'perfume_id,volume_ml' }).select('id')
  if (error) {
    if (look && /label|liquid_color/.test(error.message)) {
      return { ok: false, error: 'Falta agregar el nombre y color de etiqueta en Supabase (migración 005).' }
    }
    return { ok: false, error: /does not exist|schema cache/i.test(error.message)
      ? 'Falta crear la tabla de decants en Supabase (migración 004).'
      : error.message }
  }
  if (!data || data.length === 0) return { ok: false, error: 'No tienes permiso para editar decants.' }

  revalidatePath('/', 'layout')
  return { ok: true, data: null }
}
