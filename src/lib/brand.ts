import { Perfume } from '@/types/perfume'

export const WHATSAPP_NUMBER = '527296769572'

export const waLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`

const mxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** $1,799 — drops cents when they are zero */
export const formatPrice = (n: number) => mxn.format(n).replace('MX', '').trim()

export const primaryImage = (p: Perfume) =>
  p.images?.find(i => i.is_primary)?.url ?? p.images?.[0]?.url ?? p.image_url

/** Images ordered with the primary first. */
export const orderedImages = (p: Perfume) =>
  [...(p.images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  )

export const stockLabel = (p: Pick<Perfume, 'in_stock'>) => (p.in_stock ? 'En existencia' : 'Sobre pedido')

/** Default catalog order: in stock first; inside each group, pinned (featured) first. */
export const byAvailability = (a: Perfume, b: Perfume) =>
  Number(b.in_stock) - Number(a.in_stock) || Number(b.featured) - Number(a.featured)

export const discountPct = (p: Perfume) =>
  p.original_price && p.original_price > p.price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : null
