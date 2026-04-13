// Matomo Tracking (no cookies)
// Host: https://analytics.schellenberger.biz/
// Site ID: 35
(function () {
    window._paq = window._paq || [];
    window._paq.push(['trackPageView']);
    window._paq.push(['enableLinkTracking']);

    const baseUrl = 'https://analytics.schellenberger.biz/';
    window._paq.push(['setTrackerUrl', baseUrl + 'matomo.php']);
    window._paq.push(['setSiteId', '35']);

    const d = document;
    const g = d.createElement('script');
    const s = d.getElementsByTagName('script')[0];
    g.async = true;
    g.src = baseUrl + 'matomo.js';
    s.parentNode.insertBefore(g, s);
})();

