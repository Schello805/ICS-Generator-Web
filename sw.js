/**
 * Service Worker für ICS Tools
 * Version: 2.15.0
 * Ermöglicht vollständige Offline-Nutzung (PWA)
 */

const CACHE_NAME = 'ics-tools-v2.15-security-1';

// Liste aller Kernressourcen für die Offline-Funktionalität
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './generator.html',
    './validator.html',
    './impressum.html',
    './privacy.html',
    './manifest.json',
    './styles.css',
    './favicon.ico',
    './apple-touch-icon.png',
    './apple-touch-icon-16x16.png',
    './apple-touch-icon-32x32.png',
    './Logo ICS Generator.png',
    './components/header.html',
    './components/footer.html',
    './js/components.js',
    './js/generatorPage.js',
    './js/validatorPage.js',
    './js/seo.js',
    './js/modules/dateTimeManager.js',
    './js/modules/eventHandlers.js',
    './js/modules/eventManager.js',
    './js/modules/feedback.js',
    './js/modules/security.js',
    './js/modules/fileDownloader.js',
    './js/modules/generatorInit.js',
    './js/modules/icsFormatter.js',
    './js/modules/icsGenerator.js',
    './js/modules/icsImport.js',
    './js/modules/icsValidator.js',
    './js/modules/timezoneHelper.js',
    './js/modules/validatorHandlers.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Installation: Vorkachen aller Kernressourcen
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await Promise.allSettled(
                PRECACHE_ASSETS.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn('[ServiceWorker] Fehler beim Vorkachen von:', url, err);
                    })
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// Aktivierung: Alte Caches löschen und sofort Kontrolle übernehmen
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Intelligente Caching-Strategie
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Nur GET-Requests mit http/https Schema behandeln
    if (request.method !== 'GET') return;
    if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) return;

    const url = new URL(request.url);

    // 1. HTML-Dokumente und dynamische Komponenten (header/footer): Network-First mit Cache-Fallback
    const isHtmlOrComponent = request.mode === 'navigate' ||
        request.headers.get('accept')?.includes('text/html') ||
        url.pathname.endsWith('.html') ||
        url.pathname.includes('/components/');

    if (isHtmlOrComponent) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    // Offline: Versuche aus dem Cache zu laden
                    const cachedResponse = await caches.match(request, { ignoreSearch: true });
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Falls Hauptseite offline aufgerufen wird
                    if (request.mode === 'navigate') {
                        const fallbackIndex = await caches.match('./index.html', { ignoreSearch: true });
                        if (fallbackIndex) return fallbackIndex;
                    }
                    return new Response('Offline - Ressource nicht im Cache verfügbar', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    });
                })
        );
        return;
    }

    // 2. Statische Assets (CSS, JS, Fonts, Images, CDNs): Stale-While-Revalidate
    event.respondWith(
        caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
            const fetchPromise = fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Hintergrundfehler bei Netzwerk getrost ignorieren
                });

            // Wenn im Cache vorhanden, sofort liefern, ansonsten auf Netzwerk warten
            return cachedResponse || fetchPromise;
        })
    );
});
