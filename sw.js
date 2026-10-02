const CACHE_NAME = 'sd-bewerbungsstudio-v43';
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

// Grosse KI-Modelldateien (lokales Llama im KI-Assistenten) NICHT hier
// zwischenspeichern: die Bibliothek legt sie schon selbst im Browser-
// Speicher ab - sonst laegen ca. 1-2 GB doppelt auf dem Geraet.
const NICHT_CACHEN = /(^|\.)(huggingface\.co|hf\.co|xethub\.hf\.co|raw\.githubusercontent\.com)$/;

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  try {
    if (NICHT_CACHEN.test(new URL(event.request.url).hostname)) return;
  } catch (e) { /* ungueltige URL: normal weiter */ }
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
