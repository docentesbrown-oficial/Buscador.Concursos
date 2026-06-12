// Docentes Brown - Buscador de Concursos
// Service Worker estable: evita caché vieja sin provocar recargas constantes.
const CACHE_NAME = "docentes-brown-concursos-2026-06-12-estable";

self.addEventListener("install", () => {
  // Activa el nuevo service worker sin esperar a que se cierren todas las pestañas.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // HTML principal: red primero. Si no hay conexión, usa caché como respaldo.
  if (request.mode === "navigate" || request.destination === "document") {
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

  // Archivos propios: red primero, caché solo como respaldo offline.
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

  // Recursos externos: red normal.
  event.respondWith(fetch(request));
});
