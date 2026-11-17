import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DecantsClient from '@/components/DecantsClient'
import { fetchDecants } from '@/lib/decants'
import type { Decant } from '@/types/perfume'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Decants 5 y 10 ml · Velvet Perfumes',
  description: 'Prueba fragancias originales en decants de 5 y 10 ml antes de comprar el frasco completo.',
}

async function load(): Promise<Decant[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  return fetchDecants(createClient(url, key))
}

export default async function DecantsPage() {
  const decants = await load()
  return (
    <>
      <Header />
      <DecantsClient decants={decants} />
      <Footer />
    </>
  )
}
