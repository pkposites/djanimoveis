(function () {
  'use strict';
  var WA = '5521920080568';
  var MSG = 'Olá! Vim pelo site e estou de acordo com a entrada média de R$ 17 mil e parcelas a partir de R$ 1.000. Quero saber mais sobre os terrenos no Residencial Jardim Europa.';
  var $ = function (id) { return document.getElementById(id); };
  var form = $('lead-form');
  var painelSim = $('painel-sim'), painelNao = $('painel-nao');
  window.dataLayer = window.dataLayer || [];

  // Telefone BR: 10/11 dígitos (aceita +55), DDD 11–99, celular (11 dígitos) começa com 9.
  function normalizaTel(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);
    return d;
  }
  function telValido(v) {
    var d = normalizaTel(v);
    if (!/^[1-9][1-9]/.test(d)) return false;
    if (d.length === 11) return d.charAt(2) === '9';
    if (d.length === 10) return /[2-5]/.test(d.charAt(2));
    return false;
  }
  window.__lpTelValido = telValido;

  function mostrar(el, on) { el.hidden = !on; }
  function acordo() { var c = form.querySelector('input[name=acordo]:checked'); return c ? c.value : ''; }

  var desqualificadoEnviado = false;
  form.addEventListener('change', function (e) {
    if (e.target.name !== 'acordo') return;
    var a = acordo();
    mostrar($('err-acordo'), false);
    mostrar(painelSim, a === 'sim');
    mostrar(painelNao, a === 'nao');
    if (a === 'nao' && !desqualificadoEnviado) {
      desqualificadoEnviado = true;
      window.dataLayer.push({ event: 'lead_desqualificado' });
    }
  });

  function cookie(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function uuid() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
      'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    // Trava: só segue com "Sim".
    if (acordo() !== 'sim') { mostrar($('err-acordo'), acordo() === ''); return; }

    var nome = $('nome').value.trim(), tel = $('tel').value, lgpd = $('lgpd').checked;
    var okNome = nome.length >= 2, okTel = telValido(tel);
    mostrar($('err-nome'), !okNome);
    mostrar($('err-tel'), !okTel);
    mostrar($('err-lgpd'), !lgpd);
    if (!okNome) return $('nome').focus();
    if (!okTel) return $('tel').focus();
    if (!lgpd) return $('lgpd').focus();

    var phone55 = '55' + normalizaTel(tel);
    var eventId = uuid();

    try {
      if (window.LeadHub) {
        window.LeadHub.identify({ name: nome, phone: phone55 });
        window.LeadHub.set({ 'De acordo com entrada e parcela': 'Sim', 'Origem': 'LP Djan' });
      }
    } catch (_) {}
    window.dataLayer.push({ event: 'generate_lead' });
    try {
      if (window.fbq) {
        window.fbq('consent', 'grant'); // consentimento LGPD dado no formulário
        window.fbq('track', 'Lead', {}, { eventID: eventId });
      }
    } catch (_) {}

    try {
      fetch('/api/lead', {
        method: 'POST', keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: nome, phone: phone55, event_id: eventId, fbp: cookie('_fbp'), fbc: cookie('_fbc'), url: location.href })
      }).catch(function () {});
    } catch (_) {}

    var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(MSG);
    const destino = window.LeadHub ? window.LeadHub.whatsappUrl(url) : url;
    if (!window.open(destino, '_blank', 'noopener')) location.href = destino;
  });
})();
