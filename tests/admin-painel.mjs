// Painel da administração: visão geral, contas (busca e bloqueio com motivo), avaliações (ocultar), pagamentos e exclusões.
// Servidor simulado com o mesmo formato das funções conferidas no banco real em 13/11 (admin_overview, admin_users, ...).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const jwt = 'x.' + Buffer.from(JSON.stringify({ sub: 'adm', aal: 'aal2' })).toString('base64url') + '.y';
const srv = { calls: [], fail: false,
  users: [{ id: 'u1', nome: 'Caio Prado', email: 'caio@x.com', papeis: ['aluno'], criada: '2026-11-01T10:00:00Z', ultimo_acesso: '2026-11-12T10:00:00Z', email_confirmado: true, duas_etapas: false, bloqueada: false, excluida: false, acompanhamentos: 1, perfil: null, perfil_status: null },
    { id: 'u2', nome: 'Marina Duarte', email: 'marina@x.com', papeis: ['treinador'], criada: '2026-10-01T10:00:00Z', ultimo_acesso: '2026-11-13T10:00:00Z', email_confirmado: true, duas_etapas: true, bloqueada: false, excluida: false, acompanhamentos: 3, perfil: 'marina-d', perfil_status: 'publicado' }],
  revs: [{ id: 'rv1', nota: 1, autor: 'Caio', treinador: 'Marina Duarte', perfil: 'marina-d', texto: 'Texto ofensivo aqui.', resposta: null, status: 'publicada', em: '2026-11-10T10:00:00Z' }] };
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route('**/api/v1/**', (r) => r.abort());
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
  const body = rq.postData() ? JSON.parse(rq.postData()) : {};
  if (u.pathname === '/auth/v1/user') return j(200, { id: 'adm', factors: [{ id: 'F1', factor_type: 'totp', status: 'verified' }] });
  const p = u.pathname.replace('/rest/v1/', ''); srv.calls.push(p);
  if (p === 'rpc/is_admin') return j(200, true);
  if (p === 'rpc/admin_overview') { if (srv.fail) return j(500, { message: 'falha' }); return j(200, { contas: 12, contas_7d: 3, treinadores_publicados: 2, treinadores_rascunho: 1, perfis_importados: 40, contas_bloqueadas: srv.users.filter((x) => x.bloqueada).length, duas_etapas: 1, acompanhamentos_ativos: 4, acompanhamentos_pausados: 0, pedidos_pendentes: 2, treinos_registrados_7d: 9, mensagens_7d: 31, avaliacoes: 1, avaliacoes_ocultas: srv.revs.filter((x) => x.status === 'oculta').length, email_avisos_ligado: 1, pagamentos_pagos: 1, pago_centavos: 20000, comissao_centavos: 1000, contas_de_recebimento: 1, avisos_divergentes: 1, avisos_sem_correlacao: 0, ambiente_pagamento: 'live' }); }
  if (p === 'rpc/admin_users') { srv.q = body.p_q; const q = (body.p_q || '').toLowerCase(); return j(200, srv.users.filter((x) => !q || (x.nome + x.email).toLowerCase().includes(q))); }
  if (p === 'rpc/admin_set_block') { srv.block = body; srv.users.find((x) => x.id === body.p_user).bloqueada = body.p_blocked; return j(200, { ok: true }); }
  if (p === 'rpc/admin_reviews') return j(200, srv.revs);
  if (p === 'rpc/admin_set_review') { srv.revs.find((x) => x.id === body.p_review).status = body.p_hidden ? 'oculta' : 'publicada'; return j(200, { ok: true }); }
  if (p === 'rpc/admin_payments') return j(200, { pedidos: [{ valor: 20000, status: 'pago', item: 'Acompanhamento mensal', comprador: 'Caio', treinador: 'Marina Duarte', em: '2026-11-12T10:00:00Z', pago_em: '2026-11-12T10:02:00Z', meio: 'card', ambiente: 'live', comissao: 1000, tarifa: 838, liquido: 18162, reembolsado: 0, recebivel: 'a liberar', acesso: 'liberado' }], avisos_com_problema: [{ status: 'divergente', tipo: 'checkout.session.completed', nota: 'valor diferente do pedido', em: '2026-11-12T11:00:00Z', aviso: 'evt_1' }], contas: [{ treinador: 'Marina Duarte', ambiente: 'live', cobra: true, repassa: true, cadastro_enviado: true, atualizado: '2026-11-12T09:00:00Z' }] });
  if (p === 'rpc/admin_deletions') return j(200, [{ status: 'solicitado', nome: 'Rui', pedida: '2026-11-11T10:00:00Z', concluida: null, retencao: [{ item: 'pagamentos', prazo_dias: 1825, motivo: 'obrigação fiscal' }] }]);
  if (/^rpc\/admin_.*queue/.test(p)) return j(200, []);
  if (p === 'profiles') return j(200, [{ id: 'adm', roles: [] }]);
  return j(200, []);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const press = (re, scope) => p.evaluate(([src, sc]) => { const r = new RegExp(src); const e = [...document.querySelectorAll(sc)].find((x) => r.test(x.textContent.trim()) && x.offsetParent); if (e) e.click(); return !!e; }, [re.source, scope || '#app button']);
await p.goto('http://localhost:5173/', { waitUntil: 'load' });
await p.evaluate((tk) => localStorage.setItem('c99.sessao', JSON.stringify({ access_token: tk, refresh_token: 'r', user: { id: 'adm', email: 'adm@x.com' } })), jwt);
await p.goto('about:blank'); await p.goto('http://localhost:5173/app#publico-admin', { waitUntil: 'load' }); await p.waitForTimeout(2500);
let t = await txt();
console.log('1 visão geral com números do servidor:', /Contas 12 3 nos últimos 7 dias/.test(t), /Perfis importados 40/.test(t), /Acompanhamentos ativos 4/.test(t), /Comissão 99coach R\$ 10,00/.test(t), /modo real/.test(t));
console.log('  abas:', ['Visão geral', 'Contas', 'Avaliações', 'Pagamentos', 'Exclusões', 'Filas de pedidos'].every((x) => t.includes(x)), '| filas escondidas nesta aba:', !/Correção e retirada/.test(t));
// 2. contas
await press(/^Contas$/); await p.waitForTimeout(1200); t = await txt();
console.log('2 contas listadas:', /Caio Prado/.test(t), /caio@x\.com/.test(t), /Marina Duarte/.test(t), /Perfil marina-d \(publicado\)/.test(t), /duas etapas ligada/.test(t));
await p.fill('#pn-q', 'marina'); await p.waitForTimeout(200); await press(/^Buscar$/); await p.waitForTimeout(1200); t = await txt();
console.log('  busca vai ao servidor:', srv.q === 'marina', !/Caio Prado/.test(t), /1 conta/.test(t));
await p.fill('#pn-q', ''); await p.waitForTimeout(200); await press(/^Buscar$/); await p.waitForTimeout(1200);
await press(/^Bloquear conta$/); await p.waitForTimeout(500); t = await txt();
console.log('  bloquear sem motivo é barrado:', /Escreva o motivo/.test(t), !srv.block);
await p.fill('#pn-w-u1', 'Assédio comprovado em denúncia.'); await p.waitForTimeout(300);
await press(/^Bloquear conta$/); await p.waitForTimeout(600); await press(/^Bloquear$/, 'button'); await p.waitForTimeout(1500); t = await txt();
console.log('  bloqueio com motivo:', !!srv.block && srv.block.p_user === 'u1' && srv.block.p_blocked === true && /Assédio/.test(srv.block.p_reason), /Caio Prado · bloqueada/.test(t), /Desbloquear/.test(t));
// 3. avaliações
await press(/^Avaliações$/); await p.waitForTimeout(1200); t = await txt();
console.log('3 avaliação aparece:', /1 estrela · Caio sobre Marina Duarte/.test(t), /Texto ofensivo/.test(t));
await press(/^Ocultar$/); await p.waitForTimeout(600); await press(/^Ocultar$/, 'button'); await p.waitForTimeout(600);
await p.evaluate(() => { const all = [...document.querySelectorAll('button')].filter((x) => x.textContent.trim() === 'Ocultar' && x.offsetParent); if (all.length) all[all.length - 1].click(); }); await p.waitForTimeout(1500); t = await txt();
console.log('  ocultada:', srv.revs[0].status === 'oculta', /OCULTA/.test(t), /Mostrar de novo/.test(t));
// 4. pagamentos
await press(/^Pagamentos$/); await p.waitForTimeout(1200); t = await txt();
console.log('4 pagamentos:', /R\$ 200,00 · Pago · Acompanhamento mensal/.test(t), /Comissão R\$ 10,00/.test(t), /Acesso liberado/.test(t), /Divergente · checkout\.session\.completed/.test(t), /pode cobrar · repasse ativo/.test(t));
// 5. exclusões
await press(/^Exclusões$/); await p.waitForTimeout(1200); t = await txt();
console.log('5 exclusões:', /em prazo de arrependimento · Rui/.test(t), /Fica retido: pagamentos \(1825 dias\): obrigação fiscal/.test(t));
// 6. filas continuam
await press(/^Filas de pedidos$/); await p.waitForTimeout(1000); t = await txt();
console.log('6 filas antigas na aba própria:', /Correção e retirada/.test(t), /Conferência de CREF/.test(t));
// 7. falha do servidor não vira "zero"
srv.fail = true; await press(/^Visão geral$/); await p.waitForTimeout(600); await press(/^Atualizar$/); await p.waitForTimeout(1500); t = await txt();
console.log('7 falha é dita como falha:', /Não deu para carregar esta seção/.test(t), /Tentar de novo/.test(t));
console.log('errs', errs);
await b.close();
