import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Essence Parfumerie — Catálogo de Fragancias',
  description: 'Fragancias árabes, de diseñador y de nicho seleccionadas con el más alto estándar. Originales, 100% auténticas.',
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
