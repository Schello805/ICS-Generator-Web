/**
 * SEO/Sharing Baselines
 * - canonical
 * - og:url + og:image
 * - twitter:url + twitter:image
 *
 * Hinweis: Wir setzen URLs dynamisch anhand von location.*,
 * um keine feste Domain im Code zu hardcoden.
 */

function setMeta(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
}

function ensureCanonical(href) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', href);
}

function getCanonicalUrl() {
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '';
    // Wenn der Server "/" ausliefert, lassen wir das so.
    // Wenn lokal via index.html geöffnet, bleibt es ebenfalls korrekt.
    return url.toString();
}

function getDefaultImageUrl() {
    return new URL('/apple-touch-icon.png', window.location.origin).toString();
}

function initSeo() {
    const canonicalUrl = getCanonicalUrl();
    const imageUrl = getDefaultImageUrl();

    ensureCanonical(canonicalUrl);

    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[property="og:image"]', imageUrl);

    setMeta('meta[name="twitter:url"]', canonicalUrl);
    setMeta('meta[name="twitter:image"]', imageUrl);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSeo);
} else {
    initSeo();
}

