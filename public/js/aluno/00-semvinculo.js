/* Aluno com conta real e ainda sem treinador: o dia a dia (Hoje, Treinos, Evolução, Mensagens) só existe depois do vínculo.
   Diretriz: pedido não é vínculo; conta criada ≠ vínculo ≠ treino. Nada de treino, evolução ou conversa inventados. */
REG.screen({
  page: 'aluno', key: 'semvinculo', id: 'ALU00', title: 'Sem acompanhamento', mtitle: 'Hoje',
  nav: function (ctx) { return ctx.props.navFrom || 'hoje'; },
  vals: function (ctx) {
    var from = ctx.props.navFrom || 'hoje';
    var T = {
      hoje: ['Ainda sem treinador', 'Seu treino do dia aparece aqui quando um treinador aceitar seu pedido de acompanhamento ou quando você aceitar o convite de um treinador.'],
      treinos: ['Nenhum treino ainda', 'Os treinos são montados pelo seu treinador depois do vínculo. Conta criada não é vínculo, e pedido enviado ainda não é treino.'],
      evolucao: ['Sua evolução começa no primeiro treino', 'Evolução vem só de treinos registrados por você, com origem e período. Sem treino registrado, não há o que mostrar.'],
      mensagens: ['Nenhuma conversa ainda', 'A conversa com o treinador abre quando o acompanhamento começa.']
    }[from] || ['Ainda sem treinador', 'Esta parte aparece depois que você tiver um treinador.'];
    var first = (window.STORE && (window.STORE.loadOnb('aluno') || {}).name || '').split(' ')[0];
    return {
      eyebrow: first ? 'Olá, ' + first : 'Sua conta',
      title: T[0], text: T[1],
      steps: [
        { n: '1', t: 'Encontre um treinador', x: 'Compare modalidade, formato, preço com unidade e credencial.' },
        { n: '2', t: 'Peça acompanhamento ou aceite um convite', x: 'O treinador aceita o pedido. Convite chega por link e é aceito uma vez, por você.' },
        { n: '3', t: 'Comece a treinar', x: 'Treino, registro e conversa ficam aqui, no app.' }
      ],
      find: function () { GO('@home'); },
      account: function () { GO('AMENU'); }
    };
  }
});
