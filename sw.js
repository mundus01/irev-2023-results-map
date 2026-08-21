const CACHE_NAME = "irev-map-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.mode === "navigate") {
    return;
  }

  const cachePromise = caches.open(CACHE_NAME);
  const networkPromise = cachePromise.then((cache) =>
    fetch(request).then((response) => {
      if (response.ok) {
        void cache.put(request, response.clone());
      }
      return response;
    }),
  );
  const cachedPromise = cachePromise.then((cache) => cache.match(request));

  event.respondWith(cachedPromise.then((cached) => cached || networkPromise));
  event.waitUntil(networkPromise.catch(() => undefined));
});
