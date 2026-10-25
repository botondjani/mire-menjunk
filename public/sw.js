// Offline támogatás: az app héja cache-ből, az adat hálózatról (offline: utolsó ismert).
const VERSION = 'v24';
const SHELL = ['./', 'index.html', 'app.js?v=24', 'auth.js?v=24', 'styles.css?v=24', 'fonts/figtree-400.woff2', 'fonts/figtree-600.woff2', 'fonts/bricolage-800.woff2', 'adatvedelem.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192-v2.png'];

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
    if (e.request.destination === 'image' && !url.hostname.endsWith('tile.openstreetmap.org')) {
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

// Értesítések (emlékeztetők, követett helyek új programjai) – a szerver JSON-t küld: { title, body, url, tag }.
self.addEventListener('push', (e) => {
  let n = {};
  try { n = e.data.json(); } catch { n = { title: 'Hova menjünk?', body: e.data?.text() || '' }; }
  e.waitUntil(self.registration.showNotification(n.title || 'Hova menjünk?', {
    body: n.body,
    tag: n.tag,
    icon: new URL('icons/icon-192-v2.png', self.registration.scope).href,
    badge: new URL('icons/badge-96.png', self.registration.scope).href,
    data: { url: n.url || self.registration.scope },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const open = list.find((c) => c.url.startsWith(self.registration.scope));
    return open ? open.navigate(url).then((c) => c?.focus()) : self.clients.openWindow(url);
  }));
});
