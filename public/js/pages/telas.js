PAGES.telas = { Comp: (function () {
class Component extends DCLogic {
  renderVals() { const p = this.props; setTimeout(() => { if (window.DSV) window.DSV.show(p); }, 0); return {}; }
}
return Component; })(), frag: document.getElementById('tpl-telas').content, css: document.getElementById('css-telas') };
