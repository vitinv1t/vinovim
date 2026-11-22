// Vinovim: service worker com atualização automática
const CACHE = 'vinovim-v5';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];
const NUNCA = /^\/(api\/|_vercel\/|version\.json|downloads|manutencao|entrar|v-[0-9a-f]{24}|admin\.js)/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting(); // a versão nova assume logo
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// rede primeiro; só guarda respostas boas (nunca a página de manutenção, que vem com 503)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || NUNCA.test(url.pathname)) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok && r.type === 'basic') {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
  );
});
