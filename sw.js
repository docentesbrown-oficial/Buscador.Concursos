// Docentes Brown - Buscador de Concursos
// Service Worker con actualización automática y HTML siempre fresco.
const CACHE_NAME = "docentes-brown-concursos-2026-06-12-1325";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => key === CACHE_NAME ? null : caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Para el HTML principal: primero red, nunca una versión vieja del caché.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(new Request(request, { cache: "reload" }))
        .catch(() => caches.match(request))
    );
    return;
  }

  // Para archivos propios: red primero, caché solo como respaldo offline.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(new Request(request, { cache: "reload" }))
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Para recursos externos: red normal.
  event.respondWith(fetch(request));
});
