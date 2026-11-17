PAGES.treinador = { Comp: (function () {
class Component extends DCLogic {
  constructor(p) { super(p); this.__m = window.MODPAGE('treinador', 'treinador'); this.__m.init(this); }
  renderVals() { return this.__m.render(this); }
}
return Component; })(), get frag() { return document.getElementById('tpl-treinador').content; }, css: document.getElementById('css-treinador') };
