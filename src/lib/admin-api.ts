import { supabase } from './supabase'
import { Perfume, PerfumeImage, Sale } from '@/types/perfume'

export type PerfumeFormData = Omit<Perfume, 'id' | 'created_at' | 'images'>

export async function getAllPerfumesAdmin(): Promise<Perfume[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('perfumes')
    .select('*, images:perfume_images(*)')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function getPerfumeById(id: string): Promise<Perfume | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('perfumes')
    .select('*, images:perfume_images(*)')
    .eq('id', id)
    .single()

  if (error) { console.error(error); return null }
  return data
}

export async function createPerfume(payload: PerfumeFormData): Promise<Perfume | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('perfumes')
    .insert([payload])
    .select()
    .single()

  if (error) { console.error(error); return null }
  return data
}

export async function updatePerfume(id: string, payload: Partial<PerfumeFormData>): Promise<Perfume | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('perfumes')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) { console.error(error); return null }
  return data
}

export async function deletePerfume(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('perfumes').delete().eq('id', id)
  if (error) console.error(error)
  return !error
}

export async function getImagesByPerfume(perfumeId: string): Promise<PerfumeImage[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('perfume_images')
    .select('*')
    .eq('perfume_id', perfumeId)
    .order('sort_order')

  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function updateStockQuantity(id: string, stock_quantity: number): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from('perfumes')
    .update({ stock_quantity })
    .eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

export async function getAllSales(): Promise<Sale[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('sold_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data ?? []
}

export interface SalePayload {
  perfume_id: string | null
  perfume_name: string
  perfume_brand: string
  volume_ml: number
  quantity: number
  cost_price: number
  sale_price: number
  notes?: string
  sold_at: string
}

export async function createSale(payload: SalePayload): Promise<Sale | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('sales')
    .insert([payload])
    .select()
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function deleteSale(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('sales').delete().eq('id', id)
  if (error) { console.error(error); return false }
  return true
}
