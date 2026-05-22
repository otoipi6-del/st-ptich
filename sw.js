const CACHE_NAME = 'st-ptich-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/about.html',
  '/tarify.html',
  '/karta.html',
  '/kontakty.html',
  '/dokumenty.html',
  '/css/style.css',
  '/manifest.json',
  '/images/logo.jpg',
  '/images/ber.jpg',
  '/images/ozero.jpg',
  '/images/moln.jpg',
  '/images/apple-touch-icon.png'
];

// Установка: кэшируем файлы
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
      .catch(function(err) {
        console.log('Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Активация: удаляем старые кэши
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Запрос: сначала сеть, потом кэш
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Если получили ответ от сети — обновляем кэш
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Если сеть недоступна — берём из кэша
        return caches.match(event.request).then(function(response) {
          return response || new Response('Офлайн-режим. Проверьте подключение к интернету.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
