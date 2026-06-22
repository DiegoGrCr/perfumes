import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: 'Essence Parfumerie — Catálogo de Fragancias',
  description: 'Fragancias árabes, de diseñador y de nicho seleccionadas con el más alto estándar. Originales, 100% auténticas.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ background: '#080808', minHeight: '100vh' }}>
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
