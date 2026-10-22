// Offline támogatás: az app héja cache-ből, az adat hálózatról (offline: utolsó ismert).
const VERSION = 'v5';
const SHELL = ['./', 'index.html', 'app.js?v=5', 'styles.css?v=5', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(`shell-${VERSION}`).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function networkFirst(req, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (fallbackUrl && (await caches.match(fallbackUrl))) || Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) {
    // Képek a forrásoldalakról: cache-first, hogy offline is látszódjanak a mentettek.
    if (e.request.destination === 'image') {
      e.respondWith(caches.open(`img-${VERSION}`).then(async (c) => (await c.match(e.request))
        || fetch(e.request).then((res) => { c.put(e.request, res.clone()); return res; })));
    }
    return;
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(networkFirst(e.request, `pages-${VERSION}`, new URL('index.html', self.registration.scope).href));
  } else if (url.pathname.endsWith('/data/events.json')) {
    e.respondWith(networkFirst(e.request, `data-${VERSION}`));
  } else {
    // Stale-while-revalidate: azonnal a cache-ből, közben frissítünk a következő megnyitásra.
    e.respondWith(caches.open(`shell-${VERSION}`).then(async (c) => {
      const hit = await c.match(e.request);
      const fresh = fetch(e.request).then((res) => { if (res.ok) c.put(e.request, res.clone()); return res; });
      if (hit) { e.waitUntil(fresh.catch(() => {})); return hit; }
      return fresh;
    }));
  }
});
