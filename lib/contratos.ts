// Regras do contrato de locação (validação e normalização). Funções puras: usadas na API e nos testes.
import { apenasDigitos } from "./texto";
import { erroCpfCnpj } from "./clientes";

export const STATUS_CONTRATO = ["ativo", "encerrado", "rescindido"] as const;
export const FINALIDADES = ["residencial", "comercial"] as const;
export const ORIGENS = ["sistema", "legado"] as const;
export const TIPOS_CONTRATO = ["locacao", "venda"] as const;
export type TipoContrato = (typeof TIPOS_CONTRATO)[number];
export const ROTULO_TIPO: Record<TipoContrato, string> = { locacao: "Locação", venda: "Venda" };

export type StatusContrato = (typeof STATUS_CONTRATO)[number];
export type Finalidade = (typeof FINALIDADES)[number];
export type Origem = (typeof ORIGENS)[number];

export const ROTULO_STATUS: Record<StatusContrato, string> = {
  ativo: "Ativo",
  encerrado: "Encerrado",
  rescindido: "Rescindido",
};

// Na venda os mesmos três status têm outro significado.
export const ROTULO_STATUS_VENDA: Record<StatusContrato, string> = {
  ativo: "Em andamento",
  encerrado: "Concluída",
  rescindido: "Cancelada",
};

export function rotuloStatus(status: string, tipo: string | null | undefined): string {
  const mapa = tipo === "venda" ? ROTULO_STATUS_VENDA : ROTULO_STATUS;
  return mapa[status as StatusContrato] ?? status;
}

export interface NovoCliente {
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
}

export interface DadosContrato {
  tipo: TipoContrato;
  valor_venda: number | null;
  forma_pagamento: string | null;
  honorarios_percentual: number | null;
  codigo: string | null;
  origem: Origem;
  status: StatusContrato;
  imovel_id: number | null;
  imovel_codigo_legado: string | null;
  imovel_endereco_legado: string | null;
  inquilino_id: number | null;
  novo_inquilino: NovoCliente | null;
  proprietario_id: number | null;
  novo_proprietario: NovoCliente | null;
  valor_aluguel: number;
  dia_vencimento: number;
  data_inicio: string | null;
  data_fim: string | null;
  data_entrega_chaves: string | null;
  periodo_reajuste_meses: number;
  corretor_responsavel: string | null;
  finalidade: Finalidade | null;
  numero_pasta: string | null;
  observacoes: string | null;
}

export type ResultadoValidacao = { ok: true; dados: DadosContrato } | { ok: false; erros: string[] };

function texto(valor: unknown, max: number): string | null {
  if (valor === null || valor === undefined) return null;
  const s = String(valor).trim().replace(/\s+/g, " ");
  return s ? s.slice(0, max) : null;
}

function inteiro(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

function data(valor: unknown): string | null | "invalida" {
  const s = texto(valor, 10);
  if (!s) return null;
  if (!RE_DATA.test(s)) return "invalida";
  const d = new Date(`${s}T00:00:00Z`);
  return isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? "invalida" : s;
}

function novoCliente(valor: unknown, erros: string[], papel: string): NovoCliente | null {
  if (!valor || typeof valor !== "object") return null;
  const v = valor as Record<string, unknown>;
  const nome = texto(v.nome, 255);
  if (!nome) return null;
  const doc = apenasDigitos(String(v.cpf_cnpj ?? ""));
  const erroDoc = erroCpfCnpj(doc, papel);
  if (erroDoc) erros.push(erroDoc);
  return {
    nome,
    cpf_cnpj: doc || null,
    telefone: texto(v.telefone, 50),
    email: texto(v.email, 255),
  };
}

export function validarContrato(body: unknown): ResultadoValidacao {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const erros: string[] = [];

  const tipo: TipoContrato = b.tipo === "venda" ? "venda" : "locacao";
  const venda = tipo === "venda";
  const origem = (ORIGENS as readonly string[]).includes(String(b.origem)) ? (b.origem as Origem) : "sistema";
  const status = (STATUS_CONTRATO as readonly string[]).includes(String(b.status)) ? (b.status as StatusContrato) : "ativo";
  const finalidadeTxt = texto(b.finalidade, 20);
  let finalidade: Finalidade | null = null;
  if (finalidadeTxt) {
    if ((FINALIDADES as readonly string[]).includes(finalidadeTxt)) finalidade = finalidadeTxt as Finalidade;
    else erros.push("Finalidade deve ser residencial ou comercial.");
  }

  const codigoTxt = texto(b.codigo, 30);
  const codigo = codigoTxt ? codigoTxt.toUpperCase() : null;
  if (codigo && !/^[A-Z0-9][A-Z0-9.\-/ ]*$/.test(codigo)) {
    erros.push("Código do contrato aceita só letras, números, ponto, hífen e barra.");
  }

  const imovel_id = inteiro(b.imovel_id);
  const imovel_codigo_legado = imovel_id ? null : texto(b.imovel_codigo_legado, 50);
  const imovel_endereco_legado = imovel_id ? null : texto(b.imovel_endereco_legado, 255);

  const inquilino_id = inteiro(b.inquilino_id);
  const novo_inquilino = inquilino_id ? null : novoCliente(b.novo_inquilino, erros, "inquilino");
  const proprietario_id = inteiro(b.proprietario_id);
  const novo_proprietario = proprietario_id ? null : novoCliente(b.novo_proprietario, erros, "proprietário");

  const valorNum = b.valor_aluguel === "" || b.valor_aluguel == null ? 0 : Number(b.valor_aluguel);
  if (!venda && (!Number.isFinite(valorNum) || valorNum < 0)) erros.push("Valor do aluguel inválido.");
  const valor_aluguel = !venda && Number.isFinite(valorNum) && valorNum >= 0 ? Math.round(valorNum * 100) / 100 : 0;

  // Campos próprios da venda
  const vendaNum = b.valor_venda === "" || b.valor_venda == null ? 0 : Number(b.valor_venda);
  if (venda && (!Number.isFinite(vendaNum) || vendaNum < 0)) erros.push("Valor da venda inválido.");
  const valor_venda = venda && Number.isFinite(vendaNum) && vendaNum > 0 ? Math.round(vendaNum * 100) / 100 : null;
  const honorNum = b.honorarios_percentual === "" || b.honorarios_percentual == null ? null : Number(b.honorarios_percentual);
  if (venda && honorNum !== null && (!Number.isFinite(honorNum) || honorNum < 0 || honorNum > 100)) erros.push("Honorários devem estar entre 0% e 100%.");
  const honorarios_percentual = venda && honorNum !== null && Number.isFinite(honorNum) && honorNum >= 0 && honorNum <= 100 ? honorNum : null;

  // Vencimento e reajuste só existem na locação; na venda ficam nos valores padrão.
  const dia = venda || b.dia_vencimento === "" || b.dia_vencimento == null ? 10 : Number(b.dia_vencimento);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) erros.push("Dia de vencimento deve ser entre 1 e 31.");

  const periodo = venda || b.periodo_reajuste_meses === "" || b.periodo_reajuste_meses == null ? 12 : Number(b.periodo_reajuste_meses);
  if (!Number.isInteger(periodo) || periodo < 1 || periodo > 120) erros.push("Período de reajuste deve ser entre 1 e 120 meses.");

  const datas = {
    data_inicio: data(b.data_inicio),
    data_fim: data(b.data_fim),
    data_entrega_chaves: data(b.data_entrega_chaves),
  };
  const nomesData: Record<string, string> = {
    data_inicio: venda ? "Data do contrato" : "Início",
    data_fim: venda ? "Prazo final" : "Término",
    data_entrega_chaves: "Entrega das chaves",
  };
  for (const [campo, v] of Object.entries(datas)) {
    if (v === "invalida") erros.push(`Data inválida em "${nomesData[campo]}".`);
  }
  const ok = (v: string | null | "invalida") => (v === "invalida" ? null : v);
  const data_inicio = ok(datas.data_inicio);
  const data_fim = ok(datas.data_fim);
  if (data_inicio && data_fim && data_fim < data_inicio) erros.push(venda ? "O prazo final não pode ser antes da data do contrato." : "O término não pode ser antes do início.");

  // Vínculos obrigatórios (na venda o "inquilino" é o comprador e o "proprietário" é o vendedor)
  if (!inquilino_id && !novo_inquilino) erros.push(venda ? "Informe o comprador." : "Informe o inquilino.");
  if (origem === "sistema") {
    if (!imovel_id) erros.push("Selecione o imóvel.");
    if (!data_inicio) erros.push(venda ? "Informe a data do contrato." : "Informe a data de início.");
    if (venda ? !valor_venda : valor_aluguel <= 0) erros.push(venda ? "Informe o valor da venda." : "Informe o valor do aluguel.");
  } else {
    if (!codigo) erros.push("Contrato antigo precisa do código que está na lista impressa.");
    if (!imovel_id && !imovel_codigo_legado && !imovel_endereco_legado) {
      erros.push("Informe o imóvel (selecione um cadastrado ou digite o código/endereço).");
    }
  }

  if (erros.length) return { ok: false, erros };

  return {
    ok: true,
    dados: {
      tipo,
      valor_venda,
      forma_pagamento: venda ? texto(b.forma_pagamento, 2000) : null,
      honorarios_percentual,
      codigo,
      origem,
      status,
      imovel_id,
      imovel_codigo_legado,
      imovel_endereco_legado,
      inquilino_id,
      novo_inquilino,
      proprietario_id,
      novo_proprietario,
      valor_aluguel,
      dia_vencimento: dia,
      data_inicio,
      data_fim,
      data_entrega_chaves: ok(datas.data_entrega_chaves),
      periodo_reajuste_meses: periodo,
      corretor_responsavel: texto(b.corretor_responsavel, 100),
      finalidade,
      numero_pasta: texto(b.numero_pasta, 30),
      observacoes: texto(b.observacoes, 5000),
    },
  };
}

// Código gerado para contratos novos sem código informado.
export function codigoAutomatico(id: number, tipo: TipoContrato = "locacao"): string {
  return `${tipo === "venda" ? "VD" : "CT"}-${String(id).padStart(5, "0")}`;
}

// Finalidade sugerida a partir do tipo do imóvel do site.
export function finalidadePorTipo(tipo: string | null | undefined): Finalidade {
  const t = (tipo || "").toLowerCase();
  return /comercial|barrac|sala|loja|galp/.test(t) ? "comercial" : "residencial";
}
