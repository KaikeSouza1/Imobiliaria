// Modelos: administração de imóvel (locação), intermediação de venda, termo de entrega de chaves e notificações.
// Texto transcrito dos modelos da imobiliária; só os dados variáveis viraram campos.
import {
  type Modelo, type Debito, type Valores, camposPessoa, qualificacao, qualificacaoImobiliaria, txt, num, g,
} from "./tipos";
import {
  moedaComExtenso, dataPorExtenso, dataCurta, numeroComExtenso, numeroPorExtenso, moeda,
} from "./extenso";

function debitos(v: Valores, id: string): Debito[] {
  const lista = Array.isArray(v[id]) ? (v[id] as Debito[]) : [];
  return lista
    .filter((d) => d && d.vencimento && Number(d.valor) > 0)
    .map((d) => ({ descricao: String(d.descricao || "Aluguel").replace(/\*+/g, "").trim() || "Aluguel", vencimento: d.vencimento, valor: Number(d.valor) }));
}

function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// INSTRUMENTO PARTICULAR DE ADMINISTRAÇÃO DE IMÓVEL ("CONTRATO ADM LOCAÇÃO.docx")
// ---------------------------------------------------------------------------
export const administracaoLocacao: Modelo = {
  id: "administracao_locacao",
  titulo: "Contrato de Administração (Locação)",
  descricao: "Instrumento particular de administração de imóvel para locação, assinado com o proprietário.",
  tipoDocumento: "contrato_gerado",
  vinculo: "proprietario",
  logo: true,
  campos: [
    { id: "data_assinatura", rotulo: "Data da assinatura", tipo: "data", grupo: "Contrato", obrigatorio: true, largura: "terco" },
    ...camposPessoa("proprietario", "Proprietário", { pix: true }),
    { id: "imovel_finalidade", rotulo: "Finalidade do imóvel", tipo: "select", grupo: "Imóvel", obrigatorio: true, padrao: "comercial", largura: "terco",
      opcoes: [{ valor: "comercial", rotulo: "Comercial" }, { valor: "residencial", rotulo: "Residencial" }] },
    { id: "imovel_tipo", rotulo: "Tipo do imóvel", tipo: "texto", grupo: "Imóvel", obrigatorio: true, largura: "terco", placeholder: "Ex: BARRACÃO, CASA, SALA" },
    { id: "imovel_endereco", rotulo: "Endereço do imóvel", tipo: "texto", grupo: "Imóvel", obrigatorio: true, largura: "inteira", placeholder: "RUA, NÚMERO, BAIRRO, CIDADE UF" },
    { id: "imovel_cep", rotulo: "CEP do imóvel", tipo: "texto", grupo: "Imóvel", largura: "terco" },
    { id: "prazo_maximo_locacao", rotulo: "Prazo máximo da locação (meses)", tipo: "inteiro", grupo: "Condições", obrigatorio: true, padrao: 24, largura: "terco" },
    { id: "aluguel_minimo", rotulo: "Aluguel mínimo (R$)", tipo: "moeda", grupo: "Condições", obrigatorio: true, largura: "terco" },
    { id: "comissao_percentual", rotulo: "Comissão de administração (%)", tipo: "percentual", grupo: "Condições", obrigatorio: true, padrao: 10, largura: "terco" },
    { id: "vigencia_meses", rotulo: "Vigência do contrato (meses)", tipo: "inteiro", grupo: "Condições", obrigatorio: true, padrao: 24, largura: "terco" },
  ],
  nomeArquivo: (v) => `Contrato de Administração - ${txt(v, "proprietario_nome")}.pdf`,
  montar: (v, e) => {
    const finalidade = txt(v, "imovel_finalidade") === "residencial" ? "residencial" : "comercial";
    const prazoLoc = num(v, "prazo_maximo_locacao") || 24;
    const vigencia = num(v, "vigencia_meses") || 24;
    const comissao = num(v, "comissao_percentual") || 10;
    const imovel = `${txt(v, "imovel_endereco").toUpperCase()}${txt(v, "imovel_cep") ? `, CEP ${txt(v, "imovel_cep")}` : ""}`;
    return [
      { t: "titulo", texto: "INSTRUMENTO PARTICULAR DE ADMINISTRAÇÃO DE IMÓVEL" },
      { t: "p", texto: `Pelo presente instrumento, de um lado ${qualificacaoImobiliaria(e, { creciRepresentante: true })}` },
      { t: "p", texto: `De outro lado: ${qualificacao(v, "proprietario", { pix: true })}` },
      { t: "p", texto: `**CLÁUSULA 1º –** O primeiro dos acima qualificados, de ora em diante denominado simplesmente ADMINISTRADOR, recebe para alugar do segundo dos acima qualificados, imóvel **${finalidade.toUpperCase()}** do tipo **${txt(v, "imovel_tipo").toUpperCase()}**, de ora em diante denominado simplesmente PROPRIETÁRIO, **${imovel}.**` },
      { t: "p", texto: `**PARÁGRAFO PRIMEIRO: O PROPRIETÁRIO** confere a ADMINISTRADORA por este, mandato especial através de INSTRUMENTO PARTICULAR DE PROCURAÇÃO anexa a este contrato, a fim de administrar o imóvel de sua propriedade constante no final do contrato, podendo exercer todos os atos inerentes à gestão do negócio com amplos poderes para foro em geral com fiel observância da legislação em vigor aplicável a locação de imóvel ${finalidade}.` },
      { t: "p", texto: `**CLÁUSULA 2º –** Consistirá a ADMINISTRADORA dos bens de imóveis: efetuar locação, assinar contrato de locação, assinar termo de vistoria, estipular prazos e condições de locação, receber e dar quitação de aluguéis, fazer acordo, sendo o critério de reajuste dos aluguéis de acordo com o contrato de locação obedecendo o que rege a legislação específica em vigor. Parágrafo Único – Tendo em vista as disposições da vigente Lei do Inquilinato (Lei n.º 8.245, de 18 de outubro de 1991), O PROPRIETÁRIO autoriza a ADMINISTRADORA, desde logo, a contratar a locação ${finalidade} pelo prazo inferior ou igual a ${numeroComExtenso(prazoLoc, { maiusculas: true })} meses.` },
      { t: "p", texto: "**PARÁGRAFO ÚNICO: –** Enquanto perdurar a responsabilidade da ADMINISTRADORA, todas as despesas para cobrança do aluguel correrão por sua conta e risco. A ADMINISTRADORA se sub-rogará, legal e expressamente em todos os direitos, ações, privilégios O PROPRIETÁRIO contra os inquilinos e seus fiadores, podendo inclusive agir em seu próprio nome, em juízo ou fora dele." },
      { t: "p", texto: `**CLÁUSULA 3º -** O aluguel para o primeiro período de locação será de no mínimo **${moedaComExtenso(num(v, "aluguel_minimo"))}**, observando-se o reajuste legal, ficando a critério do ADMINISTRADOR conseguir aumentos por ocasião da renovação do contrato ou períodos de atualização, nunca inferiores ao estabelecidos em lei.` },
      { t: "p", texto: "**CLÁUSULA 4º –** O aluguel devido pelos inquilinos, bem como outros encargos e obrigações, tão logo seja pago por estes ou por seus fiadores, serão creditados em conta indicada pelo PROPRIETÁRIO ou lhe será pago diretamente, descontada a comissão ajustada em cláusula específica, tudo dentro do prazo máximo de **(5) cinco dias** úteis a partir da data do efetivo recebimento e identificação de pagamento." },
      { t: "p", texto: "**CLÁUSULA 5º –** Obriga-se o ADMINISTRADOR a empregar os seus melhores esforços na administração do imóvel do PROPRIETÁRIO, tomando as necessárias precauções para alugá-los a contento, inclusive exigindo sempre do locatário a garantia de fiador idôneo ou outra garantia, a seu critério." },
      { t: "p", texto: "**Parágrafo Único:** O ADMINISTRADOR, em hipótese alguma responderá por eventual descumprimento contratual do contrato de locação pelo locatário, em especial, mas não se limitando, à falta de pagamento de aluguéis ou outros encargos, bem como danos no imóvel, não podendo ser demandado por tais ocorrências por parte do PROPRIETÁRIO ou de quem quer que seja." },
      { t: "p", texto: "**CLÁUSULA 6º –** O ADMINISTRADOR não será responsável por eventual ação de despejo, cobrança judicial de aluguéis, ação de rescisão contratual e outras demandas judiciais que porventura se fizerem necessárias diante da locação a ser administrada. Tais providências, uma vez decididas pelo PROPRIETÁRIO, serão objeto de tratativas específicas entre as partes no momento oportuno." },
      { t: "p", texto: "**CLÁUSULA 7º –** O ADMINISTRADOR não terá responsabilidades por desgastes naturais decorrentes do tempo e do uso que porventura vier a sofrer o imóvel descrito (como por exemplo Pintura: perda da cor, manchas e desgaste natural das paredes. Pisos: riscos, desgaste perda do brilho pelo uso ou pelo tempo. Portas e janelas: envelhecimento, desgaste de dobradiças e fechaduras. Instalações: deterioração natural de encanamentos, fiações e equipamentos. Estrutura: envelhecimento natural de determinados materiais e componentes do imóvel), no intervalo compreendido entre a presente data e a concretização da locação, bem como durante o período em que o mesmo estiver, futuramente, desocupado entre duas locações." },
      { t: "p", texto: "**CLÁUSULA 8º –** Os consertos em geral relativos aos estragos no imóvel decorrentes do uso normal, após cada desocupação, serão feitos e pagos pelo PROPRIETÁRIO por sua conta e responsabilidade." },
      { t: "p", texto: "**8.1.** O PROPRIETÁRIO sempre deverá entregar o imóvel para locação em perfeito estado de funcionamento." },
      { t: "p", texto: `**CLÁUSULA 9º –** O PROPRIETÁRIO pagará ao ADMINISTRADOR a comissão de ${moeda(comissao).replace(/,00$/, "")}% (${numeroPorExtenso(comissao)} por cento) ao mês sobre o valor do aluguel pela administração do imóvel, cobrada por ocasião do pagamento do aluguel. E o valor de 1 (um) aluguel no primeiro mês referente ao agenciamento.` },
      { t: "p", texto: `**CLÁUSULA 10º –** O prazo de vigência do presente contrato será de ${vigencia} (${numeroPorExtenso(vigencia).toUpperCase()} MESES), conforme descrito na cláusula 2º, levando em consideração também o prazo do contrato de locação do referido imóvel.` },
      { t: "p", texto: "**PARÁGRAFO PRIMEIRO –** A renovação automática por prazo indeterminado do contrato de locação, do imóvel administrado no presente instrumento, prorrogará por igual período este contrato de administração, devendo as partes respeitar todas as cláusulas aqui vigentes, bem como o prazo mínimo descrito na cláusula 2º." },
      { t: "p", texto: `**PARÁGRAFO SEGUNDO –** Em casos em que o contrato de locação firmado pela administradora com o inquilino (locatário), tenha prazo superior ao previsto no presente instrumento (${vigencia} meses – clausula 2º), as partes pactuam que o prazo do presente contrato de administração será o mesmo do contrato do imóvel alugado pela administradora.` },
      { t: "p", texto: "**PARÁGRAFO TERCEIRO –** O descumprimento dos prazos supramencionados, estará sujeito a multa prevista na cláusula 12º." },
      { t: "p", texto: "**10.1.** Fica autorizado pelo PROPRIETÁRIO ao ADMINISTRADOR, fixar o prazo de locação que entender mais conveniente." },
      { t: "p", texto: "**CLÁUSULA 11º –** Durante a vigência do presente contrato, especialmente quando algum inquilino ou fiador estiver sendo executado, por falta de pagamento ou descumprimento de contrato outro, é proibido O PROPRIETÁRIO efetuar entendimentos ou recebimentos diretos com os mesmos, todavia poderão ocorrer no escritório do ADMINISTRADOR, com a presença de todas as partes." },
      { t: "p", texto: "**CLÁUSULA 12º –** Fica estipulada multa no valor de três (3) aluguéis do contrato de locação para ambas as partes, no caso de rescisão ou descumprimento do presente contrato." },
      { t: "p", texto: "**CLÁUSULA 13º -** DA OBSERVÂNCIA À LGPD - 16.1 O PROPRIETÁRIO declara expresso CONSENTIMENTO que a ADMINISTRADORA irá coletar, tratar e compartilhar os dados necessários ao cumprimento do contrato, nos termos do Art. 7º, inc. V da LGPD, bem como os dados, se necessários, para proteção ao crédito, conforme autorizado pelo Art. 7º, inc. V da LGPD." },
      { t: "p", texto: `**CLÁUSULA 14º –** Fica eleito o foro da Comarca de ${e.foro}, para dirimir quaisquer dúvidas referentes ao presente contrato.` },
      { t: "clausula", texto: "CLÁUSULA 15ª – DA OUTORGA DE PODERES PARA TRATAR DE FATURAS DE ÁGUA E ENERGIA" },
      { t: "p", texto: "**O PROPRIETARIO - outorga poderes expressos à imobiliária administradora para representá-lo junto às concessionárias de energia elétrica e água/esgoto, podendo solicitar informações, emitir segundas vias, efetuar pagamentos, requerer transferência de titularidade, desligamento ou religação dos serviços, exclusivamente para fins de regularização do imóvel.**" },
      { t: "p", texto: "**Parágrafo único**: A presente outorga vigorará durante todo a contrato de administração do imóvel, e até a completa regularização das obrigações decorrentes da desocupação do imóvel." },
      { t: "p", texto: "E, por estarem de pleno acordo, assinam o presente em duas vias de igual teor na presença de testemunhas que a tudo assistiram e que de tudo tiveram conhecimento." },
      { t: "espaco" },
      { t: "p", texto: `${e.cidade_assinatura.replace(" – ", "/")}, ${dataPorExtenso(txt(v, "data_assinatura"))}.` },
      { t: "assinaturas", ladoALado: true, pessoas: [
        { nome: e.nome_curto, linhas: [`CRECI PR Nº F ${e.representante_creci}`] },
        { nome: txt(v, "proprietario_nome").toUpperCase(), linhas: [`CPF ${txt(v, "proprietario_cpf")}`] },
      ] },
    ];
  },
};

// ---------------------------------------------------------------------------
// CONTRATO DE INTERMEDIAÇÃO IMOBILIÁRIA PARA FINS DE VENDA ("CONTRATO ADM DE VENDA.docx")
// ---------------------------------------------------------------------------
export const intermediacaoVenda: Modelo = {
  id: "intermediacao_venda",
  titulo: "Contrato de Intermediação (Venda)",
  descricao: "Autorização de venda: intermediação imobiliária com ou sem exclusividade.",
  tipoDocumento: "contrato_gerado",
  vinculo: "proprietario",
  logo: true,
  campos: [
    { id: "data_assinatura", rotulo: "Data da assinatura", tipo: "data", grupo: "Contrato", obrigatorio: true, largura: "terco" },
    ...camposPessoa("proprietario", "Proprietário (contratante)"),
    { id: "objeto_resumo", rotulo: "O que está à venda", tipo: "texto", grupo: "Imóvel", obrigatorio: true, largura: "metade", placeholder: "Ex: UM APARTAMENTO, SEIS TERRENOS" },
    { id: "imovel_endereco", rotulo: "Endereço", tipo: "texto", grupo: "Imóvel", obrigatorio: true, largura: "inteira" },
    { id: "imovel_descricao", rotulo: "Descrição", tipo: "textarea", grupo: "Imóvel", largura: "inteira", placeholder: "Ex: 02 DORMITÓRIOS, SALA, COZINHA... ÁREA PRIVATIVA DE 57,26M²" },
    { id: "matricula", rotulo: "Matrícula no Registro de Imóveis", tipo: "texto", grupo: "Imóvel", largura: "terco" },
    { id: "exclusividade", rotulo: "Exclusividade", tipo: "select", grupo: "Condições", obrigatorio: true, padrao: "sem", largura: "terco",
      opcoes: [{ valor: "sem", rotulo: "Sem exclusividade" }, { valor: "com", rotulo: "Com exclusividade" }] },
    { id: "valor_venda", rotulo: "Valor de venda (R$)", tipo: "moeda", grupo: "Condições", obrigatorio: true, largura: "terco" },
    { id: "honorarios_percentual", rotulo: "Honorários do corretor (%)", tipo: "percentual", grupo: "Condições", obrigatorio: true, padrao: 6, largura: "terco" },
    { id: "forma_pagamento", rotulo: "Forma de pagamento", tipo: "textarea", grupo: "Condições", largura: "inteira", placeholder: "Ex: à vista, ou entrada de R$ ... e saldo financiado" },
    { id: "vigencia_dias", rotulo: "Vigência (dias)", tipo: "inteiro", grupo: "Condições", obrigatorio: true, padrao: 365, largura: "terco" },
    { id: "data_inicio", rotulo: "Início da vigência", tipo: "data", grupo: "Condições", obrigatorio: true, largura: "terco" },
    { id: "data_fim", rotulo: "Término da vigência", tipo: "data", grupo: "Condições", largura: "terco", ajuda: "Vazio = início + vigência." },
  ],
  nomeArquivo: (v) => `Contrato de Intermediação de Venda - ${txt(v, "proprietario_nome")}.pdf`,
  montar: (v, e) => {
    const prop = g(v, "proprietario_genero", "PROPRIETÁRIO", "PROPRIETÁRIA");
    const honor = num(v, "honorarios_percentual") || 6;
    const honorTxt = `${moeda(honor).replace(/,00$/, "")}% (${numeroPorExtenso(honor)} por cento)`;
    const inicio = txt(v, "data_inicio");
    const dias = num(v, "vigencia_dias") || 365;
    const fim = txt(v, "data_fim") || somarDias(inicio, dias);
    const valor = num(v, "valor_venda");
    const descricao = txt(v, "imovel_descricao");
    const matricula = txt(v, "matricula");
    return [
      { t: "titulo", texto: "CONTRATO DE INTERMEDIAÇÃO IMOBILIÁRIA" },
      { t: "subtitulo", texto: "PARA FINS DE VENDA" },
      { t: "p", texto: "Por este instrumento particular, as partes qualificadas na Cláusula 1ª têm entre si justa e acertada a presente relação contratual." },
      { t: "clausula", texto: "CLÁUSULA 1ª - QUALIFICAÇÃO DAS PARTES" },
      { t: "clausula", texto: `${prop} – CONTRATANTE` },
      { t: "p", texto: `${qualificacao(v, "proprietario")} Tem justo e contratado o seguinte:` },
      { t: "clausula", texto: "IMOBILIÁRIA - CONTRATADA" },
      { t: "p", texto: qualificacaoImobiliaria(e) },
      { t: "clausula", texto: "CLÁUSULA 2ª - OBJETO DO CONTRATO" },
      { t: "p", texto: `O presente contrato tem por finalidade a intermediação, por parte do CONTRATADO, na venda de **${txt(v, "objeto_resumo").toUpperCase()}**, descrito a seguir, de propriedade CONTRATANTE:` },
      { t: "p", texto: `**ENDEREÇO:** ${txt(v, "imovel_endereco").toUpperCase()}` },
      ...(descricao ? [{ t: "p" as const, texto: `**DESCRIÇÃO:** ${descricao.toUpperCase()}` }] : []),
      ...(matricula ? [{ t: "p" as const, texto: `**MATRÍCULA NO CARTÓRIO DE REGISTRO DE IMÓVEIS:** ${matricula}` }] : []),
      { t: "p", texto: "**Parágrafo Único** - O CONTRATO declara que o imóvel referido no “caput” desta Cláusula se encontra totalmente desembaraçado de qualquer ônus ou gravame, inclusive de natureza tributária." },
      { t: "clausula", texto: "CLÁUSULA 3ª - CONDIÇÕES E DIVULGAÇÃO DA INTERMEDIAÇÃO" },
      { t: "p", texto: `A intermediação imobiliária ora contratada é realizada em caráter **${txt(v, "exclusividade") === "com" ? "COM EXCLUSIVIDADE" : "SEM EXCLUSIVIDADE"}**.` },
      { t: "p", texto: "**§ 1º** - Para a intermediação, o CONTRATANTE autoriza que o CONTRATADO realize divulgação no próprio imóvel, através de placas, faixas e por meio de mídia impressa ou eletrônica." },
      { t: "p", texto: "**§ 2º** - O CONTRATANTE autorizam o CONTRATADO a promover visitas ao imóvel para fins de apresentação a interessados, sempre com agendamento prévio." },
      { t: "p", texto: `**§ 3º** - A presente autorização de venda ${txt(v, "exclusividade") === "com" ? "com" : "sem"} exclusividade, tem o seu amparo na Lei 6.530 Art. 20, item III, de 12/05/78 e pela Resolução COFECI nº 005/78.` },
      { t: "clausula", texto: "CLÁUSULA 4ª - VALOR DO IMÓVEL E CONDIÇÕES DE PAGAMENTO" },
      { t: "p", texto: "A transação objeto deste instrumento contratual deverá ser concretizada pelo valor total de:" },
      { t: "p", texto: `**${moedaComExtenso(valor).toUpperCase().replace("R$", "R$")}.**` },
      { t: "p", texto: `**Parágrafo Único** - O valor referido no “caput” desta Cláusula deverá ser pago da seguinte forma:${txt(v, "forma_pagamento") ? ` ${txt(v, "forma_pagamento")}` : ""}` },
      { t: "clausula", texto: "CLÁUSULA 5ª - FECHAMENTO E SINAL DE NEGÓCIO" },
      { t: "p", texto: "O CONTRATADO não poderá fechar negócio por valor ou condição de pagamento diferente do estipulado na Cláusula 4ª, devendo solicitar o aceite expresso do CONTRATANTE no caso de proposta diferente do ora estabelecido." },
      { t: "clausula", texto: "CLÁUSULA 6ª - HONORÁRIOS DO CONTRATADO" },
      { t: "p", texto: "Pela intermediação ora acertada, o CONTRATANTE pagará ao CONTRATADO, a título de honorários, o percentual abaixo apresentado, calculado sobre o valor total pelo qual a transação for fechada:" },
      { t: "p", texto: `**Honorários do Corretor de Imóveis: ${honorTxt}**` },
      { t: "p", texto: `**§ 1º** - Os honorários de que trata o “caput” desta Cláusula serão pagos no momento do recebimento do sinal de negócio, sendo deduzido do mesmo. Os contratantes podem vender o imóvel para outro comprador sem a necessidade de pagar os honorários do corretor, de ${honorTxt} desde que não haja intermediação do corretor.` },
      { t: "p", texto: "**§ 2º** - Caso o pagamento relativo à venda do imóvel seja efetuado de uma só vez, os honorários referidos nesta Cláusula serão pagos no mesmo instante, ou seja, quando o comprador pagar o preço." },
      { t: "p", texto: "**§ 3º** - Caso o CONTRATANTE não paguem os honorários estipulados no “caput” desta Cláusula, poderá o CONTRATADO promover a respectiva cobrança através dos meios que dispuser, sejam eles judiciais ou extrajudiciais, ficando o CONTRATANTE responsável pelo pagamento de todas as custas que se fizerem necessárias para esse fim, inclusive por honorários advocatícios, se existirem." },
      { t: "p", texto: "**§ 4º** - O CONTRATANTE estarão desobrigado de pagar os honorários ora estipulados caso o CONTRATADO não promova a intermediação dentro do prazo de vigência deste contrato, resguardado o caso previsto na Cláusula 5ª." },
      { t: "p", texto: "**§ 5º** - Nos termos do art. 727 do Código Civil, qualquer negócio realizado como fruto ou decorrência da mediação do Corretor implica no pagamento integral dos honorários, mesmo que concretize após a vigência deste contrato." },
      { t: "clausula", texto: "CLÁUSULA 7ª - PRAZO DE VIGÊNCIA CONTRATUAL" },
      { t: "p", texto: `**§1º** - O presente contrato é válido pelo prazo ${dias} dias, com início ${dataCurta(inicio)}, com término em ${dataCurta(fim)}, iniciando esse período a partir de suas assinaturas.` },
      { t: "clausula", texto: "CLÁUSULA 8ª - SUBSTABELECIMENTO" },
      { t: "p", texto: "O CONTRATADO poderá substabelecer os direitos deste contrato, desde que tenha justo motivo para tanto e, ainda, que comunique o fato previamente ao CONTRATANTE." },
      { t: "clausula", texto: "CLÁUSULA 9ª - FORO CONTRATUAL" },
      { t: "p", texto: `As partes elegem o Foro da Comarca de ${e.foro.replace("/PR", ", estado do Paraná")} para dirimir qualquer dúvida sobre este instrumento.` },
      { t: "p", texto: "E por estarem assim justas e contratadas as partes assinam o presente contrato em duas vias de igual teor e forma." },
      { t: "espaco" },
      { t: "p", texto: `${e.cidade_assinatura.split(" –")[0]}, ${dataPorExtenso(txt(v, "data_assinatura"))}.` },
      { t: "assinaturas", pessoas: [
        { nome: e.nome_curto, linhas: ["EMPREENDIMENTOS IMOBILIARIOS- LTDA"] },
        { nome: txt(v, "proprietario_nome").toUpperCase(), linhas: [`CPF ${txt(v, "proprietario_cpf")}`] },
      ] },
    ];
  },
};

// ---------------------------------------------------------------------------
// TERMO DE ENTREGA DE CHAVES
// ---------------------------------------------------------------------------
export const termoEntregaChaves: Modelo = {
  id: "termo_entrega_chaves",
  titulo: "Termo de Entrega de Chaves",
  descricao: "Declaração de recebimento das chaves na desocupação do imóvel.",
  tipoDocumento: "termo",
  vinculo: "locacao",
  logo: true,
  campos: [
    { id: "data_assinatura", rotulo: "Data", tipo: "data", grupo: "Termo", obrigatorio: true, largura: "terco" },
    { id: "entregador_nome", rotulo: "Quem entregou as chaves", tipo: "texto", grupo: "Termo", obrigatorio: true, largura: "metade" },
    { id: "entregador_cpf", rotulo: "CPF de quem entregou", tipo: "texto", grupo: "Termo", obrigatorio: true, largura: "terco" },
    { id: "chaves_descricao", rotulo: "Chaves e itens entregues", tipo: "texto", grupo: "Termo", obrigatorio: true, largura: "inteira",
      placeholder: "Ex: duas chaves, duas tags de acesso ao prédio e um controle" },
    { id: "imovel_endereco", rotulo: "Endereço do imóvel", tipo: "texto", grupo: "Termo", obrigatorio: true, largura: "inteira" },
    { id: "inquilino_nome", rotulo: "Contrato de locação de (inquilino)", tipo: "texto", grupo: "Termo", obrigatorio: true, largura: "metade" },
  ],
  nomeArquivo: (v) => `Termo de Entrega de Chaves - ${txt(v, "inquilino_nome")}.pdf`,
  montar: (v, e) => [
    { t: "titulo", texto: "TERMO DE ENTREGA DE CHAVES" },
    { t: "espaco" },
    { t: "p", texto: `**${e.razao_social.replace(" – ", " - ")},** inscrito no **CNPJ** ${e.cnpj}, CRECI ${e.creci_pj}, com sede a ${e.sede}, representada por seu procurador, **${e.representante_nome}**, ${e.representante_profissao}, identidade ${e.representante_rg} e portador do CPF nº ${e.representante_cpf}, ${e.representante_domicilio} **declara ter recebido de ${txt(v, "entregador_nome").toUpperCase()}** inscrito no **CPF sob nº ${txt(v, "entregador_cpf")}**, as chaves (${txt(v, "chaves_descricao")}) do imóvel localizado na **${txt(v, "imovel_endereco")}, **referente ao contrato de locação de **${txt(v, "inquilino_nome").toUpperCase()}.**` },
    { t: "espaco" },
    { t: "p", texto: `**${e.cidade_assinatura.replace(" – ", " ")}, ${dataPorExtenso(txt(v, "data_assinatura")).replace(" de ", " ")}.**` },
    { t: "assinaturas", pessoas: [
      { nome: e.nome_curto, linhas: ["EMPREENDIMENTOS IMOBILIÁRIOS LTDA"] },
      { nome: txt(v, "entregador_nome").toUpperCase(), linhas: [`CPF sob nº ${txt(v, "entregador_cpf")}`] },
    ] },
  ],
};

// ---------------------------------------------------------------------------
// NOTIFICAÇÃO POR FALTA DE PAGAMENTO (simples)
// ---------------------------------------------------------------------------
const campoDebitos = { id: "debitos", rotulo: "Débitos em atraso", tipo: "debitos" as const, grupo: "Débitos", obrigatorio: true, largura: "inteira" as const };

export const notificacaoSimples: Modelo = {
  id: "notificacao_falta_pagamento",
  titulo: "Notificação por Falta de Pagamento",
  descricao: "Aviso de débito com prazo de 5 dias úteis para regularizar.",
  tipoDocumento: "notificacao",
  vinculo: "locacao",
  logo: false,
  campos: [
    { id: "data_assinatura", rotulo: "Data", tipo: "data", grupo: "Notificação", obrigatorio: true, largura: "terco" },
    { id: "notificado_nome", rotulo: "Notificado (inquilino)", tipo: "texto", grupo: "Notificação", obrigatorio: true, largura: "metade" },
    { id: "notificado_cpf", rotulo: "CPF", tipo: "texto", grupo: "Notificação", obrigatorio: true, largura: "terco" },
    { id: "imovel_endereco", rotulo: "Endereço do imóvel", tipo: "texto", grupo: "Notificação", obrigatorio: true, largura: "inteira" },
    campoDebitos,
  ],
  nomeArquivo: (v) => `Notificação Falta de Pagamento - ${txt(v, "notificado_nome")}.pdf`,
  montar: (v, e) => [
    { t: "titulo", texto: "NOTIFICAÇÃO POR FALTA DE PAGAMENTO" },
    { t: "espaco", altura: 6 },
    { t: "p", texto: `**NOTIFICADO:** ${txt(v, "notificado_nome").toUpperCase()}          **CPF:** ${txt(v, "notificado_cpf")}`, alinhamento: "left" },
    { t: "p", texto: `**ENDEREÇO DO IMÓVEL:** ${txt(v, "imovel_endereco")}`, alinhamento: "left" },
    { t: "p", texto: "Prezado(a) Senhor(a)," },
    { t: "p", texto: `A **${e.nome_curto}**, na qualidade de representante do locador, vem **NOTIFICÁ-LO(A)** formalmente sobre a **EXISTÊNCIA DE DÉBITOS** referentes ao contrato de locação, conforme discriminado:` },
    ...debitos(v, "debitos").map((d) => ({ t: "p" as const, texto: `**${d.descricao.toUpperCase()} VENC ${dataCurta(d.vencimento)}:** em atraso R$ ${moeda(d.valor)}`, alinhamento: "left" as const })),
    { t: "p", texto: "Nos termos dos artigos 9º, inciso III, e 23, inciso I, da Lei nº 8.245/1991 (Lei do Inquilinato), o pagamento pontual dos aluguéis é **OBRIGAÇÃO DO LOCATÁRIO**, sendo a inadimplência motivo para rescisão da locação." },
    { t: "p", texto: "Diante disso, fica V.Sa. **NOTIFICADO(A)** a, no prazo de **05 (CINCO) DIAS ÚTEIS**, contados do primeiro dia útil seguinte ao recebimento desta notificação: **EFETUAR O PAGAMENTO INTEGRAL DOS VALORES EM ATRASO, REGULARIZANDO A LOCAÇÃO.**" },
    { t: "p", texto: "O não cumprimento poderá resultar na adoção das medidas judiciais cabíveis, incluindo **AÇÃO DE DESPEJO POR FALTA DE PAGAMENTO CUMULADA COM COBRANÇA DOS VALORES DEVIDOS**, conforme a Lei nº 8.245/1991." },
    { t: "p", texto: "O pagamento deverá ser realizado por meio de **BOLETO, (NÃO RECEBEMOS POR PIX)**, com envio do respectivo comprovante." },
    { t: "p", texto: "Sem mais, aguardamos a regularização dentro do prazo estabelecido." },
    { t: "p", texto: `${e.cidade_assinatura.replace(" – ", " ")}, ${dataPorExtenso(txt(v, "data_assinatura"))}.` },
    { t: "assinaturas", pessoas: [{ nome: e.nome_curto, linhas: ["EMPREENDIMENTOS IMOBILIÁRIOS", `CNPJ ${e.cnpj}`] }] },
  ],
};

// ---------------------------------------------------------------------------
// NOTIFICAÇÃO EXTRAJUDICIAL POR FALTA DE PAGAMENTO
// ---------------------------------------------------------------------------
export const notificacaoExtrajudicial: Modelo = {
  id: "notificacao_extrajudicial",
  titulo: "Notificação Extrajudicial",
  descricao: "Aviso de protesto, negativação e ação de despejo, com prazo em dias corridos.",
  tipoDocumento: "notificacao",
  vinculo: "locacao",
  logo: false,
  campos: [
    { id: "data_assinatura", rotulo: "Data", tipo: "data", grupo: "Notificação", obrigatorio: true, largura: "terco" },
    { id: "notificado_nome", rotulo: "Notificado (inquilino)", tipo: "texto", grupo: "Notificação", obrigatorio: true, largura: "metade" },
    { id: "notificado_genero", rotulo: "Tratamento", tipo: "select", grupo: "Notificação", padrao: "masculino", largura: "terco",
      opcoes: [{ valor: "masculino", rotulo: "Prezado Senhor" }, { valor: "feminino", rotulo: "Prezada Senhora" }] },
    { id: "notificado_cpf", rotulo: "CPF", tipo: "texto", grupo: "Notificação", obrigatorio: true, largura: "terco" },
    { id: "imovel_endereco", rotulo: "Endereço do imóvel", tipo: "texto", grupo: "Notificação", obrigatorio: true, largura: "inteira" },
    { id: "prazo_dias", rotulo: "Prazo para pagar (dias corridos)", tipo: "inteiro", grupo: "Notificação", obrigatorio: true, padrao: 15, largura: "terco" },
    campoDebitos,
  ],
  nomeArquivo: (v) => `Notificação Extrajudicial - ${txt(v, "notificado_nome")}.pdf`,
  montar: (v, e) => {
    const lista = debitos(v, "debitos");
    const total = lista.reduce((s, d) => s + d.valor, 0);
    const prazo = num(v, "prazo_dias") || 15;
    const prazoTxt = `${prazo} (${numeroPorExtenso(prazo).toUpperCase()}) DIAS CORRIDOS`;
    const lo = g(v, "notificado_genero", "LO", "LA");
    const notificado = g(v, "notificado_genero", "NOTIFICADO", "NOTIFICADA");
    return [
      { t: "titulo", texto: "NOTIFICAÇÃO EXTRAJUDICIAL POR FALTA DE PAGAMENTO" },
      { t: "subtitulo", texto: "AVISO DE PROTESTO, NEGATIVAÇÃO E AÇÃO DE DESPEJO" },
      { t: "p", texto: `**NOTIFICANTE:** ${e.nome_curto} EMPREENDIMENTOS IMOBILIÁRIOS **CNPJ:** ${e.cnpj}`, alinhamento: "left" },
      { t: "p", texto: `**NOTIFICADO:** ${txt(v, "notificado_nome").toUpperCase()} **CPF:** ${txt(v, "notificado_cpf")}`, alinhamento: "left" },
      { t: "p", texto: `**ENDEREÇO DO IMÓVEL:** ${txt(v, "imovel_endereco")}.`, alinhamento: "left" },
      { t: "p", texto: "**ASSUNTO: NOTIFICAÇÃO FORMAL DE INADIMPLÊNCIA LOCATÍCIA**", alinhamento: "left" },
      { t: "p", texto: `${g(v, "notificado_genero", "Prezado Senhor", "Prezada Senhora")},` },
      { t: "p", texto: `A **${e.nome_curto}**, na qualidade de representante do locador, vem, por meio desta, **NOTIFICÁ-${lo} EXTRAJUDICIALMENTE** acerca da existência de débitos vencidos e não quitados referentes ao contrato de locação do imóvel acima identificado.` },
      { t: "p", texto: "Até a presente data, encontram-se pendentes os seguintes valores:" },
      { t: "tabela", linhas: lista.map((d): [string, string] => [`${d.descricao} vencido em ${dataCurta(d.vencimento)}`, `R$ ${moeda(d.valor)}`]), total: ["TOTAL EM ABERTO", `R$ ${moeda(total)}`] },
      { t: "p", texto: "O valor informado poderá sofrer atualização em razão de multas, juros, correção monetária e demais encargos legal ou contratualmente aplicáveis." },
      { t: "clausula", texto: "1. PRAZO PARA REGULARIZAÇÃO" },
      { t: "p", texto: `Fica V.Sa. formalmente **${notificado}** a realizar o pagamento integral dos débitos no prazo máximo de **${prazoTxt}**, contados do recebimento desta notificação.` },
      { t: "p", texto: "O pagamento deverá ser realizado exclusivamente por meio dos boletos bancários disponibilizados pela administradora, com o devido envio dos comprovantes de quitação." },
      { t: "p", texto: "**NÃO SERÃO ACEITOS PAGAMENTOS VIA PIX.**" },
      { t: "clausula", texto: "2. PROTESTO DOS BOLETOS E NEGATIVAÇÃO" },
      { t: "p", texto: "Na ausência de regularização, os débitos vencidos poderão ser encaminhados para **PROTESTO EM CARTÓRIO**, observados os requisitos legais aplicáveis." },
      { t: "p", texto: "O inadimplemento também poderá resultar na inclusão do nome e CPF do notificado nos cadastros de proteção ao crédito, inclusive SERASA, mediante observância das exigências legais de comunicação e registro." },
      { t: "p", texto: "As despesas legalmente exigíveis decorrentes dessas medidas poderão ser acrescidas ao débito." },
      { t: "clausula", texto: "3. AÇÃO DE DESPEJO E COBRANÇA JUDICIAL" },
      { t: "p", texto: "Nos termos dos artigos 9º, inciso III, e 23, inciso I, da Lei nº 8.245/1991, o pagamento pontual dos aluguéis e encargos constitui obrigação do locatário." },
      { t: "p", texto: `**FICA EXPRESSAMENTE ADVERTIDO QUE, CASO NÃO OCORRA A QUITAÇÃO INTEGRAL DOS DÉBITOS NO PRAZO DE ${prazoTxt}, SERÃO ADOTADAS AS PROVIDÊNCIAS PARA AJUIZAMENTO DE AÇÃO DE DESPEJO POR FALTA DE PAGAMENTO, CUMULADA COM COBRANÇA JUDICIAL DOS VALORES DEVIDOS.**` },
      { t: "p", texto: "A cobrança judicial poderá abranger os aluguéis vencidos, encargos contratuais, custas processuais e honorários advocatícios legalmente cabíveis." },
      { t: "p", texto: "Ressalta-se que eventual desocupação do imóvel não implica quitação ou perdão dos débitos existentes." },
      { t: "clausula", texto: "4. CONSIDERAÇÕES FINAIS" },
      { t: "p", texto: "A presente notificação constitui tentativa formal de solução extrajudicial, concedendo ao notificado a oportunidade de regularizar sua situação antes da adoção das medidas cabíveis." },
      { t: "p", texto: "Solicitamos que a situação seja tratada com a máxima urgência, a fim de evitar maiores encargos financeiros e procedimentos judiciais." },
      { t: "p", texto: "Sem mais, aguardamos a regularização dentro do prazo estabelecido." },
      { t: "p", texto: `${e.cidade_assinatura}, ${dataPorExtenso(txt(v, "data_assinatura"), { minusculo: true })}.` },
      { t: "assinaturas", pessoas: [{ nome: e.nome_curto }] },
    ];
  },
};
