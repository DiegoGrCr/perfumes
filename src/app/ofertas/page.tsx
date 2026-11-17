import type { Metadata } from 'next'
import { PUBLIC_PERFUME_SELECT } from '@/lib/columns'
import { createClient } from '@supabase/supabase-js'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import OffersClient from '@/components/OffersClient'
import { Perfume } from '@/types/perfume'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Ofertas activas · Velvet Perfumes',
  description: 'Fragancias originales con descuento por tiempo limitado.',
}

async function fetchOffers(): Promise<Perfume[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  const supabase = createClient(url, key)
  const { data } = await supabase
    .from('perfumes')
    .select(PUBLIC_PERFUME_SELECT)
    .not('original_price', 'is', null)
  return data ?? []
}

export default async function OffersPage() {
  const perfumes = await fetchOffers()
  return (
    <>
      <Header />
      <OffersClient perfumes={perfumes} />
      <Footer />
    </>
  )
}
