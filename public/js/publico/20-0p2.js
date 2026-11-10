/* P2 · utilidades das telas públicas da frente P2 (ajuda, retirada, vistos, mapa, programas, local, organização).
   Tudo dentro de uma função para não vazar nomes no script único da página. */
(function () {
  'use strict';
  var noop = function () {};
  // protocolos de exemplo: 99C-2610-xxxx (26/10)
  DB.seed('p2_seq', { n: 5203 });
  window.P2 = {
    noop: noop,
    // valor de ctx.ui com padrão (ui é zerado ao trocar de tela ou de situação)
    g: function (ui, k, d) { return ui[k] !== undefined ? ui[k] : d; },
    // aviso de situação: kind ok|warn|risk|info|'' · ic nome do ícone
    alert: function (kind, ic, title, text, btn, fn, btn2, fn2) {
      return {
        cls: 'alert' + (kind ? ' alert--' + kind : '') + ' p2-alert', ic: 'ic ic--sm i-' + ic, title: title, text: text || '',
        hasBtn: !!btn, btn: btn || '', act: fn || noop, hasBtn2: !!btn2, btn2: btn2 || '', act2: fn2 || noop
      };
    },
    // foto do DS ou iniciais
    pic: function (blob, name) {
      var src = blob ? U.img(blob) : '';
      return { src: src, hasImg: !!src, noImg: !src, ini: U.ini(name) };
    },
    protocol: function () { DB.p2_seq.n += 1; return '99C-2610-' + String(DB.p2_seq.n); },
    email: function (t) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(t || '').trim()); },
    // ação de "voltar" segura: volta no histórico
    back: function (ctx) { return function () { ctx.back(); }; }
  };
})();
