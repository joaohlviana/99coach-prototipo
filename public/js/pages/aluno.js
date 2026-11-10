PAGES.aluno = { Comp: (function () {
class Component extends DCLogic {
  constructor(p) { super(p); this.__m = window.MODPAGE('aluno', 'aluno'); this.__m.init(this); }
  renderVals() { return this.__m.render(this); }
}
return Component; })(), frag: document.getElementById('tpl-aluno').content, css: document.getElementById('css-aluno') };
