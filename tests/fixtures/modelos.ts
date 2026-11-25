import type { Empresa, Valores } from "../../lib/modelos/tipos";

// Somente dados fictícios.
export const EMPRESA_TESTE: Empresa = {
  razao_social: "IMOBILIÁRIA EXEMPLO – EMPREENDIMENTOS IMOBILIÁRIOS LTDA",
  nome_curto: "IMOBILIÁRIA EXEMPLO",
  cnpj: "00.000.000/0001-91",
  creci_pj: "PR/J00000",
  sede: "Rua Fictícia, nº 100, Centro, da cidade de Cidade Exemplo no estado do Paraná",
  cidade_assinatura: "Cidade Exemplo – PR",
  foro: "Cidade Exemplo/PR",
  pix: "00.000.000/0001-91",
  representante_nome: "FULANO DE TAL",
  representante_profissao: "corretor de Imóveis",
  representante_rg: "0000000-0 – SSP/PR",
  representante_cpf: "000.000.001-91",
  representante_creci: "00.000",
  representante_domicilio: "residente e domiciliado nesta cidade de Cidade Exemplo-PR",
};

const pessoa = (p: string): Valores => ({
  [`${p}_nome`]: "Maria Fictícia da Silva", [`${p}_genero`]: "feminino", [`${p}_nacionalidade`]: "Brasileiro(a)",
  [`${p}_estado_civil`]: "solteiro(a)", [`${p}_profissao`]: "Professora", [`${p}_rg`]: "1.234.567 SESP PR",
  [`${p}_cpf`]: "529.982.247-25", [`${p}_celular`]: "(42) 90000-0000", [`${p}_endereco`]: "Rua Exemplo, 10, Centro, Cidade Exemplo PR",
  [`${p}_cep`]: "84600-000", [`${p}_pix`]: "maria@exemplo.com",
});

const debitos = [{ descricao: "Aluguel", vencimento: "2026-10-04", valor: 2300 }, { descricao: "Aluguel", vencimento: "2026-11-04", valor: 2300 }];

export const EXEMPLOS: Record<string, Valores> = {
  contrato_locacao: {
    finalidade: "residencial", data_assinatura: "2026-11-18", ...pessoa("locatario"), tem_fiador: true, ...pessoa("fiador"),
    imovel_descricao: "CASA de alvenaria", imovel_endereco: "Rua Fictícia, 166, Centro, Cidade Exemplo PR", imovel_cep: "84600-000",
    prazo_meses: 12, data_inicio: "2026-11-18", valor_aluguel: 1200, aluguel_inclusos: "água e taxa de lixo", dia_vencimento: 20,
    multa_transferencia: 10, tem_fundo: true, fundo_parcelas: 11, fundo_valor: 109.09,
  },
  termo_entrega_chaves: {
    data_assinatura: "2026-10-29", entregador_nome: "João Fictício", entregador_cpf: "529.982.247-25",
    chaves_descricao: "duas chaves e um controle", imovel_endereco: "Rua Fictícia, 576, Apto 11, Centro", inquilino_nome: "Maria Fictícia",
  },
  notificacao_falta_pagamento: {
    data_assinatura: "2026-11-06", notificado_nome: "João Fictício", notificado_cpf: "529.982.247-25", imovel_endereco: "Rua Fictícia, 39", debitos,
  },
  notificacao_extrajudicial: {
    data_assinatura: "2026-11-16", notificado_nome: "João Fictício", notificado_genero: "masculino", notificado_cpf: "529.982.247-25",
    imovel_endereco: "Rua Fictícia, nº 39, Bairro Exemplo", prazo_dias: 15, debitos,
  },
  administracao_locacao: {
    data_assinatura: "2026-11-13", ...pessoa("proprietario"), imovel_finalidade: "comercial", imovel_tipo: "BARRACÃO",
    imovel_endereco: "Rua Fictícia, 200, Bairro Exemplo, Cidade Exemplo PR", prazo_maximo_locacao: 24, aluguel_minimo: 2500,
    comissao_percentual: 10, vigencia_meses: 24,
  },
  intermediacao_venda: {
    data_assinatura: "2026-11-16", ...pessoa("proprietario"), objeto_resumo: "UM APARTAMENTO", imovel_endereco: "Rua Fictícia, 700, apto 05",
    imovel_descricao: "02 dormitórios, sala, cozinha", matricula: "00.000", exclusividade: "sem", valor_venda: 260000,
    honorarios_percentual: 6, vigencia_dias: 365, data_inicio: "2026-11-06",
  },
};
