/* Carrega GTM e Meta Pixel só se configurados (public/config.js). Pixel começa com consentimento revogado. */
(function () {
  var cfg = window.__LP_CONFIG || {};
  window.dataLayer = window.dataLayer || [];
  if (cfg.gtmId) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(cfg.gtmId);
    document.head.appendChild(g);
  }
  if (cfg.metaPixelId) {
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('consent', 'revoke');
    window.fbq('init', cfg.metaPixelId);
    window.fbq('track', 'PageView');
  }
})();
