import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CatalogClient from '@/components/CatalogClient'
import Hero from '@/components/home/Hero'
import BrandMarquee from '@/components/home/BrandMarquee'
import Families, { FamilyInfo } from '@/components/home/Families'
import BrandPromise from '@/components/home/BrandPromise'
import OffersTeaser from '@/components/home/OffersTeaser'
import OffersRibbon from '@/components/home/OffersRibbon'
import { mockPerfumes } from '@/lib/mock-data'
import { primaryImage } from '@/lib/brand'
import { createClient } from '@supabase/supabase-js'
import { Perfume } from '@/types/perfume'

export const revalidate = 60  // revalidar cada 60 s en servidor

async function fetchPerfumes(): Promise<Perfume[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return mockPerfumes

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('perfumes')
    .select('*, images:perfume_images(*)')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (error || !data || data.length === 0) {
    console.log('[catalog] fallback a mock:', error?.message)
    return mockPerfumes
  }
  return data
}

const CATEGORY_ORDER = ['arabe', 'disenador', 'otros'] as const

export default async function Home() {
  const perfumes = await fetchPerfumes()

  // Hero: featured bottles with photos first, then any other with photos
  const withImage = perfumes.filter(p => primaryImage(p) && p.in_stock)
  const showcase = [
    ...withImage.filter(p => p.featured),
    ...withImage.filter(p => !p.featured),
  ].slice(0, 5)

  const brands = [...new Set(perfumes.map(p => p.brand.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))

  const families: FamilyInfo[] = CATEGORY_ORDER
    .map(category => {
      const items = perfumes.filter(p => p.category === category)
      const images = [
        ...items.filter(p => p.featured),
        ...items.filter(p => !p.featured),
      ].map(primaryImage).filter((u): u is string => !!u).slice(0, 1)
      return { category, count: items.length, images }
    })
    .filter(f => f.count > 0)

  return (
    <>
      <Header overlay />
      <main>
        <Hero showcase={showcase} totalCount={perfumes.length} brandCount={brands.length} />
        <OffersRibbon />
        <Families families={families} />
        <OffersTeaser perfumes={perfumes} />
        <BrandMarquee brands={brands} />
        <CatalogClient perfumes={perfumes} />
        <BrandPromise />
      </main>
      <Footer />
    </>
  )
}
