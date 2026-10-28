// Offline support: app files load from the network when online (so updates show up)
// and from this cache when offline. Fonts are cached on first use.
const CACHE = 'daybook-v6';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

function stash(req, res) {
  if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
  return res;
}

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    ev.respondWith(fetch(req).then(res => stash(req, res))
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    ev.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => stash(req, res))));
  }
});
