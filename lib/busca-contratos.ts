// Monta o WHERE da listagem de contratos e da busca global.
// Função pura (sem acesso ao banco) para poder ser testada. Os aliases esperados na query são:
//   l = locacoes, i = imoveis, inq = clientes (inquilino), prop = clientes (proprietário)
import { escaparLike } from "./texto";
import { STATUS_CONTRATO, FINALIDADES } from "./contratos";

export interface FiltrosContrato {
  q?: string;            // caixa única: procura em todos os campos abaixo
  codigo?: string;       // código do contrato ou do imóvel
  inquilino?: string;
  proprietario?: string;
  endereco?: string;
  status?: string;
  finalidade?: string;
  corretor?: string;
  reajuste_de?: string;  // YYYY-MM-DD
  reajuste_ate?: string; // YYYY-MM-DD
  pagina?: number;
  por_pagina?: number;
}

// Expressões de texto pesquisável. Batem com os índices trigram da migração 001.
const CAMPO = {
  codigoContrato: "f_busca(l.codigo)",
  codigoImovel: "f_busca(i.codigo)",
  legado: "f_busca(coalesce(l.imovel_codigo_legado,'') || ' ' || coalesce(l.imovel_endereco_legado,''))",
  enderecoImovel: "f_busca(coalesce(i.endereco,'') || ' ' || coalesce(i.bairro,'') || ' ' || coalesce(i.cidade,''))",
  tituloImovel: "f_busca(i.titulo)",
  inquilino: "f_busca(coalesce(inq.nome, l.locatario_nome))",
  proprietario: "f_busca(prop.nome)",
  pasta: "f_busca(l.numero_pasta)",
};

export const EXPRESSAO_PROXIMO_REAJUSTE = "f_proximo_reajuste(l.data_inicio, l.periodo_reajuste_meses, CURRENT_DATE)";

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

export function montarFiltroContratos(f: FiltrosContrato) {
  const condicoes: string[] = [];
  const params: unknown[] = [];

  const termo = (valor: string) => {
    params.push(`%${escaparLike(valor.trim())}%`);
    return `f_busca($${params.length})`;
  };
  const contem = (campos: string[], valor?: string) => {
    if (!valor || !valor.trim()) return;
    const p = termo(valor);
    condicoes.push(`(${campos.map((c) => `${c} LIKE ${p}`).join(" OR ")})`);
  };

  contem(Object.values(CAMPO), f.q);
  contem([CAMPO.codigoContrato, CAMPO.codigoImovel, CAMPO.legado], f.codigo);
  contem([CAMPO.inquilino], f.inquilino);
  contem([CAMPO.proprietario], f.proprietario);
  contem([CAMPO.enderecoImovel, CAMPO.legado, CAMPO.tituloImovel], f.endereco);

  if (f.status && (STATUS_CONTRATO as readonly string[]).includes(f.status)) {
    params.push(f.status);
    condicoes.push(`l.status = $${params.length}`);
  }
  if (f.finalidade && (FINALIDADES as readonly string[]).includes(f.finalidade)) {
    params.push(f.finalidade);
    condicoes.push(`l.finalidade = $${params.length}`);
  }
  if (f.corretor && f.corretor.trim()) {
    params.push(f.corretor.trim().toLowerCase());
    condicoes.push(`lower(l.corretor_responsavel) = $${params.length}`);
  }
  if (f.reajuste_de && RE_DATA.test(f.reajuste_de)) {
    params.push(f.reajuste_de);
    condicoes.push(`${EXPRESSAO_PROXIMO_REAJUSTE} >= $${params.length}::date`);
  }
  if (f.reajuste_ate && RE_DATA.test(f.reajuste_ate)) {
    params.push(f.reajuste_ate);
    condicoes.push(`${EXPRESSAO_PROXIMO_REAJUSTE} <= $${params.length}::date`);
  }

  const porPagina = Math.min(100, Math.max(1, Math.floor(Number(f.por_pagina) || 20)));
  const pagina = Math.max(1, Math.floor(Number(f.pagina) || 1));

  return {
    where: condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "",
    params,
    porPagina,
    pagina,
    offset: (pagina - 1) * porPagina,
  };
}

export function filtrosDaUrl(searchParams: URLSearchParams): FiltrosContrato {
  const g = (k: string) => searchParams.get(k) || undefined;
  return {
    q: g("q"),
    codigo: g("codigo"),
    inquilino: g("inquilino"),
    proprietario: g("proprietario"),
    endereco: g("endereco"),
    status: g("status"),
    finalidade: g("finalidade"),
    corretor: g("corretor"),
    reajuste_de: g("reajuste_de"),
    reajuste_ate: g("reajuste_ate"),
    pagina: Number(g("pagina")) || 1,
    por_pagina: Number(g("por_pagina")) || 20,
  };
}
