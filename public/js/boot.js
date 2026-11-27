/* Carrega GTM e Meta Pixel só se configurados (public/config.js). Pixel começa com consentimento revogado. */
(function () {
  var cfg = window.__LP_CONFIG || {};
  window.dataLayer = window.dataLayer || [];

  /* Identificadores de correspondência (sem dado pessoal): visitante persistente e event_id do PageView. */
  function uuid() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
      'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  }
  function cookie(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function visitorId() {
    var id = '';
    try { id = localStorage.getItem('lp_vid') || ''; } catch (_) {}
    if (!id) id = cookie('lp_vid');
    if (!id) id = uuid();
    try { localStorage.setItem('lp_vid', id); } catch (_) {}
    try { document.cookie = 'lp_vid=' + id + ';max-age=63072000;path=/;SameSite=Lax;Secure'; } catch (_) {}
    return id;
  }
  function fbc() {
    var c = cookie('_fbc');
    if (c) return c;
    var m = location.search.match(/[?&]fbclid=([^&#]+)/);
    return m ? 'fb.1.' + Date.now() + '.' + decodeURIComponent(m[1]) : '';
  }
  window.__lp = { vid: visitorId(), pvId: uuid(), fbp: function () { return cookie('_fbp'); }, fbc: fbc };
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
    window.fbq('track', 'PageView', {}, { eventID: window.__lp.pvId });
  }
  /* PageView no servidor (CAPI), mesmo event_id do pixel; sem dados pessoais. Só se o Pixel estiver configurado. */
  if (cfg.metaPixelId) {
    var sendPv = function () {
      setTimeout(function () {
        try {
          fetch('/api/lead', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ event_name: 'PageView', event_id: window.__lp.pvId, external_id: window.__lp.vid,
              fbp: window.__lp.fbp(), fbc: window.__lp.fbc(), url: location.href }) }).catch(function () {});
        } catch (_) {}
      }, 1200); /* dá tempo do fbevents criar o cookie _fbp */
    };
    if (document.readyState === 'complete') sendPv(); else window.addEventListener('load', sendPv);
  }
  /* Microsoft Clarity (projeto Djan Imóveis) */
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', 'zd56gxvv8r');
})();
