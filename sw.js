const CACHE_NAME = 'st-ptich-cache';
const URLS_TO_CACHE = [
  '/st-ptich/',
  '/st-ptich/index.html',
  '/st-ptich/tarify.html',
  '/st-ptich/energy.html',
  '/st-ptich/karta.html',
  '/st-ptich/kontakty.html',
  '/st-ptich/dokumenty.html',
  '/st-ptich/about.html',
  'https://cdn.jsdelivr.net/gh/otoipi6-del/st-ptich@main/css/style.css',
  'https://cdn.jsdelivr.net/gh/otoipi6-del/st-ptich@main/images/logo.jpg',
  'https://cdn.jsdelivr.net/gh/otoipi6-del/st-ptich@main/images/ber.jpg'
];

// ===== УСТАНОВКА =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ===== АКТИВАЦИЯ =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ===== ЗАПРОС: Сеть первой, кэш на подстраховку =====
self.addEventListener('fetch', (event) => {
  // HTML-страницы — всегда свежие из сети
  if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Статика (CSS, картинки) — кэш первым
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// ===== АВТООБНОВЛЕНИЕ: проверяем обновления каждые 60 минут =====
setInterval(() => {
  self.registration.update();
}, 60 * 60 * 1000);
