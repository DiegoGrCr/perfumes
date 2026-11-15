import { Perfume } from '@/types/perfume'

/** WhatsApp where every order and inquiry goes (country code 52 + 10 digits). */
export const WHATSAPP_NUMBER = '524411057796'
export const WHATSAPP_DISPLAY = '+52 441 105 7796'

/** Order policy — single source for the cart, the terms page and messages. */
export const POLICY = {
  depositPct: 30,          // anticipo, % of each qualifying fragrance's price
  depositFrom: 800,        // applies to fragrances priced above this (MXN)
  // 'todas' → every fragrance above depositFrom · 'sobre-pedido' → only special-order ones above depositFrom
  depositScope: 'todas' as 'todas' | 'sobre-pedido',
  cancelFeePct: 20,        // % of the fragrance's price kept from the deposit if the customer cancels (logistics)
}

/** Does this fragrance require the anticipo? */
export const needsDeposit = (p: Pick<Perfume, 'price' | 'in_stock'>) =>
  p.price > POLICY.depositFrom && (POLICY.depositScope === 'todas' || !p.in_stock)

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
