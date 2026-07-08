/* DockerForge — Service Worker (offline-first cache pour app statique) */
const VERSION = 'dockerforge-v1'
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(CORE).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Stratégie : network-first pour la nav (index.html) afin d'avoir la dernière version,
// cache-first pour les assets (JS/CSS/icônes). Fallback réseau -> cache -> offline.
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  const isNav = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')

  if (isNav) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone()
          caches.open(VERSION).then((c) => c.put(req, clone)).catch(() => {})
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    )
    return
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req).then((res) => {
        if (res && res.status === 200 && url.origin === self.location.origin) {
          const clone = res.clone()
          caches.open(VERSION).then((c) => c.put(req, clone)).catch(() => {})
        }
        return res
      }).catch(() => cached)
    })
  )
})
