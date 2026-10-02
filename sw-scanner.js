const CACHE_NAME = 'sd-scanner-v8';
const APP_FILES = ['./scanner.html', './manifest-scanner.json', './icon.svg', './sd-auth.js?v=3', './i18n.js?v=1'];

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

// Grosse KI-Modelldateien (SD Lotse) nicht doppelt speichern - die
// Bibliothek legt sie schon selbst im Browser-Speicher ab.
const NICHT_CACHEN = /(^|\.)(huggingface\.co|hf\.co|xethub\.hf\.co|raw\.githubusercontent\.com)$/;

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  try {
    if (NICHT_CACHEN.test(new URL(event.request.url).hostname)) return;
  } catch (e) { /* ungueltige URL: normal weiter */ }
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
