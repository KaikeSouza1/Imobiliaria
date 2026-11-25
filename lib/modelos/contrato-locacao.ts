// Modelo: CONTRATO DE LOCAÇÃO DE IMÓVEL (residencial ou comercial).
// Texto das cláusulas transcrito do modelo da imobiliária ("CONTRATO LOCAÇÃO.docx"); só os dados variáveis viraram campos.
import {
  type Modelo, type Bloco, camposPessoa, qualificacao, qualificacaoImobiliaria, txt, num, sim,
} from "./tipos";
import { moedaComExtenso, dataPorExtenso, dataPontos, somarMeses, numeroComExtenso, moeda, reaisPorExtenso, numeroPorExtenso } from "./extenso";

export const contratoLocacao: Modelo = {
  id: "contrato_locacao",
  titulo: "Contrato de Locação",
  descricao: "Contrato de locação residencial ou comercial, com fiador opcional.",
  tipoDocumento: "contrato_gerado",
  vinculo: "locacao",
  logo: true,
  campos: [
    { id: "finalidade", rotulo: "Finalidade", tipo: "select", grupo: "Contrato", obrigatorio: true, padrao: "residencial", largura: "terco",
      opcoes: [{ valor: "residencial", rotulo: "Residencial" }, { valor: "comercial", rotulo: "Comercial" }] },
    { id: "data_assinatura", rotulo: "Data da assinatura", tipo: "data", grupo: "Contrato", obrigatorio: true, largura: "terco" },
    ...camposPessoa("locatario", "Locatário (inquilino)"),
    { id: "tem_fiador", rotulo: "Tem fiador", tipo: "booleano", grupo: "Fiador", padrao: false },
    ...camposPessoa("fiador", "Fiador", { visivelSe: "tem_fiador" }),
    { id: "imovel_descricao", rotulo: "Tipo do imóvel", tipo: "texto", grupo: "Imóvel", obrigatorio: true, largura: "metade",
      placeholder: "Ex: LOFT de madeira, CASA de alvenaria, APARTAMENTO" },
    { id: "imovel_endereco", rotulo: "Endereço do imóvel", tipo: "texto", grupo: "Imóvel", obrigatorio: true, largura: "inteira",
      placeholder: "RUA, NÚMERO, BAIRRO, CIDADE UF" },
    { id: "imovel_cep", rotulo: "CEP do imóvel", tipo: "texto", grupo: "Imóvel", largura: "terco" },
    { id: "prazo_meses", rotulo: "Prazo (meses)", tipo: "inteiro", grupo: "Prazo", obrigatorio: true, padrao: 12, largura: "terco" },
    { id: "data_inicio", rotulo: "Início", tipo: "data", grupo: "Prazo", obrigatorio: true, largura: "terco" },
    { id: "data_fim", rotulo: "Término", tipo: "data", grupo: "Prazo", largura: "terco", ajuda: "Vazio = início + prazo." },
    { id: "valor_aluguel", rotulo: "Aluguel mensal (R$)", tipo: "moeda", grupo: "Valores", obrigatorio: true, largura: "terco" },
    { id: "aluguel_inclusos", rotulo: "Incluso no aluguel", tipo: "texto", grupo: "Valores", largura: "metade",
      placeholder: "Ex: água, luz, IPTU e taxa de lixo", ajuda: "Deixe vazio se nada estiver incluso." },
    { id: "dia_vencimento", rotulo: "Dia do pagamento", tipo: "inteiro", grupo: "Valores", obrigatorio: true, padrao: 20, largura: "terco" },
    { id: "multa_transferencia", rotulo: "Multa diária por não transferir água/luz (R$)", tipo: "moeda", grupo: "Valores", padrao: 10, largura: "terco" },
    { id: "tem_fundo", rotulo: "Tem Fundo de Conservação", tipo: "booleano", grupo: "Valores", padrao: true },
    { id: "fundo_parcelas", rotulo: "Parcelas do fundo", tipo: "inteiro", grupo: "Valores", padrao: 11, largura: "terco", visivelSe: "tem_fundo" },
    { id: "fundo_valor", rotulo: "Valor de cada parcela (R$)", tipo: "moeda", grupo: "Valores", largura: "terco", visivelSe: "tem_fundo" },
    { id: "corretor_nome", rotulo: "Corretor responsável", tipo: "texto", grupo: "Valores", largura: "metade" },
    { id: "corretor_creci", rotulo: "CRECI do corretor", tipo: "texto", grupo: "Valores", largura: "terco", placeholder: "42.206 PARANÁ" },
  ],
  nomeArquivo: (v) => `Contrato de Locação - ${txt(v, "locatario_nome")}.pdf`,
  montar: (v, e) => {
    const finalidade = txt(v, "finalidade") === "comercial" ? "COMERCIAL" : "RESIDENCIAL";
    const inicio = txt(v, "data_inicio");
    const meses = num(v, "prazo_meses") || 12;
    const fim = txt(v, "data_fim") || somarMeses(inicio, meses);
    const dia = num(v, "dia_vencimento") || 20;
    const inclusos = txt(v, "aluguel_inclusos");
    const multa = num(v, "multa_transferencia") || 10;
    const imovel = `${txt(v, "imovel_endereco").toUpperCase()}${txt(v, "imovel_cep") ? `, CEP ${txt(v, "imovel_cep")}` : ""}`;

    // Itens da cláusula 4 numerados em sequência (o Fundo de Conservação é opcional).
    let n4 = 0;
    const item4 = () => `4.${++n4}`;
    const itens4: string[] = [
      `**${item4()} - O valor do aluguel mensal será de ${moedaComExtenso(num(v, "valor_aluguel"))}${inclusos ? `, incluso ${inclusos}` : ""}.**`,
    ];
    if (sim(v, "tem_fundo")) {
      const valor = num(v, "fundo_valor");
      itens4.push(`**${item4()} - Fundo de Conservação Imobiliário parcelado em ${num(v, "fundo_parcelas") || 11}X de R$ ${moeda(valor)} (${reaisPorExtenso(valor)}). Sendo estornado o valor do fundo de conservação quando encerrado o contrato, caso não fique débitos e não precise de reparos no imóvel.**`);
    }
    itens4.push(
      `**${item4()} - Os demais alugueis será pago até o dia ${dia} de cada mês e subsequentemente.**`,
      `**${item4()} -** O primeiro pagamento deverá ser feito mediante pagamento via: **PIX, chave: ${e.pix}, para ${e.nome_curto} – EMPREENDIMENTOS IMOBILIARIOS**, sendo o corretor responsável ${txt(v, "corretor_nome") || e.representante_nome}, CRECI ${txt(v, "corretor_creci") || `${e.representante_creci} PARANÁ`}. O segundo e demais alugueis deverá ser pago através de boleto bancário todo dia ${dia} de cada mês, no caso de o dia convencionado para pagamento recair em sábados, domingos e feriados, o prazo será prorrogado automaticamente para o próximo dia útil seguinte.`,
      `**${item4()}-** O aluguel será reajustado na periodicidade mínima fixada em lei, na exata proporção do índice de reajustamento de aluguel, um na falta de outro e na ordem a seguir os seguintes índices: IPCA, IGPM, IGP, INCC, IPA do IGP-DI, IPC, ou índice em vigor.`,
      `**${item4()}-** Este mesmo critério de reajuste será sempre observado, independente de aviso ou interpelação, a cada período de 12 (doze) meses, até quando finda ou rescindida a locação, com a efetiva entrega das chaves, ainda mesmo se independente da vontade do locador e por qualquer motivo o locatário continuar na posse direta do imóvel locado após o prazo contratual.`,
      `**${item4()}-** Se a futura legislação permitir periodicidade de reajustamento do aluguel em menor espaço de tempo, do que aquele pactuado neste contrato, de pleno direito, automática e independentemente de aviso ou notificação, os reajustes passarão a ser efetuados na periodicidade permitida na nova locação.`,
      `**${item4()}-** Além dos valores referentes ao aluguel o Locatário será responsável enquanto durar a locação por todas as despesas de conservação do imóvel.`,
      `**${item4()}- O aluguel e/ou encargos não pagos até a data do vencimento serão acrescidos multa correspondente a 10% (dez por cento) mais 1% (um por cento) de juros** por dia. Havendo necessidade de contratação de advogado (a) para realizar a cobrança dos débitos, serão acrescidos ao valor do débito, honorários advocatícios de 10% (dez por cento) para as cobranças extrajudiciais e 20% (vinte por cento) para as cobranças judiciais, devendo ainda o Locatário arcar com todas as despesas provenientes de sua mora, inclusive custas judiciais.`,
      `**${item4()}-** A simples falta de pagamento dos aluguéis e/ou encargos deste contrato nas épocas determinadas, por si só constituirá o Locatário em mora, independente de interpelação judicial ou extrajudicial, e só por força deste contrato, ficando facultada ao Locador promover ação de despejo por falta de pagamento, cobrança judicial ou execução de título extrajudicial.`,
      `**${item4()}-** Qualquer tolerância no recebimento de aluguéis em atraso, não implicará em novação, permanecendo exigíveis as penalidades contratuais, independente de revigoramento.`,
      `**${item4()}–** Fica a total responsabilidade do **LOCATÁRIO** a solicitação de ligação nova ou transferência de titularidade das contas de energia elétrica, gás e água (quando individual), no prazo máximo de 15 (quinze) dias. O LOCATÁRIO também fica responsável pela solicitação de desligamento dos medidores antes da desocupação do imóvel.`,
      `**${item4()} - O LOCATÁRIO** recebe uma cópia do termo de vistoria do estado do imóvel, cientes que possuem o prazo de 5 (cinco) dias úteis para reclamar, por escrito, acerca de eventual diferença, recebendo e reconhecendo o imóvel no estado e condições que se encontram na vistoria. Caso não ocorra a devolução da vistoria com ou sem modificações no prazo previsto, O LOCATÁRIO ao rescindir assumirá a total responsabilidade pelos eventuais danos encontrados na vistoria da rescisão do contrato.`,
    );

    const blocos: Bloco[] = [
      { t: "titulo", texto: `CONTRATO DE LOCAÇÃO DE IMÓVEL ${finalidade}` },
      { t: "p", texto: `Pelo presente instrumento particular denominado CONTRATO DE LOCAÇÃO DE IMÓVEL ${finalidade}, que entre si fazem, de um lado:` },
      { t: "p", texto: `**LOCADOR:** ${qualificacaoImobiliaria(e)}` },
      { t: "p", texto: "E de outro lado:" },
      { t: "p", texto: `**LOCATÁRIO (A):** ${qualificacao(v, "locatario")}` },
    ];
    if (sim(v, "tem_fiador")) blocos.push({ t: "p", texto: `**FIADOR (A):** ${qualificacao(v, "fiador")}` });
    blocos.push(
      { t: "p", texto: `Por este instrumento particular de contrato de locação, as partes acima qualificados, têm justos e acertados o presente contrato de **LOCAÇÃO ${finalidade}**, o que fazem mediante as cláusulas e condições seguintes:` },

      { t: "clausula", texto: "CLÁUSULA 1ª: DO OBJETO DO CONTRATO" },
      { t: "p", texto: `O Locador se obriga, neste ato a dar em locação ao locatário um imóvel urbano tipo ${txt(v, "imovel_descricao")} na ${imovel}.` },

      { t: "clausula", texto: "CLÁUSULA 2ª: PERÍODO DE LOCAÇÃO" },
      { t: "p", texto: `**O prazo do presente contrato será de ${numeroComExtenso(meses)} meses, com início em ${dataPorExtenso(inicio)} a ${dataPorExtenso(fim)},** quando terminará, independentemente de qualquer aviso, interpelação judicial ou mesmo extrajudicial. Se o imóvel encontra se a venda, para tal respeita- se o "Art. 8º. Se o imóvel for alienado durante a locação, o adquirente poderá denunciar o contrato, com o prazo de noventa dias para a desocupação, tal como estabelecido nesse referido contrato e respeitando as diretrizes relacionadas à venda de imóveis alugados, o inquilino tem 90 dias para deixar a propriedade após o registro da venda, sendo que a notificação deverá ser feita formalmente.` },

      { t: "clausula", texto: "CLAUSULA 2ª: DA TRANSFERÊNCIA DE TITULARIDADE DOS SERVIÇOS PÚBLICOS" },
      { t: "p", texto: "Fica expressamente obrigado o LOCATÁRIO a providenciar, perante as concessionárias competentes (Companhia de Água e Companhia de Energia Elétrica locais), a transferência para o seu próprio nome da titularidade das contas de consumo de água e energia elétrica do imóvel locado." },
      { t: "p", texto: "**2.1 -** O prazo para o LOCATÁRIO comprovar a solicitação de transferência perante as concessionárias é de até 10 (dez) dias corridos, contados a partir da data de assinatura deste contrato ou da entrega das chaves, o que ocorrer primeiro." },
      { t: "p", texto: `**2.2 - O descumprimento do prazo estabelecido no parágrafo anterior sujeitará o LOCATÁRIO ao pagamento de multa cominatória diária no valor de R$ ${moeda(multa).replace(/,00$/, "")} (${numeroPorExtenso(multa)}) por dia de atraso, contada do 11º (décimo primeiro) dia até a efetiva regularização e apresentação do comprovante ao LOCADOR.**` },
      { t: "p", texto: "**2.3 -** (Inclusão SPC/Serasa): Caso a multa decorrente do atraso não seja quitada pelo LOCATÁRIO quando cobrada, o LOCADOR fica expressamente autorizado a realizar a inscrição do nome do LOCATÁRIO e de seus fiadores (se houver) junto aos órgãos de proteção ao crédito, tais como SPC, Serasa e cartórios de protesto, servindo o presente instrumento como autorização prévia e irrevogável para tal ato." },
      { t: "p", texto: "**2.4 -** Se o atraso na transferência for superior a 30 (trinta) dias, o descumprimento ensejará infração contratual de natureza grave, facultando ao LOCADOR a rescisão do contrato por justa causa, sem prejuízo da cobrança das multas acumuladas." },

      { t: "clausula", texto: "CLÁUSULA 3ª: RESCISÃO DO CONTRATO" },
      { t: "p", texto: `A rescisão do contrato ocorrerá impreterivelmente no dia **${dataPontos(fim)}**, salvo se as partes acordarem um novo prazo para o contrato. Podendo o contrato ser renovado via WhatsApp, com uma simples comprovação da intenção da renovação do mesmo.` },
      { t: "p", texto: "**3.1-** Na hipótese de ambas as partes rescindirem o contrato antes do prazo final acordado, deverá pagar à parte prejudicada uma **multa equivalente a três (3) aluguéis.**" },
      { t: "p", texto: "**3.2-** A rescisão deverá ser comunicada pelas partes com antecedência mínima de 30 (trinta) dias e por escrito e ou via WhatsApp. Após a comunicação será agendada uma vistoria final do imóvel, obrigando o Locatário a devolver o imóvel nas mesmas condições em que lhes fora alugado, bem como cumprir as demais exigências administrativas." },
      { t: "p", texto: "**3.3-** No momento da rescisão, o Locatário deverá apresentar ao Locador o comprovante de quitação de todos os encargos da locação." },
      { t: "p", texto: "**3.4-** A rescisão do imóvel poderá ocorrer de forma unilateral se houver a compra do imóvel pelo locatário ou outro que assim o fizer, sem que ocorra em multa de rescisão." },

      { t: "clausula", texto: "CLÁUSULA 4ª – ALUGUEL E ENCARGOS" },
      ...itens4.map((texto): Bloco => ({ t: "p", texto })),
      { t: "p", texto: "**Parágrafo único: O não pagamento de qualquer parcela ou título de crédito decorrente deste contrato na data de seu respectivo vencimento constituirá o DEVEDOR em mora, independentemente de notificação judicial ou extrajudicial. Fica pactuado que o CREDOR somente poderá encaminhar o título inadimplido para protesto extrajudicial junto ao Cartório de Protesto de Títulos competente após decorrido o prazo mínimo de 15 (quinze) dias corridos de atraso, contados do dia imediatamente seguinte ao do vencimento originário da obrigação.**" },

      { t: "clausula", texto: "CLÁUSULA 5ª - DA DESTINAÇÃO." },
      { t: "p", texto: `O imóvel objeto do presente contrato destina-se exclusivamente para fins de uso ${finalidade.toLowerCase()}.` },

      { t: "clausula", texto: "CLÁUSULA 6ª - DA CONSERVAÇÃO E BENFEITORIAS" },
      { t: "p", texto: "O locatário obriga-se a manter o imóvel locado em perfeito estado de conservação e higiene, manter as paredes da mesma cor, e não efetuar furos nas paredes que possam vir a causar danos ao imóvel, com os itens descriminados no relatório de vistoria anexo a este contrato, mantendo-se em perfeito estado de funcionamento, conforme a vistoria realizada pelo locador no início da locação (com anuência expressa do Locatário), comprometendo se ainda a fazer às suas expensas, sem ônus atual ou futuro para o locador, a pintura do imóvel e os reparos originários do uso, quer seja pela má conservação, desgaste ou pelo abandono, somente se estiver em desacordo com aquilo que encontra-se no laudo de vistoria." },
      { t: "p", texto: "**6.1-** O Locatário, exceto as obras caracterizadas por benfeitorias necessárias ao imóvel, obriga-se a todas as outras, devendo trazê-lo em perfeito estado de conservação, e em boas condições de higiene, para assim restituí-lo com todas as instalações sanitárias, elétricas e hidráulicas; fechos, vidros e demais acessórios, especificados no auto de vistoria integrante a esse contrato, sem direito à retenção ou indenização por benfeitorias, as quais ficarão a ele incorporadas." },
      { t: "p", texto: "**6.2-** No caso de introdução de benfeitorias ou modificações no imóvel, caberá ao Locador decidir, antes da realização das mesmas, se aceita ou não a sua efetivação. Caso o Locador não aceite a sua efetivação, ficará o Locatário responsável pelas expensas necessárias para que volte ao estado original do imóvel, de acordo com o auto de vistoria inicial realizado. Qualquer anormalidade que venha a surgir no imóvel, no tocante a solidez de sua construção ou de uso de suas componentes, deverá ser imediatamente comunicado por escrito ao Locador." },
      { t: "p", texto: "**6.3-** Em caso de perigo de desabamento ou qualquer outro motivo que implique na mudança imediata do Locatário, não caberão a estes últimos qualquer pedido de perdas e danos contra o Locador e vice-versa." },
      { t: "p", texto: "**6.4-** Em caso de desapropriação do imóvel, este contrato ficará rescindido de pleno direito, sem nenhum ônus para as partes, ressalvando-se o direito do locatário de reclamar junto ao poder expropriante a indenização pelos prejuízos por ventura sofridos." },

      { t: "clausula", texto: "CLÁUSULA 7ª - DA ENTREGA DO IMÓVEL." },
      { t: "p", texto: "Finda ou rescindida a presente locação, o locador mandará proceder à vistoria, após comunicação por escrito o locatário, a fim de verificar se o imóvel está nas mesmas condições em que foi locado, ficando o locatário obrigado as indenizações pelos estragos que forem constatados inclusive as renovações gerais da pintura do imóvel com tinta da mesma qualidade e cor, somente se a pintura inicial for nova, sem uso." },

      { t: "clausula", texto: "CLÁUSULA 8ª - DA RESTITUIÇÃO DAS CHAVES." },
      { t: "p", texto: "Fica convencionado que a restituição das chaves ao locador somente será aceita se o imóvel estiver nas mesmas condições em que foi locado." },

      { t: "clausula", texto: "CLÁUSULA 9ª – DA ENTREGA DAS CHAVES E ENCERRAMENTO DA LOCAÇÃO" },
      { t: "p", texto: "A locação somente será considerada encerrada após a entrega formal das chaves do imóvel ao LOCADOR ou à imobiliária administradora, mediante protocolo, após a desocupação total do imóvel, realização da vistoria final e comprovação da quitação de todos os encargos da locação, inclusive aluguel, água, energia elétrica e demais despesas incidentes até a efetiva entrega das chaves." },
      { t: "p", texto: "**9.1 Caso, por ocasião da vistoria final, sejam constatados danos, avarias, alterações, falta de conservação, ausência de limpeza ou quaisquer irregularidades imputáveis ao LOCATÁRIO, este ficará responsável pela execução de todos os reparos, manutenções, substituições e serviços necessários para a restituição do imóvel ao estado original, observadas as condições descritas no Laudo de Vistoria Inicial. Não sendo os reparos realizados pelo LOCATÁRIO no prazo estipulado pelo LOCADOR ou pela ADMINISTRADORA, estes poderão providenciar a execução dos serviços, ficando o LOCATÁRIO responsável pelo ressarcimento integral dos custos, mediante apresentação dos respectivos comprovantes, sem prejuízo das demais medidas legais e contratuais cabíveis.**" },
      { t: "p", texto: "**9.2-** O LOCATÁRIO deve informar imediatamente ao LOCADOR sobre qualquer dano ou problema que exija reparo estrutural ou que possa afetar a habitabilidade do imóvel. Qualquer modificação ou melhoria realizada pelo locatário no imóvel deve ser previamente autorizada por escrito pelo locador e, uma vez autorizada, será de responsabilidade financeira exclusiva do locatário, salvo acordo em contrário." },
      { t: "p", texto: "**Parágrafo único**: A simples desocupação do imóvel não implica no término da locação, permanecendo o LOCATÁRIO responsável por todos os encargos até a efetiva restituição das chaves." },

      { t: "clausula", texto: "CLÁUSULA 10ª – DA REGULARIZAÇÃO DAS CONTAS DE ÁGUA E ENERGIA ELÉTRICA NA DESOCUPAÇÃO." },
      { t: "p", texto: "No ato da rescisão contratual e antes da entrega das chaves, o LOCATÁRIO obriga-se a quitar integralmente todas as faturas de energia elétrica e água/esgoto incidentes sobre o imóvel, bem como providenciar a transferência de titularidade ou encerramento das respectivas contas junto às concessionárias competentes, apresentando os comprovantes ao LOCADOR ou à administradora." },
      { t: "p", texto: "**Parágrafo único:** O descumprimento desta obrigação autoriza o LOCADOR a promover a regularização, ficando o LOCATÁRIO obrigado ao reembolso integral dos valores pagos, acrescidos dos encargos contratuais." },

      { t: "clausula", texto: "CLÁUSULA 11ª – DA OUTORGA DE PODERES PARA TRATAR DE FATURAS DE ÁGUA E ENERGIA" },
      { t: "p", texto: "O LOCATÁRIO outorga poderes expressos ao LOCADOR e/ou à imobiliária administradora para representá-lo junto às concessionárias de energia elétrica e água/esgoto, podendo solicitar informações, emitir segundas vias, efetuar pagamentos, requerer transferência de titularidade, desligamento ou religação dos serviços, exclusivamente para fins de regularização do imóvel." },
      { t: "p", texto: "**Parágrafo único**: A presente outorga vigorará durante toda a locação e até a completa regularização das obrigações decorrentes da desocupação do imóvel." },

      { t: "clausula", texto: "CLÁUSULA 12ª - DA RESCISÃO." },
      { t: "p", texto: "Ficará o presente contrato, rescindido em pleno direito, independentemente, de notificação judicial ou extrajudicial, sem que assista o locatário qualquer direito à indenização nos seguintes casos:" },
      { t: "lista", itens: [
        "Incêndio, acidente natural ou fortuito que impeçam o uso do imóvel;",
        "Desapropriação do imóvel;",
        "Infração de quaisquer das cláusulas e condições do presente contrato;",
        "Uso ou destinação do imóvel diverso dos previsto neste contrato;",
        "Se o locatário, sem anuência expressa do locador, ceder, transferir, emprestar, ou ainda sublocar no todo ou em parte o imóvel a terceiros ou parentes.",
      ] },

      { t: "clausula", texto: "CLÁUSULA 13ª - DAS CITAÇÕES E PROCURAÇÕES" },
      { t: "p", texto: "Fica Acordado que, nos procedimentos judiciais relativos às ações de despejo, consignação em pagamento de aluguéis e acessórios da locação e revisionais de aluguel, a citação, intimação ou notificação serão feitas mediantes correspondência com aviso de recebimento ou, ainda, sendo necessário, pelas demais formas previstas no Código de Processo Civil." },

      { t: "clausula", texto: "CLÁUSULA 14ª - DO FORO" },
      { t: "p", texto: `Tudo quanto for devido em razão deste contrato, notadamente os aluguéis mensais e seus acessórios, serão cobrados por ação judicial apropriada no foro da Comarca de ${e.foro}, com expressa renúncia de qualquer outro, por mais privilegiado que seja o qual desde já fica eleito pelos contratantes como seu domicílio, para que exercitem e cumpram todos os direitos e obrigações dele decorrente. Fica eleito o foro da Comarca de ${e.foro} para dirimir quaisquer controvérsias oriundas deste contrato.` },

      { t: "clausula", texto: "CLÁUSULA 15ª – DO DIREITO DE PREFERÊNCIA" },
      { t: "p", texto: "No caso de venda do imóvel, o locatário terá preferência na sua aquisição, nas mesmas condições de outro interessado e em caso de o locador necessitar para seu uso próprio ou de familiares, será expedido a locatária aviso com antecedência de trinta (30) dias do vencimento do contrato. Assim como locador será avisado pelo locatário por igual período (caso de saída ou transferência). Em caso de venda fica isento o inquilino a pagar multa rescisória por quebra de contrato. Não havendo interesse do locatário no imóvel do presente contrato e durante a sua vigência, obriga-se o locatário permitir visitas de interessados na aquisição, com aviso prévio de 24h para agendamento de visita." },

      { t: "clausula", texto: "CLÁUSULA 16ª – VERIFICAÇÃO DE VOLTAGEM E COMPATIBILIDADE ELÉTRICA" },
      { t: "p", texto: "É de exclusiva responsabilidade do LOCATÁRIO verificar a tensão (voltagem) e a capacidade de carga de cada tomada ou ponto elétrico existente no imóvel antes de conectar, ligar ou utilizar qualquer aparelho elétrico ou eletrodoméstico O LOCADOR exime-se de qualquer responsabilidade por danos, queimas ou avarias causadas a equipamentos e eletrodomésticos que sejam conectados a tomadas com voltagem incompatível à suportada pelo aparelho. Recomenda-se a utilização de equipamentos de medição adequados (como multímetros ou chaves de teste) antes do primeiro uso para garantir a segurança dos equipamentos. Qualquer divergência na rede elétrica deverá ser imediatamente comunicada ao Locador por escrito. Na hipótese de o imóvel tornar-se total ou parcialmente inabitável em razão de enchente ou alagamento, devidamente constatado pelo PROPRIETÁRIO ou pela IMOBILIÁRIA ADMINISTRADORA, ficará suspensa a exigibilidade do pagamento do aluguel a partir da data em que o imóvel for considerado inabitável, permanecendo a suspensão até que sejam concluídos os reparos indispensáveis e o imóvel seja novamente considerado habitável. Durante o período de suspensão, não haverá cobrança de aluguel, retomando-se sua exigibilidade somente após a comunicação formal ao LOCATÁRIO de que o imóvel voltou a apresentar condições de habitabilidade. Permanecem de responsabilidade do LOCATÁRIO as despesas de consumo que eventualmente continuarem sendo geradas e que sejam de sua obrigação contratual, salvo disposição legal em contrário." },

      { t: "clausula", texto: "CLÁUSULA 17ª – ENCHENTE, ALAGAMENTO E CASO FORTUITO OU FORÇA MAIOR" },
      { t: "p", texto: "As partes reconhecem que eventos de enchente, alagamento, inundação ou quaisquer outros fenômenos naturais caracterizados como caso fortuito ou força maior são imprevisíveis e alheios à vontade do PROPRIETÁRIO e da IMOBILIÁRIA ADMINISTRADORA. A IMOBILIÁRIA ADMINISTRADORA e o PROPRIETÁRIO não se responsabilizam por danos, perdas ou prejuízos sofridos pelo LOCATÁRIO em seus móveis, eletrodomésticos, eletroeletrônicos, objetos pessoais, mercadorias, documentos ou quaisquer outros bens existentes no imóvel em decorrência de enchente, alagamento ou eventos da natureza." },
      { t: "p", texto: "Na hipótese de o imóvel tornar-se total ou parcialmente inabitável em razão de enchente ou alagamento, devidamente constatado pelo PROPRIETÁRIO ou pela IMOBILIÁRIA ADMINISTRADORA, ficará suspensa a exigibilidade do pagamento do aluguel a partir da data em que o imóvel for considerado inabitável, permanecendo a suspensão até que sejam concluídos os reparos indispensáveis e o imóvel seja novamente considerado habitável. Durante o período de suspensão, não haverá cobrança de aluguel, retomando-se sua exigibilidade somente após a comunicação formal ao LOCATÁRIO de que o imóvel voltou a apresentar condições de habitabilidade. Permanecem de responsabilidade do LOCATÁRIO as despesas de consumo que eventualmente continuarem sendo geradas e que sejam de sua obrigação contratual, salvo disposição legal em contrário." },

      { t: "espaco" },
      { t: "p", texto: `${e.cidade_assinatura}, ${dataPorExtenso(txt(v, "data_assinatura"))}.` },
      { t: "assinaturas", pessoas: [
        { nome: e.nome_curto, linhas: ["EMPREENDIMENTOS IMOBILIARIOS- LTDA"] },
        { nome: txt(v, "locatario_nome").toUpperCase(), linhas: [`CPF ${txt(v, "locatario_cpf")}`] },
        ...(sim(v, "tem_fiador") ? [{ nome: txt(v, "fiador_nome").toUpperCase(), linhas: [`CPF ${txt(v, "fiador_cpf")}`] }] : []),
      ] },
    );
    return blocos;
  },
};
