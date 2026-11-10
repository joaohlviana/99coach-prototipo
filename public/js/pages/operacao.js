PAGES.operacao = { Comp: (function () {
class Component extends DCLogic {
  constructor(p) { super(p); this.__m = window.MODPAGE('operacao', 'operacao'); this.__m.init(this); }
  renderVals() { return this.__m.render(this); }
}
return Component; })(), frag: document.getElementById('tpl-operacao').content, css: document.getElementById('css-operacao') };
