/* Conta do treinador no celular (Hubs-indice): agenda, programas, ofertas, recebimentos, insights, assinatura e troca de papel */
REG.screen({
  page: 'treinador', key: 'menu', id: 'TMENU', title: 'Conta', nav: 'conta',
  vals: function (ctx) {
    var t = DB.trainer;
    var row = function (title, sub, ic, to, params) { return { title: title, sub: sub, ic: 'ic ic--sm i-' + ic, go: function () { GO(to, params || {}); } }; };
    return {
      name: t.name, ini: U.ini(t.name), role: 'Treinador · ' + t.city, photo: window.ACCT && window.ACCT.area() && !document.documentElement.classList.contains('demo') ? '' : U.img('bdc7ef1c8dbf05558c3bf8d575fc3a04'),
      groups: (window.ACCT && window.ACCT.area() && !document.documentElement.classList.contains('demo')) ? [
        // produto: só o que existe de verdade
        { title: 'Trabalho', items: [row('Agenda', 'Horários marcados e disponibilidade', 'calendar', 'TRE20'), row('Convites', 'Aguardando, aceitos, vencidos e revogados', 'user-plus', 'REL02'), row('Pedidos', 'Pedidos de acompanhamento', 'clipboard', 'REL06'), row('Insights', 'Indicadores do servidor e vagas', 'chart', 'H08')] },
        { title: 'Conteúdo', items: [row('Rotinas e exercícios', 'Biblioteca salva na sua conta', 'dumbbell', 'H06')] },
        { title: 'Perfil público', items: [row('Cadastro e publicação', 'Dados do perfil, publicar e retirar', 'edit', '@onboarding', { flow: 'treinador' }),
          { title: 'Ver meu perfil publicado', sub: 'Como alunos veem você', ic: 'ic ic--sm i-eye', go: function () {
            window.CONTA.db('GET', 'trainers?select=slug,status&user_id=eq.' + encodeURIComponent((window.CONTA.user() || {}).id || '')).then(function (r) {
              var x = r.ok && r.data && r.data[0];
              if (x && x.status === 'publicado') location.href = '/treinador/' + encodeURIComponent(x.slug);
              else if (window.NOTICE) window.NOTICE(r.ok ? 'Seu perfil ainda não está publicado. Publique pelo cadastro.' : 'Não foi possível consultar agora. Tente de novo.');
            });
          } },
          row('Credenciais', 'CREF e conferência pela equipe', 'shield', 'ACC10')] },
        { title: 'Conta', items: [row('Meus dados e segurança', 'Baixar cópia · sair dos outros aparelhos · excluir conta', 'file', 'ACC13R'), row('Sair da conta', 'Encerra a sessão neste aparelho', 'logout', '@sair')] }
      ] : [
        { title: 'Trabalho', items: [row('Agenda', 'Compromissos e disponibilidade', 'calendar', 'TRE20'), row('Notificações e tarefas', 'O que precisa de você', 'bell', 'TRE26')] },
        { title: 'Conteúdo', items: [row('Exercícios', 'Catálogo e meus exercícios', 'dumbbell', 'TRE10'), row('Formulários', 'Anamnese, check-in e avaliações', 'file', 'TRE04')] },
        { title: 'Negócio', items: [row('Programas', U.plural(DB.programas.length, 'programa', 'programas'), 'book', 'H07'), row('Ofertas e cupons', 'Serviços, planos e preços', 'tag', 'TRE29'), row('Recebimentos', 'Vendas, saldo e repasses', 'card', 'H09'), row('Insights', 'Visitas, contatos e vendas', 'chart', 'H08')] },
        { title: 'Perfil público', items: [row('Editar perfil', 'Apresentação, áreas atendidas e foto', 'edit', 'ACC06'), row('Prévia e publicação', 'Como alunos veem você', 'eye', 'ACC07'), row('Credenciais', 'CREF, formação e certificados', 'shield', 'ACC10'), row('Instagram', 'Reivindicar e verificar titularidade', 'instagram', 'ACC08'), row('Organização', 'Academia ou consultoria afiliada', 'grid', 'ORG02'), row('Denúncias e bloqueios', 'Denunciar, bloquear e acompanhar', 'alert', 'ACC16')] },
        { title: 'Conta', items: [row('Meus dados', 'Baixar uma cópia · o que fica neste aparelho', 'file', 'ACC13R'), row('Assistência de IA', document.documentElement.classList.contains('demo') ? 'Uso ' + t.iaCredits.used + ' de ' + t.iaCredits.limit + ' · renova ' + t.iaCredits.resets : 'Desligada até ser configurada', 'sparkle', 'H15'), row('Perfil público', 'Como alunos veem você', 'user', '@perfil', { id: window.ACCT && window.ACCT.area() && !document.documentElement.classList.contains('demo') ? 'thiago' : 'rafael' }), row('Sair da conta', 'Encerra a sessão neste aparelho', 'logout', '@sair'), row('Conta e preferências', 'Idioma, segurança, privacidade e avisos', 'settings', '@onboarding', { flow: 'treinador', scn: 'conta' })] }
      ],
      switchRole: function () { GO('H10'); }
    };
  }
});
