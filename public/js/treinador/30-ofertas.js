/* T4 · Ofertas: serviços, planos e ofertas (TRE29), cupons (TRE30) e proposta individual (TRE31) */
(function () {
  var T4 = window.T4;
  // o que cada oferta inclui (texto confirmado pelo treinador) e se aparece no perfil
  DB.seed('t4_ofmeta', {
    o1: { incl: 'Treino no app · ajuste a cada 4 semanas · check-in semanal', shown: true, savedAt: '20/10 09:00' },
    o2: { incl: 'Uma sessão de 60 min no Centro', shown: true, savedAt: '02/10 11:20' },
    o3: { incl: '8 aulas presenciais de 60 min · validade de 60 dias', shown: false, savedAt: '15/10 17:45' },
    o4: { incl: 'Acesso ao programa CrossFit do zero por 12 meses', shown: true, savedAt: '12/10 09:40' }
  });
  DB.seed('t4_cupmeta', {
    k1: { cycles: '3 primeiros ciclos', created: '01/10', last: '22/10', oneUse: true },
    k2: { cycles: 'cobrança única', created: '01/09', last: '29/09', oneUse: true }
  });
  var CYCLES = [['mensal', 'Mensal'], ['sessao', 'Por sessão'], ['unico', 'Cobrança única']];
  var cycleOf = function (o) { return o.kind === 'recorrente' ? 'mensal' : (o.kind === 'avulsa' ? 'sessao' : 'unico'); };
  var unitOf = function (cy, o) { return cy === 'mensal' ? 'mês' : (cy === 'sessao' ? 'sessão' : (o && (o.unit === 'acesso' || o.unit === 'pacote') ? o.unit : 'pacote')); };
  var kindOf = function (cy, o) { return o && o.kind === 'programa' ? 'programa' : (cy === 'mensal' ? 'recorrente' : (cy === 'sessao' ? 'avulsa' : 'pacote')); };
  var num = function (s) { var n = parseFloat(String(s == null ? '' : s).replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
  var ofm = function (id) { if (!DB.t4_ofmeta[id]) DB.t4_ofmeta[id] = { incl: '', shown: false, savedAt: '' }; return DB.t4_ofmeta[id]; };

  /* ---------------- TRE29 · serviços, planos e ofertas ---------------- */
  REG.screen({
    page: 'treinador', key: 'ofertas', id: 'TRE29', title: 'Ofertas', nav: 'ofertas', wide: true,
    testIds: ['o3', 'o4'],
    normal: 'Editando',
    scens: [['salvo', 'Salvo'], ['vendaoff', 'Venda desligada'], ['preco', 'Preço mudou'], ['capacidade', 'Capacidade de venda pendente'], ['cotacao', 'Cotação alterada'], ['politica', 'Política indisponível'], ['falha', 'Falha ao salvar']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var prog = ctx.p.prog ? T4.prog(ctx.p.prog) : null;
      var isNew = ui.sel === 'novo' || (!ui.sel && !!prog && !T4.offerOf(prog.id));
      var o = isNew ? null : (DB.find('ofertas', ui.sel || ctx.id) || (prog && T4.offerOf(prog.id)) || DB.find('ofertas', 'o1'));
      var meta = o ? ofm(o.id) : { incl: '', shown: false, savedAt: '' };
      var base = o ? { name: o.name, price: String(o.price).replace('.', ','), cycle: cycleOf(o), fmt: o.fmt, accept: o.accept, incl: meta.incl, shown: meta.shown }
        : { name: prog ? prog.name : '', price: prog ? String(prog.price) : '', cycle: 'unico', fmt: 'online', accept: 'direta', incl: prog ? 'Acesso ao programa ' + prog.name + ' por 12 meses' : '', shown: false };
      if (scn === 'falha' && !ui.fixed && ui.price == null) base.price = '0';
      if (scn === 'salvo' && ui.shown == null) base.shown = false;
      var f = {};
      Object.keys(base).forEach(function (k) { f[k] = ui[k] != null ? ui[k] : base[k]; });
      var price = num(f.price);
      var unit = unitOf(f.cycle, o);
      var inclChanged = isNew || f.incl !== meta.incl;
      var inclOk = !inclChanged || !!ui.inclOk;
      var policyDown = scn === 'politica' && !ui.cons;
      var saleBlock = (scn === 'vendaoff' && 'Habilite recebimentos primeiro: sem conta de recebimento, a venda fica desligada.') || (scn === 'capacidade' && !ui.cons && 'A verificação da sua conta de recebimentos ainda está em análise.') || '';
      var priceErr = ui.priceErr || (scn === 'falha' && !ui.fixed ? 'O preço precisa ser maior que zero.' : '');

      var apply = function () {
        var cy = f.cycle;
        if (isNew) {
          var id = DB.uid('o');
          var no = { id: id, name: String(f.name).trim(), kind: prog ? 'programa' : kindOf(cy, null), price: price, unit: prog ? 'acesso' : unitOf(cy, null), fmt: f.fmt, sale: false, accept: f.accept, active: 0, version: 1 };
          if (prog) no.program = prog.id;
          DB.ofertas.push(no);
          DB.t4_ofmeta[id] = { incl: f.incl, shown: !!f.shown, savedAt: T4.stamp() };
          ctx.setUi({ sel: id, name: null, price: null, cycle: null, fmt: null, accept: null, incl: null, shown: null, inclOk: false, priceErr: '', fixed: true });
          ctx.toast('Oferta criada · v1 · ' + T4.stamp() + '. Venda desligada: salvar não publica nem cobra.');
          return;
        }
        o.name = String(f.name).trim(); o.price = price; o.unit = unit; o.kind = kindOf(cy, o); o.fmt = f.fmt; o.accept = f.accept; o.version += 1;
        meta.incl = f.incl; meta.shown = !!f.shown; meta.savedAt = T4.stamp();
        ctx.setUi({ name: null, price: null, cycle: null, fmt: null, accept: null, incl: null, shown: null, inclOk: false, priceErr: '', fixed: true });
        ctx.toast('Oferta salva · v' + o.version + ' · ' + meta.savedAt + '. Salvar não publica nem cobra.');
      };
      var save = function () {
        if (policyDown) { ctx.toast('A política de cancelamento não carregou. Tente de novo antes de salvar.'); return; }
        if (String(f.name || '').trim().length < 3) { ctx.setUi({ nameErr: 'Dê um nome com pelo menos 3 letras.' }); return; }
        if (!(price > 0)) { ctx.setUi({ priceErr: 'O preço precisa ser maior que zero. Seus campos continuam preenchidos.' }); return; }
        if (!inclOk) { ctx.setUi({ inclErr: 'Confirme o que está incluído antes de salvar.' }); return; }
        if (o && price !== o.price && o.active > 0) {
          ctx.ask({ title: 'Preço mudou para quem já contratou', ok: 'Salvar v' + (o.version + 1),
            lines: [o.active + ' contratos ativos continuam com ' + U.money(o.price) + ' / ' + o.unit + ' até mudarem de plano.', 'O novo preço (' + U.money(price) + ' / ' + unit + ') vale para novas contratações e propostas novas.', 'Propostas já enviadas mantêm o valor da versão enviada.', 'Demonstração: nada é cobrado.'],
            onOk: apply });
          return;
        }
        apply();
      };
      var toggleSale = function () {
        if (!o) { ctx.toast('Salve a oferta antes de ligar a venda.'); return; }
        if (!o.sale) {
          if (saleBlock) { ctx.toast(saleBlock); return; }
          ctx.ask({ title: 'Ligar venda de ' + o.name + '?', ok: 'Ligar venda', brand: true,
            lines: ['Alunos poderão contratar por ' + U.money(o.price) + ' / ' + o.unit + ' pelo seu perfil.', 'Forma de aceite: ' + o.accept + '.', 'Demonstração: nada é cobrado.'],
            onOk: function () { o.sale = true; ofm(o.id).shown = true; ctx.toast('Venda ligada · ' + o.name + '.'); } });
        } else {
          ctx.ask({ title: 'Desligar venda de ' + o.name + '?', ok: 'Desligar venda', danger: true,
            lines: ['Quem já contratou continua com o acesso e o preço atual.', 'Novas contratações ficam bloqueadas até você ligar de novo.'],
            onOk: function () { o.sale = false; ctx.toast('Venda desligada · ' + o.name + '. Contratos ativos continuam.'); } });
        }
      };
      var explain = function (title, lines) { return function () { ctx.ask({ title: title, lines: lines, ok: 'Entendi', cancel: false }); }; };

      var al = [];
      if (scn === 'salvo') al.push(T4.alert('ok', 'Salvo', 'v' + (o ? o.version : 1) + ' salva em ' + meta.savedAt + '. Ainda não divulgado: ligue “Mostrar no perfil” quando quiser.'));
      if (scn === 'vendaoff') al.push(T4.alert('warn', 'Venda desligada', 'Habilite recebimentos primeiro.', 'Saiba por quê', explain('Por que a venda está desligada', ['Para vender pelo 99Coach, é preciso ter recebimentos habilitados.', 'A oferta continua salva e pode aparecer no perfil sem venda.', 'Demonstração: nada é cobrado.'])));
      if (scn === 'preco') al.push(ui.cons ? T4.alert('info', 'Consultado às ' + U.now(), (o ? o.active : 0) + ' contratos mantêm ' + (o ? U.money(o.price) + ' / ' + o.unit : '') + '; a proposta enviada a Ana mantém R$ 520.')
        : T4.alert('warn', 'Preço mudou', 'Propostas antigas mantêm o valor.', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));
      if (scn === 'capacidade') al.push(ui.cons ? T4.alert('ok', 'Capacidade liberada', 'Consultado às ' + U.now() + ': recebimentos verificados. Você já pode ligar a venda.')
        : T4.alert('warn', 'Capacidade de venda pendente', 'A verificação da conta de recebimentos está em análise. Salvar funciona; ligar a venda, ainda não.', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));
      if (scn === 'cotacao') al.push(T4.alert('warn', 'Cotação alterada', 'A taxa da plataforma mudou em 26/10 (fonte: tabela de taxas 99Coach). Revise quanto você recebe antes de salvar.', 'Revisar', explain('Quanto você recebe', ['Preço: ' + U.money(price) + ' / ' + unit + '.', 'Taxa até 25/10: 10% · a partir de 26/10: 12% (tabela de taxas 99Coach, 26/10).', 'Você recebe ' + U.money(Math.round(price * 0.88)) + ' por ' + unit + ' em novas contratações.', 'Contratos ativos mantêm a taxa da contratação.'])));
      if (scn === 'politica') al.push(ui.cons ? T4.alert('ok', 'Política carregada', 'Cancelamento: até 7 dias após a contratação, com devolução integral (política 99Coach v4, 01/10).')
        : T4.alert('risk', 'Política indisponível', 'Não carregamos a política de cancelamento. Salvar fica bloqueado até carregar; seus campos continuam aqui.', 'Tentar de novo', function () { ctx.setUi({ cons: true }); }));
      if (scn === 'falha' && !ui.fixed) al.push(T4.alert('risk', 'Falha ao salvar', 'O preço precisa ser maior que zero. Seus campos continuam preenchidos.', 'Corrigir', function () { ctx.setUi({ price: '200', priceErr: '' }); }));

      var list = DB.ofertas.map(function (x) {
        var on = !isNew && o && x.id === o.id;
        return { name: x.name, sub: U.money(x.price) + ' / ' + x.unit + ' · ' + x.fmt + ' · v' + x.version, sale: x.sale ? 'venda ligada' : 'venda desligada', saleCls: 'badge ' + (x.sale ? 'badge--ok' : 'badge--plain'),
          cls: 'lrow t4-prow' + (on ? ' is-on' : ''), cur: String(!!on), pick: function () { ctx.setUi({ sel: x.id, name: null, price: null, cycle: null, fmt: null, accept: null, incl: null, shown: null, inclOk: false, priceErr: '', nameErr: '', inclErr: '' }); } };
      });
      var linked = o && o.program ? T4.prog(o.program) : prog;
      return {
        al: al, list: list,
        isNew: isNew, title: isNew ? 'Nova oferta' : o.name,
        state: isNew ? 'Rascunho · ainda não salvo' : ('Salvo v' + o.version + ' · ' + (meta.shown ? 'divulgado' : 'não divulgado') + ' · venda ' + (o.sale ? 'ligada' : 'desligada')),
        newOffer: function () { ctx.setUi({ sel: 'novo', name: null, price: null, cycle: null, fmt: null, accept: null, incl: null, shown: null, inclOk: false, priceErr: '', nameErr: '', inclErr: '' }); },
        f: f, priceLabel: U.money(price) + ' / ' + unit,
        setName: function (e) { ctx.setUi({ name: U.val(e), nameErr: '' }); },
        setPrice: function (e) { ctx.setUi({ price: U.val(e), priceErr: '' }); },
        setIncl: function (e) { ctx.setUi({ incl: U.val(e), inclOk: false }); },
        nameErr: ui.nameErr || '', hasNameErr: !!ui.nameErr,
        priceErr: priceErr, hasPriceErr: !!priceErr, priceCls: 'input t4-money' + (priceErr ? ' is-err' : ''),
        inclErr: ui.inclErr || '', hasInclErr: !!ui.inclErr,
        cycles: T4.opts(CYCLES, f.cycle, function (k) { ctx.setUi({ cycle: k }); }, 'seg__it'),
        cycleHelp: f.cycle === 'mensal' ? 'Cobrança a cada mês até o aluno cancelar.' : (f.cycle === 'sessao' ? 'Por sessão: cada sessão é contratada à parte.' : 'Cobrança única: paga uma vez.'),
        fmts: T4.opts([['online', 'Online'], ['presencial', 'Presencial']], f.fmt, function (k) { ctx.setUi({ fmt: k }); }),
        accepts: T4.opts([['direta', 'Compra direta'], ['aceite do treinador', 'Aceite do treinador']], f.accept, function (k) { ctx.setUi({ accept: k }); }),
        acceptHelp: f.accept === 'direta' ? 'O aluno contrata e já começa.' : 'O aluno pede; você aceita antes da cobrança.',
        inclChanged: inclChanged, inclCls: 'check' + (ui.inclOk ? ' is-on' : ''), inclOn: String(!!ui.inclOk),
        toggleIncl: function () { ctx.setUi({ inclOk: !ui.inclOk, inclErr: '' }); },
        showCls: 'switch onb-switch' + (f.shown ? ' is-on' : ''), showOn: String(!!f.shown), toggleShow: function () { ctx.setUi({ shown: !f.shown }); },
        save: save,
        preview: function () { ctx.ask({ title: 'Como aparece no perfil', lines: [f.name || 'Sem nome', U.money(price) + ' / ' + unit + ' · ' + f.fmt, 'Inclui: ' + (f.incl || 'não informado'), f.accept === 'direta' ? 'Contratar agora' : 'Pedir acompanhamento', 'Prévia: nada é publicado.'], ok: 'Fechar', cancel: false }); },
        // estados
        hasO: !isNew, savedTxt: isNew ? 'não' : 'sim · v' + o.version + ' · ' + meta.savedAt, shownTxt: f.shown ? 'sim' : 'não',
        saleTxt: !isNew && o.sale ? 'ligada' : 'desligada', activeTxt: !isNew ? o.active + ' (fonte 99Coach, 26/10 08:00)' : '0',
        saleOn: !isNew && o.sale, saleOff: isNew || !o.sale, toggleSale: toggleSale,
        saleNote: saleBlock || 'Ligar a venda é separado de salvar e de mostrar no perfil.',
        // destinos
        goCupons: function () { GO('TRE30'); },
        goProposta: function () { GO('TRE31', { id: 'ana' }); },
        hasProg: !!linked, progName: linked ? linked.name : '', goProg: function () { if (linked) GO('H07', { id: linked.id }); }
      };
    }
  });

  /* ---------------- TRE30 · cupons ---------------- */
  var CST = { ativo: ['Ativo', 'badge badge--ok'], expirado: ['Expirado', 'badge badge--plain'], arquivado: ['Arquivado', 'badge badge--plain'], esgotado: ['Esgotado', 'badge badge--warn'], confirmando: ['Confirmando', 'badge badge--warn'] };
  var isPast = function (s) { var m = /^(\d{1,2})\/(\d{1,2})$/.exec(String(s || '').trim()); if (!m) return null; var d = +m[1], mo = +m[2]; if (d < 1 || d > 31 || mo < 1 || mo > 12) return null; return mo < 10 || (mo === 10 && d < 26); };
  REG.screen({
    page: 'treinador', key: 'cupons', id: 'TRE30', title: 'Cupons', mtitle: 'Cupom', nav: 'ofertas', back: 'TRE29',
    normal: 'Lista',
    scens: [['ativo', 'Ativo'], ['expirado', 'Expirado'], ['existe', 'Código já existe'], ['validade', 'Validade expirada'], ['desconhecida', 'Confirmação desconhecida']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var rows = DB.cupons.map(function (c) { return Object.assign({}, c); });
      var unknown = scn === 'desconhecida' && !ui.cons;
      if (scn === 'desconhecida') rows.unshift({ id: 'kv', code: 'NATAL26', off: '15%', offer: 'o1', uses: 0, limit: 20, until: '31/12', status: unknown ? 'confirmando' : 'ativo', virtual: true });
      var formOn = ui.form != null ? !!ui.form : (scn === 'existe' || scn === 'validade');
      var f = {
        code: ui.code != null ? ui.code : (scn === 'existe' ? 'VOLTA10' : ''),
        kind: ui.kind || 'pct', val: ui.val != null ? ui.val : (scn === 'existe' || scn === 'validade' ? '10' : ''),
        offer: ui.offer || 'o1', dur: ui.dur || 'c3',
        until: ui.until != null ? ui.until : (scn === 'validade' ? '15/10' : (scn === 'existe' ? '30/11' : '')),
        limit: ui.limit != null ? ui.limit : '20', oneUse: ui.oneUse != null ? !!ui.oneUse : true
      };
      var offer = DB.find('ofertas', f.offer) || DB.ofertas[0];
      var recurring = offer && offer.kind === 'recorrente';
      var DUR = { c1: 'só no 1º ciclo', c3: 'nos 3 primeiros ciclos', cont: 'em todos os ciclos' };
      var durTxt = recurring ? DUR[f.dur] : 'cobrança única';
      var offTxt = f.kind === 'pct' ? (f.val || '0') + '%' : U.money(Number(String(f.val).replace(',', '.')) || 0);
      var exists = function (code) { return DB.cupons.some(function (c) { return c.code.toUpperCase() === code.toUpperCase(); }); };
      var errs = ui.errs || {};
      if (scn === 'existe' && ui.errs == null) errs = { code: 'Código já existe.' };
      if (scn === 'validade' && ui.errs == null) errs = { until: 'Essa data já passou. Use uma data a partir de 26/10.' };
      var sugg = (String(f.code || 'CUPOM').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CUPOM') + '26';

      var validate = function () {
        var e = {}, code = String(f.code || '').trim().toUpperCase(), v = Number(String(f.val).replace(',', '.'));
        if (!/^[A-Z0-9]{4,12}$/.test(code)) e.code = 'Use de 4 a 12 letras ou números, sem espaço.';
        else if (exists(code)) e.code = 'Código já existe.';
        if (!(v > 0) || (f.kind === 'pct' && v > 90)) e.val = f.kind === 'pct' ? 'Desconto entre 1% e 90%.' : 'Informe um valor maior que zero.';
        var past = isPast(f.until);
        if (past === null) e.until = 'Use o formato dd/mm, ex.: 30/11.';
        else if (past) e.until = 'Essa data já passou. Use uma data a partir de 26/10.';
        if (!(Number(f.limit) > 0)) e.limit = 'Limite precisa ser maior que zero.';
        return e;
      };
      var review = function () { var e = validate(); if (Object.keys(e).length) { ctx.setUi({ errs: e, review: false }); return; } ctx.setUi({ errs: {}, review: true }); };
      var activate = function () {
        var code = String(f.code).trim().toUpperCase();
        if (exists(code)) { ctx.setUi({ review: false, errs: { code: 'Código já existe.' } }); return; }
        var id = DB.uid('k');
        DB.cupons.push({ id: id, code: code, off: offTxt, offer: offer.id, uses: 0, limit: Number(f.limit), until: f.until.trim(), status: 'ativo' });
        DB.t4_cupmeta[id] = { cycles: durTxt, created: U.todayShort, last: '', oneUse: !!f.oneUse };
        ctx.setUi({ form: false, review: false, code: null, val: null, until: null, errs: {}, sel: id });
        ctx.toast('Cupom ' + code + ' ativo (simulação). Demonstração: nada é cobrado.');
      };

      var selId = ui.sel != null ? ui.sel : ({ ativo: 'k1', expirado: 'k2', desconhecida: 'kv' }[scn] || '');
      var list = rows.map(function (c) {
        var o = DB.find('ofertas', c.offer), st = CST[c.status] || [c.status, 'badge badge--plain'], cm = DB.t4_cupmeta[c.id] || { cycles: '3 primeiros ciclos' };
        return { code: c.code, off: c.off + ' · ' + cm.cycles, offer: o ? o.name : 'oferta removida', until: 'até ' + c.until, uses: c.uses + ' de ' + c.limit, st: st[0], stCls: st[1],
          cls: 't4-ptr t4-ctr' + (c.id === selId ? ' is-on' : ''), on: String(c.id === selId), open: function () { ctx.setUi({ sel: c.id === selId ? '' : c.id }); } };
      });
      var cur = rows.find(function (c) { return c.id === selId; });
      var det = { has: false };
      if (cur) {
        var co = DB.find('ofertas', cur.offer), cm = DB.t4_cupmeta[cur.id] || { cycles: '3 primeiros ciclos', created: '26/10', last: '', oneUse: true };
        var real = DB.find('cupons', cur.id);
        det = {
          has: true, code: cur.code,
          kv: [{ k: 'Desconto', v: cur.off + ' · ' + cm.cycles }, { k: 'Produto', v: co ? co.name + ' · ' + U.money(co.price) + ' / ' + co.unit : '—' }, { k: 'Financiado por', v: 'Rafael Lima (treinador)' }, { k: 'Validade', v: 'até ' + cur.until + ' · Brasília (UTC−3)' },
            { k: 'Usos', v: cur.uses + ' de ' + cur.limit + (cm.oneUse ? ' · uma vez por aluno' : '') }, { k: 'Depois do desconto', v: 'Renovação sem desconto' }, { k: 'Histórico', v: 'criado ' + cm.created + (cm.last ? ' · último uso ' + cm.last : ' · sem uso') }],
          canArchive: !!real && cur.status !== 'arquivado', isExpired: cur.status === 'expirado',
          archive: function () {
            ctx.ask({ title: 'Arquivar ' + cur.code + '?', ok: 'Arquivar cupom', lines: ['O código para de valer em novas compras.', 'Compras concluídas mantêm o desconto aplicado.', 'O histórico de uso continua disponível.'],
              onOk: function () { if (real) real.status = 'arquivado'; ctx.toast(cur.code + ' arquivado. Compras concluídas não mudam.'); } });
          },
          renew: function () { ctx.setUi({ form: true, review: false, code: cur.code + '2', val: String(parseInt(cur.off, 10) || 10), kind: /%/.test(cur.off) ? 'pct' : 'brl', offer: cur.offer, until: '31/12', errs: {} }); },
          usage: function () { ctx.toast('Usos consultados às ' + U.now() + ': ' + cur.uses + ' de ' + cur.limit + ' (fonte 99Coach).'); }
        };
      }

      var al = [];
      if (scn === 'ativo') al.push(T4.alert('ok', 'Ativo', 'VOLTA10 · 4 de 20 usos · válido até 30/11 (Brasília).'));
      if (scn === 'expirado') al.push(ui.cons ? T4.alert('info', 'Consultado às ' + U.now(), 'ZERO20 continua expirado desde 30/09. Arquive ou renove com novo código.')
        : T4.alert('warn', 'Expirado', 'ZERO20 venceu em 30/09. Arquive ou renove com um novo código.', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));
      if (scn === 'existe' && errs.code) al.push(T4.alert('warn', 'Código já existe', 'VOLTA10 já está em uso. Sugestão: ' + sugg + '.', 'Tentar de novo', function () { ctx.setUi({ code: sugg, errs: {} }); }));
      if (scn === 'validade' && errs.until) al.push(T4.alert('warn', 'Validade expirada', 'A data de validade já passou.', 'Corrigir', function () { ctx.setUi({ until: '30/11', errs: {} }); }));
      if (scn === 'desconhecida') al.push(ui.cons ? T4.alert('ok', 'Consultado às ' + U.now(), 'NATAL26 está ativo uma única vez. Nenhum cupom duplicado.')
        : T4.alert('warn', 'Confirmação desconhecida', 'A ativação de NATAL26 foi enviada às 08:05 sem resposta. Não ative de novo: isso criaria um cupom duplicado.', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));

      var fe = function (k) { return errs[k] || ''; };
      return {
        al: al, list: list, hasList: list.length > 0, det: det,
        formOn: formOn, formOff: !formOn, inReview: formOn && !!ui.review, inEdit: formOn && !ui.review,
        openForm: function () { ctx.setUi({ form: true, review: false, errs: {} }); }, closeForm: function () { ctx.setUi({ form: false, review: false, errs: {} }); },
        f: f,
        setCode: function (e) { ctx.setUi({ code: String(U.val(e)).toUpperCase(), errs: Object.assign({}, errs, { code: '' }) }); },
        setVal: function (e) { ctx.setUi({ val: U.val(e), errs: Object.assign({}, errs, { val: '' }) }); },
        setUntil: function (e) { ctx.setUi({ until: U.val(e), errs: Object.assign({}, errs, { until: '' }) }); },
        setLimit: function (e) { ctx.setUi({ limit: U.val(e), errs: Object.assign({}, errs, { limit: '' }) }); },
        kinds: T4.opts([['pct', 'Percentual'], ['brl', 'Valor em R$']], f.kind, function (k) { ctx.setUi({ kind: k }); }, 'seg__it'),
        offers: T4.opts(DB.ofertas.map(function (o) { return [o.id, o.name]; }), offer.id, function (k) { ctx.setUi({ offer: k }); }),
        recurring: recurring, durs: T4.opts([['c1', 'Só o 1º ciclo'], ['c3', '3 primeiros ciclos'], ['cont', 'Contínuo']], f.dur, function (k) { ctx.setUi({ dur: k }); }),
        oneCls: 'check' + (f.oneUse ? ' is-on' : ''), oneOn: String(!!f.oneUse), toggleOne: function () { ctx.setUi({ oneUse: !f.oneUse }); },
        eCode: fe('code'), hasECode: !!fe('code'), codeCls: 'input' + (fe('code') ? ' is-err' : ''),
        eVal: fe('val'), hasEVal: !!fe('val'), valCls: 'input' + (fe('val') ? ' is-err' : ''),
        eUntil: fe('until'), hasEUntil: !!fe('until'), untilCls: 'input' + (fe('until') ? ' is-err' : ''),
        eLimit: fe('limit'), hasELimit: !!fe('limit'), limitCls: 'input' + (fe('limit') ? ' is-err' : ''),
        showSugg: fe('code') === 'Código já existe.', sugg: 'Usar ' + sugg, useSugg: function () { ctx.setUi({ code: sugg, errs: Object.assign({}, errs, { code: '' }) }); },
        review: review, back: function () { ctx.setUi({ review: false }); }, activate: activate,
        sum: [{ k: 'Código', v: String(f.code || '').toUpperCase() }, { k: 'Desconto', v: offTxt + ' · ' + durTxt }, { k: 'Produto', v: offer.name + ' · ' + U.money(offer.price) + ' / ' + offer.unit },
          { k: 'Moeda', v: 'Real (R$)' }, { k: 'Financiado por', v: 'Rafael Lima (treinador)' }, { k: 'Validade', v: 'até ' + f.until + ' · Brasília (UTC−3)' }, { k: 'Limite', v: f.limit + ' usos' + (f.oneUse ? ' · uma vez por aluno' : '') }, { k: 'Depois do desconto', v: 'Renovação sem desconto' }],
        goOffer: function () { GO('TRE29', { id: offer.id }); }
      };
    }
  });

  /* ---------------- TRE31 · proposta individual e entrega externa ---------------- */
  var CHANNELS = [['app', 'Mensagem no 99Coach'], ['link', 'Link para copiar'], ['whats', 'WhatsApp (você envia)']];
  REG.screen({
    page: 'treinador', key: 'proposta', id: 'TRE31', title: 'Proposta individual', mtitle: 'Proposta', nav: 'ofertas', back: 'TRE29',
    testIds: ['ana', 'bruno'],
    normal: 'Rascunho e envio',
    scens: [['enviada', 'Enviada'], ['expirada', 'Expirada'], ['externa', 'Entrega externa'], ['vencida', 'Vencida'], ['conta', 'Conta errada'], ['pagamento', 'Pagamento pendente'], ['desconhecida', 'Confirmação desconhecida']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var stuId = ui.stu || (DB.find('alunos', ctx.id) ? ctx.id : 'ana');
      var stu = DB.find('alunos', stuId);
      var pr = DB.t4_propostas.find(function (x) { return x.student === stuId; }) || null;
      var draft = !pr;
      var cur = pr || { id: '', student: stuId, title: 'Acompanhamento online', base: 'o1', price: 200, unit: 'mês', valid: '02/11', version: 1, channel: 'Mensagem no 99Coach', status: 'rascunho', sentAt: '', history: [], deliveries: [], unitsTotal: 0 };
      var vValid = scn === 'expirada' && !ui.edit ? '25/10' : cur.valid;
      var editOn = !!ui.edit || (scn === 'vencida' && ui.edit == null);
      var f = { title: ui.title != null ? ui.title : cur.title, price: ui.price != null ? ui.price : String(cur.price), valid: ui.valid != null ? ui.valid : (scn === 'vencida' ? '20/10' : (scn === 'expirada' ? '07/11' : cur.valid)) };
      var errs = ui.errs || (scn === 'vencida' && ui.errs == null ? { valid: 'Essa validade já passou (20/10). Use uma data a partir de 27/10.' } : {});
      var channel = ui.ch || 'app';
      var chLabel = (CHANNELS.find(function (c) { return c[0] === channel; }) || CHANNELS[0])[1];
      var reviewOn = !!ui.review || (scn === 'conta' && ui.review == null);
      var wrongAcc = scn === 'conta' && !ui.stuOk;
      var unknown = scn === 'desconhecida' && !ui.cons;

      var saveVersion = function () {
        var e = {}, price = Number(String(f.price).replace(',', '.'));
        if (String(f.title || '').trim().length < 3) e.title = 'Descreva a oferta.';
        if (!(price > 0)) e.price = 'Informe um valor maior que zero.';
        var m = /^(\d{1,2})\/(\d{1,2})$/.exec(String(f.valid || '').trim());
        if (!m) e.valid = 'Use o formato dd/mm.'; else if (+m[2] < 10 || (+m[2] === 10 && +m[1] <= 26)) e.valid = 'Essa validade já passou. Use uma data a partir de 27/10.';
        if (Object.keys(e).length) { ctx.setUi({ errs: e }); return; }
        if (!pr) { pr = { id: DB.uid('pr'), student: stuId, title: '', base: 'o1', price: 0, unit: 'único', valid: '', version: 0, channel: '', status: 'rascunho', sentAt: '', history: [], deliveries: [], unitsTotal: 0 }; DB.t4_propostas.push(pr); }
        var sent = pr.history.length > 0;
        pr.title = String(f.title).trim(); pr.price = price; pr.unit = 'único'; pr.valid = String(f.valid).trim();
        pr.version = sent ? pr.history[pr.history.length - 1].v + 1 : Math.max(1, pr.version); pr.status = 'rascunho';
        ctx.setUi({ edit: false, errs: {}, title: null, price: null, valid: null });
        ctx.toast('Proposta v' + pr.version + ' salva como rascunho.' + (sent ? ' A v' + pr.history[pr.history.length - 1].v + ' enviada continua registrada.' : ''));
      };
      var send = function () {
        if (unknown) { ctx.toast('Consulte o envio anterior antes de enviar de novo.'); return; }
        if (wrongAcc) { ctx.toast('Confirme o destinatário antes de enviar.'); return; }
        if (!pr) { ctx.setUi({ edit: true }); ctx.toast('Salve a proposta antes de enviar.'); return; }
        if (pr.status === 'enviada' && pr.history.some(function (h) { return h.v === pr.version; })) { ctx.toast('Esta versão já foi enviada em ' + pr.sentAt + '.'); return; }
        pr.history.push({ v: pr.version, at: T4.stamp(), price: pr.price, valid: pr.valid, channel: chLabel });
        pr.status = 'enviada'; pr.sentAt = T4.stamp(); pr.channel = chLabel;
        ctx.setUi({ review: false });
        ctx.toast(channel === 'app' ? 'v' + pr.version + ' enviada a ' + stu.first + ' pelo 99Coach. Demonstração: nada é cobrado.' : 'Link da v' + pr.version + ' copiado para você enviar' + (channel === 'whats' ? ' pelo WhatsApp' : '') + '. O 99Coach não envia mensagem fora do app.');
      };
      // entrega externa
      var d = { date: ui.dDate != null ? ui.dDate : U.todayShort, what: ui.dWhat != null ? ui.dWhat : 'Sessão presencial no Centro', ev: ui.dEv != null ? ui.dEv : '' };
      var used = cur.deliveries.reduce(function (n, x) { return n + (x.status === 'contestada' ? 0 : x.units); }, 0);
      var addDelivery = function () {
        if (!pr || !pr.unitsTotal) { ctx.toast('Esta proposta não tem unidades presenciais para declarar.'); return; }
        if (used >= pr.unitsTotal) { ctx.setUi({ dErr: 'Todas as ' + pr.unitsTotal + ' unidades já foram declaradas.' }); return; }
        if (String(d.ev || '').trim().length < 3) { ctx.setUi({ dErr: 'Descreva a evidência (ex.: foto do caderno, lista de presença).' }); return; }
        pr.deliveries.push({ id: DB.uid('e'), date: String(d.date).trim(), units: 1, what: String(d.what).trim(), evidence: String(d.ev).trim(), status: 'declarada' });
        ctx.setUi({ dOn: false, dErr: '', dEv: null, dWhat: null, dDate: null });
        ctx.toast('Entrega declarada. Recebimento ainda não confirmado; ' + stu.first + ' pode contestar em até 7 dias.');
      };

      var al = [];
      var explain = function (title, lines) { return function () { ctx.ask({ title: title, lines: lines, ok: 'Entendi', cancel: false }); }; };
      if (scn === 'enviada') al.push(T4.alert('info', 'Enviada', 'Aguardando aceite de ' + stu.first + ' desde ' + (cur.sentAt || '24/10 18:30') + '.'));
      if (scn === 'expirada' && !ui.edit) al.push(T4.alert('warn', 'Expirada', 'A v' + cur.version + ' venceu em 25/10 sem aceite. Reemita com nova versão; a anterior fica no histórico.', 'Reemitir como nova versão', function () { ctx.setUi({ edit: true, valid: '07/11' }); }));
      if (scn === 'externa') al.push(T4.alert('info', 'Entrega externa', 'Declarada por você, com evidência. Recebimento ainda não confirmado.', 'Saiba por quê', explain('Entrega declarada', ['Você declarou a entrega fora do app, com evidência.', 'Isso não confirma recebimento nem gera cobrança.', stu.first + ' pode contestar em até 7 dias; contestada, a unidade volta.', 'Não substitui sessão registrada na agenda.'])));
      if (scn === 'vencida' && errs.valid) al.push(T4.alert('risk', 'Vencida', 'A validade informada já passou. Corrija a data para salvar.', 'Corrigir', function () { ctx.setUi({ edit: true, valid: '07/11', errs: {} }); }));
      if (wrongAcc) al.push(T4.alert('risk', 'Conta errada', 'O link foi aberto por uma conta que não é a de ' + stu.name + '. Ninguém foi cobrado. Revise o destinatário antes de reenviar.', 'Revisar', function () { ctx.setUi({ review: true }); }));
      if (scn === 'pagamento') al.push(ui.cons ? T4.alert('info', 'Consultado às ' + U.now(), 'Pagamento ainda pendente. Aceite não marca pagamento. Demonstração: nada é cobrado.')
        : T4.alert('warn', 'Pagamento pendente', stu.first + ' aceitou em 25/10 às 20:14. O pagamento ainda não foi confirmado.', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));
      if (scn === 'desconhecida') al.push(ui.cons ? T4.alert('ok', 'Consultado às ' + U.now(), 'A v' + cur.version + ' foi entregue a ' + stu.first + ' às 18:31. Não precisa reenviar.')
        : T4.alert('warn', 'Confirmação desconhecida', 'O envio da v' + cur.version + ' às 18:30 não confirmou. Não reenvie: consulte primeiro.', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));

      // linha do tempo
      var accepted = scn === 'pagamento';
      var sentAt = cur.sentAt || '';
      var tl = [];
      tl.push({ t: 'Criada', s: 'v1 · rascunho', ic: 'ic ic--xs i-edit', dot: 'tl__dot is-ink' });
      cur.history.forEach(function (h) { tl.push({ t: 'Enviada · v' + h.v, s: h.at + ' · ' + h.channel + ' · ' + U.money(h.price) + ' · válida até ' + h.valid, ic: 'ic ic--xs i-send', dot: 'tl__dot is-ink' }); });
      if (cur.history.length) {
        if (scn === 'expirada') tl.push({ t: 'Expirada', s: 'sem aceite até 25/10', ic: 'ic ic--xs i-clock', dot: 'tl__dot' });
        else if (accepted) { tl.push({ t: 'Aceita', s: '25/10 20:14', ic: 'ic ic--xs i-check', dot: 'tl__dot is-ink' }); tl.push({ t: 'Pagamento pendente', s: 'aceite não marca pagamento', ic: 'ic ic--xs i-clock', dot: 'tl__dot' }); }
        else tl.push({ t: 'Aguardando aceite', s: unknown ? 'envio sem confirmação' : 'desde ' + sentAt, ic: 'ic ic--xs i-clock', dot: 'tl__dot' });
      }
      if (pr && pr.status === 'rascunho' && pr.history.length) tl.push({ t: 'Nova versão · v' + pr.version, s: 'rascunho · ainda não enviada', ic: 'ic ic--xs i-edit', dot: 'tl__dot' });
      var sLabel = draft ? 'Rascunho' : (scn === 'expirada' ? 'Expirada' : accepted ? 'Pagamento pendente' : (pr.status === 'enviada' ? 'Aguardando aceite' : 'Rascunho v' + pr.version));
      var sCls = 'badge ' + (scn === 'expirada' ? 'badge--plain' : accepted ? 'badge--warn' : (!draft && pr.status === 'enviada' ? 'badge--info' : 'badge--plain'));

      var alunos = DB.alunos.filter(function (a) { return a.status === 'ativo'; });
      return {
        al: al,
        sub: stu.name + ' · v' + cur.version, sLabel: sLabel, sCls: sCls,
        kv: [{ k: 'Aluno', v: stu.name }, { k: 'Oferta', v: cur.title }, { k: 'Valor', v: U.money(cur.price) + ' · ' + (cur.unit === 'único' ? 'cobrança única' : cur.unit) }, { k: 'Válida até', v: vValid }, { k: 'Versão', v: 'v' + cur.version + (cur.history.length ? ' · ' + U.plural(cur.history.length, 'envio', 'envios') : ' · não enviada') }],
        isDraft: draft,
        editOn: editOn, editOff: !editOn,
        openEdit: function () { ctx.setUi({ edit: true, review: false }); }, closeEdit: function () { ctx.setUi({ edit: false, errs: {} }); },
        f: f,
        setTitle: function (e) { ctx.setUi({ title: U.val(e) }); }, setPrice: function (e) { ctx.setUi({ price: U.val(e) }); }, setValid: function (e) { ctx.setUi({ valid: U.val(e), errs: Object.assign({}, errs, { valid: '' }) }); },
        eTitle: errs.title || '', hasETitle: !!errs.title, eP: errs.price || '', hasEP: !!errs.price, eValid: errs.valid || '', hasEValid: !!errs.valid,
        validCls: 'input' + (errs.valid ? ' is-err' : ''), priceCls: 'input t4-money' + (errs.price ? ' is-err' : ''),
        saveLabel: pr && pr.history.length ? 'Salvar como v' + (pr.history[pr.history.length - 1].v + 1) : 'Salvar proposta',
        saveVersion: saveVersion,
        copy: function () { ctx.toast(pr ? 'Link da v' + pr.version + ' copiado (demonstração).' : 'Salve a proposta para gerar o link.'); },
        reviewOn: reviewOn, reviewOff: !reviewOn,
        openReview: function () { ctx.setUi({ review: true, edit: false }); }, closeReview: function () { ctx.setUi({ review: false }); },
        wrongAcc: wrongAcc, rightAcc: !wrongAcc,
        recip: alunos.map(function (a) { var on = a.id === stuId; return { label: a.name, on: String(on), cls: 'chip t4-chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ stu: a.id, stuOk: true }); } }; }),
        confirmRecip: function () { ctx.setUi({ stuOk: true }); },
        recipTxt: stu.name + ' · conta 99Coach · aluna desde ' + (stu.since || '—'),
        channels: T4.opts(CHANNELS, channel, function (k) { ctx.setUi({ ch: k }); }),
        rv: [{ k: 'Destinatário', v: stu.name }, { k: 'Versão', v: 'v' + cur.version }, { k: 'Canal', v: chLabel }, { k: 'Valor', v: U.money(cur.price) + ' · cobrança única' }, { k: 'Válida até', v: vValid }],
        sendLabel: 'Enviar esta versão', send: send,
        tl: tl,
        // entrega externa
        hasUnits: !!cur.unitsTotal, unitsTxt: used + ' de ' + cur.unitsTotal + ' sessões presenciais declaradas · origem: esta proposta (v1)',
        deliveries: cur.deliveries.map(function (x) { return { t: x.date + ' · ' + x.what, s: 'Evidência: ' + x.evidence, st: x.status === 'declarada' ? 'Entrega declarada' : x.status, stCls: 'badge ' + (x.status === 'declarada' ? 'badge--info' : 'badge--plain') }; }),
        hasDel: cur.deliveries.length > 0,
        dOn: !!ui.dOn, dOff: !ui.dOn, openD: function () { ctx.setUi({ dOn: true, dErr: '' }); }, closeD: function () { ctx.setUi({ dOn: false, dErr: '' }); },
        d: d, setDDate: function (e) { ctx.setUi({ dDate: U.val(e) }); }, setDWhat: function (e) { ctx.setUi({ dWhat: U.val(e) }); }, setDEv: function (e) { ctx.setUi({ dEv: U.val(e), dErr: '' }); },
        dErr: ui.dErr || '', hasDErr: !!ui.dErr, addDelivery: addDelivery,
        goStu: function () { GO('TRE03', { id: stuId }); }, goOffer: function () { GO('TRE29', { id: cur.base || 'o1' }); }, goAgenda: function () { GO('TRE20'); }
      };
    }
  });
})();
