const CACHE_NAME = 'st-ptich-cache-v3';
const URLS_TO_CACHE = [
    '/st-ptich/',
    '/st-ptich/index.html',
    '/st-ptich/tarify.html',
    '/st-ptich/energy.html',
    '/st-ptich/karta.html',
    '/st-ptich/kontakty.html',
    '/st-ptich/dokumenty.html',
    '/st-ptich/about.html',
    '/st-ptich/images/icon-192.png',
    '/st-ptich/images/icon-512.png',
    '/st-ptich/images/apple-touch-icon.png',
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

// ===== АКТИВАЦИЯ: чистим старые кеши и берём контроль =====
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => !name.startsWith('st-ptich-cache-v3'))
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// ===== ПРОВЕРКА: является ли запрос HTML-страницей =====
function isHTMLRequest(request) {
    const url = new URL(request.url);
    const isNavigate = request.mode === 'navigate';
    const isHTML = request.headers.get('accept') && request.headers.get('accept').includes('text/html');
    const isPageFile = /\.(html|\/)$/.test(url.pathname);
    return isNavigate || isHTML || isPageFile;
}

// ===== ЗАПРОС =====
self.addEventListener('fetch', (event) => {
    // HTML-страницы — СЕТЬ с резервным кешем (всегда свежие)
    if (isHTMLRequest(event.request)) {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' })
                .then((response) => {
                    // Обновляем кеш свежей версией
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Если сеть недоступна — отдаём кеш
                    return caches.match(event.request).then((cached) => {
                        if (cached) return cached;
                        // Если нет в кеше — отдаём index.html как fallback
                        if (event.request.mode === 'navigate') {
                            return caches.match('/st-ptich/index.html');
                        }
                        throw new Error('Нет в кеше');
                    });
                })
        );
        return;
    }

    // Статика (CSS, картинки) — кеш первым, фоновое обновление
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

// ===== АВТООБНОВЛЕНИЕ =====
setInterval(() => {
    self.registration.update();
}, 60 * 60 * 1000);
