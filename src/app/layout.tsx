import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Essence Parfumerie — Catálogo de Fragancias',
  description: 'Fragancias árabes, de diseñador y de nicho seleccionadas con el más alto estándar. Originales, 100% auténticas.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Essence Parfumerie',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ background: '#080808', minHeight: '100vh' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
