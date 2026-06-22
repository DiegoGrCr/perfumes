const CACHE = 'velvet-v1'

self.addEventListener('install', ev => {
  self.skipWaiting()
  ev.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['/', '/icons/icon-192.png', '/icons/icon-512.png']).catch(() => {})
    )
  )
})

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', ev => {
  const { request } = ev
  const url = new URL(request.url)

  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return
  if (url.hostname.includes('supabase.co')) return
  if (url.pathname.includes('_next/webpack-hmr')) return
  if (url.pathname.startsWith('/api/')) return

  // Cache-first: JS/CSS bundles, imágenes, iconos (no cambian entre visitas)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpe?g|webp|svg|ico|woff2?)$/)
  ) {
    ev.respondWith(
      caches.match(request).then(cached =>
        cached ?? fetch(request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()))
          return res
        })
      )
    )
    return
  }

  // Network-first con fallback a caché: páginas y datos RSC
  ev.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      })
      .catch(() => caches.match(request).then(cached => cached ?? Response.error()))
  )
})
