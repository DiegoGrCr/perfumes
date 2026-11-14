import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Montserrat } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { getOffersSummary } from '@/lib/offers'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Velvet Perfumes — Fragancias originales',
  description: 'Fragancias árabes y de diseñador seleccionadas con el más alto estándar. Originales, 100% auténticas.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Velvet',
  },
  icons: {
    icon: [
      { url: '/icons/icon-16.png',  sizes: '16x16',  type: 'image/png' },
      { url: '/icons/icon-32.png',  sizes: '32x32',  type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: '#F6F1EB',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const offers = await getOffersSummary()
  return (
    // data-scroll-behavior: lets Next jump instantly to the top on route changes
    // while keeping smooth scrolling for in-page anchors (Next 16 no longer does this by default)
    <html lang="es" data-scroll-behavior="smooth" className={`${cormorant.variable} ${montserrat.variable}`}>
      <body className="min-h-screen bg-ivory text-ink font-sans">
        <ServiceWorkerRegister />
        <Providers offers={offers}>{children}</Providers>
      </body>
    </html>
  )
}
