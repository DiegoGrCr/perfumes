import type { Metadata } from 'next'
import { PUBLIC_PERFUME_SELECT } from '@/lib/columns'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { PerfumeDetail } from '@/components/PerfumeDetail'
import { Perfume } from '@/types/perfume'
import { fetchDecants } from '@/lib/decants'

export const revalidate = 300  // 5 min en servidor

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key ? createClient(url, key) : null
}

async function fetchPerfume(id: string): Promise<Perfume | null> {
  const supabase = client()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('perfumes')
    .select(PUBLIC_PERFUME_SELECT)
    .eq('id', id)
    .single()
  if (error || !data) return null
  return data
}

async function fetchRelated(p: Perfume): Promise<Perfume[]> {
  const supabase = client()
  if (!supabase) return []
  const { data } = await supabase
    .from('perfumes')
    .select(PUBLIC_PERFUME_SELECT)
    .eq('category', p.category)
    .neq('id', p.id)
    .order('featured', { ascending: false })
    .limit(12)
  if (!data) return []
  // Prefer same gender, then in-stock
  return [...data]
    .sort((a, b) =>
      Number(b.gender === p.gender) - Number(a.gender === p.gender) ||
      Number(b.in_stock) - Number(a.in_stock))
    .slice(0, 4)
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const perfume = await fetchPerfume(id)
  if (!perfume) return {}
  return {
    title: `${perfume.name} — ${perfume.brand} · Velvet Perfumes`,
    description: perfume.description?.slice(0, 160),
  }
}

export default async function PerfumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const perfume = await fetchPerfume(id)
  if (!perfume) notFound()
  const supabase = client()
  const [related, decants] = await Promise.all([fetchRelated(perfume), supabase ? fetchDecants(supabase, perfume.id) : []])

  return (
    <>
      <Header />
      <PerfumeDetail perfume={perfume} related={related} decants={decants} />
      <Footer />
    </>
  )
}
