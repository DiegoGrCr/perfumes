import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Velvet',
    short_name: 'Velvet',
    description: 'Catálogo de fragancias árabes, de diseñador y de nicho',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#C9A84C',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
