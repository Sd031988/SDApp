const CACHE_NAME = 'sd-bewerbungsstudio-v31';
const APP_FILES = [
  './Lebenslauf_app.html',
  './manifest.json',
  './icon.svg',
  './sd-auth.js?v=5',
  './i18n.js?v=1'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Netzwerk zuerst, damit Änderungen sofort ankommen; nur erfolgreiche
  // Antworten werden zwischengespeichert (nie eine Fehlerseite/404), und nur
  // wenn das Netz nicht erreichbar ist, wird auf den Cache zurückgegriffen.
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
