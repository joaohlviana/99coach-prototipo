/* Amostra de treinadores reais (API pública da 99Coach, /api/v1/search).
   `npm run sync` baixa a base completa para public/data/treinadores.json, que substitui esta amostra.
   Campos: [slug, nome, iniciais, foto (relativa a FOTOS), especialidade, esportes, cidade, formatos, publicado] */
window.__REAL_FOTOS = 'https://rycaxboqkkiopjdecgld.supabase.co/storage/v1/object/public/trainer-photos/legado/';
window.__REAL = [
  ['amandinha-londrina-pr', 'Amandinha', 'AM', '9f69f500-4465-4fd5-83aa-ebf70c7c6972/55e5f0a136460124.jpg', 'Musculação e CrossFit', ['crossfit', 'musculacao'], 'Londrina, PR', 'p', '2026-07-02'],
  ['douglas-luiz-londrina-pr', 'Douglas Luiz', 'DL', '36b06709-2131-405a-a91b-a71d88742b38/abefe251e6412278.jpg', 'Musculação, CrossFit e Funcional', ['corrida', 'crossfit', 'funcional', 'musculacao'], 'Londrina, PR', 'p', '2026-07-02'],
  ['gabriel-londrina-pr', 'Gabriel Atuatti', 'GA', '49680c31-3896-4b77-ab15-23034da0e4c9/26ee0eca1a987b9d.jpg', 'CrossFit', ['crossfit'], 'Londrina, PR', 'p', '2026-07-02'],
  ['leo-bitan-londrina-pr', 'Leo Bitan', 'LB', '19ff86b7-eb78-48f3-a9f0-6b093c7cc343/504d933d10190f6d.jpg', 'CrossFit, Funcional e Corrida', ['corrida', 'crossfit', 'funcional', 'musculacao'], 'Londrina, PR', 'p', '2026-07-05'],
  ['marcelo-vitor-da-costa-londrina-pr', 'Marcelo Vitor da Costa', 'MC', 'ba8442c3-4b57-4f48-99d9-b813c4e79277/5d13022616b6e71b.jpg', 'CrossFit, Ginástica e Funcional', ['crossfit', 'funcional', 'ginastica'], 'Londrina, PR', 'p', '2026-07-08'],
  ['paulo-ricardo-dancer-londrina-pr', 'Paulo Ricardo Dancer', 'PD', '86cb998e-429a-4b4e-b06a-3daa3c2e8301/360e342a734c91cb.jpg', 'CrossFit e Dança', ['crossfit', 'danca'], 'Londrina, PR', 'p', '2026-07-06'],
  ['rafael-calhelha-londrina-pr', 'Rafael Calhelha', 'RC', '988ee96b-2046-4f45-99e3-90694ea60af4/4abd8f34a4b6242b.jpg', 'CrossFit e Funcional', ['crossfit', 'funcional'], 'Londrina, PR', 'p', '2026-07-06'],
  ['rafael-pedro-londrina-pr-c68f46', 'Rafael Pedro', 'RP', 'c68f46e9-bc77-495b-9651-ad6be97b8bd4/1616bde8344619d5.jpg', 'CrossFit e Funcional', ['crossfit', 'funcional'], 'Londrina, PR', 'p', '2026-07-02'],
  ['thiago-pereira-londrina-pr', 'Thiago Pereira', 'TP', '457ce5ee-5184-40a5-aea0-af970eb0e287/0436b8f84991e1b0.webp', 'CrossFit, Funcional e LPO', ['condicionamento', 'crossfit', 'funcional', 'lpo'], 'Londrina, PR', 'po', '2026-07-03'],
  ['weslley-silva-londrina-pr', 'Weslley Silva', 'WS', '187330bc-f9d2-4235-afca-c9a3376aaf15/6d06f14ca1e076c4.jpg', 'CrossFit, Funcional e Musculação', ['crossfit', 'funcional', 'musculacao'], 'Londrina, PR', 'p', '2026-07-06'],
  ['bruno-soares-marques-10e93086', 'Bruno Soares Marques', 'BM', '10e93086-e24a-4f6e-a979-0579d24a777c/e0a6fa8e8ee1f315.jpg', 'Musculação, Funcional e CrossFit', ['crossfit', 'funcional', 'musculacao'], '', 'o', '2026-09-08'],
  ['caio-rocket-4ade72d3', 'Caio Rocket', 'CR', '4ade72d3-ea75-4be9-a22e-8575af9cd056/659a33ec80dbb0a7.jpg', 'CrossFit e Musculação', ['crossfit', 'musculacao'], '', 'o', '2026-09-07'],
  ['diego-moura-87286f5a', 'Diego Moura', 'DM', '87286f5a-ff7b-4e34-a5fb-6614547c359c/7673d8ad8457524e.jpg', 'CrossFit', ['crossfit'], '', 'o', '2026-09-07'],
  ['linda-beatriz-rodrigues-de-medeiros-861b43bf', 'Linda Beatriz Rodrigues de Medeiros', 'LM', '861b43bf-3ee1-4073-a6f2-ed72ef52ce3a/820495ee9479fa2d.png', 'Musculação', ['musculacao'], '', 'o', '2026-10-21'],
  ['aguinaldo-siqueira-bb5ba0c0', 'Aguinaldo siqueira', 'AS', 'bb5ba0c0-a828-447c-ac75-e1f23dacdd77/820495ee9479fa2d.png', 'Musculação e Corrida', ['corrida', 'musculacao'], '', 'o', '2026-10-20'],
  ['rogerio-vieira-fd6c2c39', 'Rogerio Vieira', 'RV', 'fd6c2c39-ebc2-4a85-afb6-073979cb31cd/820495ee9479fa2d.png', 'Musculação', ['musculacao'], '', 'o', '2026-10-19'],
  ['debora-maria-9063d266', 'Debora Maria', 'DM', '9063d266-bc37-42e4-a828-540c4c7a4f85/820495ee9479fa2d.png', 'Musculação e Funcional', ['funcional', 'musculacao'], '', 'o', '2026-10-14'],
  ['abner-braganca-vila-velha-es', 'Abner Bragança', 'AB', '3138c432-bdc1-4559-8dcd-8bf16334bf34/8d411b78cdd575fe.jpg', 'Musculação', ['musculacao'], 'Vila Velha, ES', 'po', '2026-07-17'],
  ['adonis-cordeiro', 'Adônis Cordeiro', 'AC', 'dd268657-b9a0-451c-9075-b84b2a1033a3/4f8f9b38a4ff31eb.jpg', 'Musculação', ['musculacao'], '', 'po', '2026-07-17'],
  ['adriano-aparecido-daniel-35052852', 'Adriano Aparecido Daniel', 'AD', '35052852-5903-4878-a5c7-d0b23a6028aa/6f5fc66470d535b4.jpg', 'Musculação', ['musculacao'], '', 'o', '2026-09-09'],
  ['adriano-rodrigues-709b3cf7', 'Adriano Rodrigues', 'AR', '709b3cf7-a1c7-4388-ada4-2e4eac8d1ddd/39b29f83b220778a.jpg', 'Musculação', ['musculacao'], '', 'o', '2026-09-10']
];
