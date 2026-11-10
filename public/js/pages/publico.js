PAGES.publico = { Comp: (function () {
class Component extends DCLogic {
  constructor(p) { super(p); this.__m = window.MODPAGE('publico', 'publico'); this.__m.init(this); }
  renderVals() { return this.__m.render(this); }
}
return Component; })(), frag: document.getElementById('tpl-publico').content, css: document.getElementById('css-publico') };
