import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import { PerfumeDetail } from '@/components/PerfumeDetail'
import { Perfume } from '@/types/perfume'

export const revalidate = 300  // 5 min en servidor

async function fetchPerfume(id: string): Promise<Perfume | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('perfumes')
    .select('*, images:perfume_images(*)')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

export default async function PerfumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const perfume = await fetchPerfume(id)
  if (!perfume) notFound()

  return (
    <>
      <Header />
      <PerfumeDetail perfume={perfume} />
    </>
  )
}
