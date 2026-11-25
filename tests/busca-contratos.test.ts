import { describe, expect, it } from "vitest";
import { montarFiltroContratos, filtrosDaUrl, separarPalavras } from "../lib/busca-contratos";
import { normalizarBusca, escaparLike, mesesEntre, descreverPrazo, mascararCpfCnpj, formatarData } from "../lib/texto";

describe("montarFiltroContratos", () => {
  it("sem filtros não gera WHERE e usa paginação padrão", () => {
    const r = montarFiltroContratos({});
    expect(r.where).toBe("");
    expect(r.params).toEqual([]);
    expect(r.porPagina).toBe(20);
    expect(r.offset).toBe(0);
  });

  it("busca geral usa o campo único indexado, uma condição por palavra", () => {
    const r = montarFiltroContratos({ q: "  maria   flores " });
    expect(r.params).toEqual(["%maria%", "%flores%"]);
    expect(r.where).toBe("WHERE l.texto_busca LIKE f_busca($1) AND l.texto_busca LIKE f_busca($2)");
  });

  it("filtro específico exige cada palavra em algum dos campos dele", () => {
    const r = montarFiltroContratos({ inquilino: "joao silva" });
    expect(r.where).toBe(
      "WHERE l.texto_busca LIKE f_busca($1) AND f_busca(coalesce(inq.nome, l.locatario_nome)) LIKE f_busca($1)" +
        " AND l.texto_busca LIKE f_busca($2) AND f_busca(coalesce(inq.nome, l.locatario_nome)) LIKE f_busca($2)"
    );
    const c = montarFiltroContratos({ codigo: "A1" });
    expect(c.where).toContain("f_busca(l.codigo) LIKE f_busca($1) OR f_busca(i.codigo) LIKE f_busca($1)");
  });

  it("valores do usuário nunca entram no SQL, só nos parâmetros", () => {
    const malicioso = "'; DROP TABLE locacoes; --";
    const r = montarFiltroContratos({ q: malicioso, inquilino: malicioso, corretor: malicioso });
    expect(r.where).not.toContain("DROP");
    expect(r.where).not.toContain("'");
    expect(r.params.some((p) => /drop/i.test(String(p)))).toBe(true);
  });

  it("limita a 8 palavras", () => {
    expect(separarPalavras("a b c d e f g h i j")).toHaveLength(8);
    expect(separarPalavras("   ")).toEqual([]);
  });

  it("escapa curingas do LIKE", () => {
    const r = montarFiltroContratos({ codigo: "10%_a" });
    expect(r.params[0]).toBe("%10\\%\\_a%");
  });

  it("combina filtros com AND e numera os parâmetros em ordem", () => {
    const r = montarFiltroContratos({ inquilino: "ana", status: "ativo", reajuste_de: "2026-01-01", reajuste_ate: "2026-12-31" });
    expect(r.params).toEqual(["%ana%", "ativo", "2026-01-01", "2026-12-31"]);
    expect(r.where.split(" AND ")).toHaveLength(5); // inquilino = pré-filtro indexado + campo exato
    expect(r.where).toContain("l.status = $2");
    expect(r.where).toContain("f_proximo_reajuste(l.data_inicio, l.periodo_reajuste_meses, CURRENT_DATE) >= $3::date");
  });

  it("ignora status, finalidade e datas inválidos", () => {
    const r = montarFiltroContratos({ status: "hackeado", finalidade: "x", reajuste_de: "amanhã" });
    expect(r.where).toBe("");
  });

  it("limita a paginação", () => {
    const r = montarFiltroContratos({ pagina: 3, por_pagina: 500 });
    expect(r.porPagina).toBe(100);
    expect(r.offset).toBe(200);
    expect(montarFiltroContratos({ pagina: -2 }).pagina).toBe(1);
  });

  it("filtra por pessoa (inquilina ou proprietária) e por imóvel", () => {
    const r = montarFiltroContratos({ cliente_id: 7, imovel_id: 9 });
    expect(r.params).toEqual([7, 9]);
    expect(r.where).toContain("(l.inquilino_id = $1 OR l.proprietario_id = $1)");
    expect(r.where).toContain("l.imovel_id = $2");
    expect(montarFiltroContratos({ cliente_id: -1, imovel_id: 1.5 }).where).toBe("");
  });

  it("lê os filtros da URL", () => {
    const f = filtrosDaUrl(new URLSearchParams("q=Silva&status=ativo&pagina=2"));
    expect(f).toMatchObject({ q: "Silva", status: "ativo", pagina: 2, codigo: undefined });
  });
});

describe("texto", () => {
  it("normaliza como a f_busca do banco", () => {
    expect(normalizarBusca("  JOSÉ da Conceição ")).toBe("jose da conceicao");
  });
  it("escapa barra invertida também", () => {
    expect(escaparLike("a\\b")).toBe("a\\\\b");
  });
  it("calcula e descreve o prazo do contrato", () => {
    expect(mesesEntre("2026-01-01", "2026-12-31")).toBe(12);
    expect(mesesEntre("2026-01-10", "2028-07-10")).toBe(30);
    expect(mesesEntre(null, "2026-01-01")).toBeNull();
    expect(descreverPrazo(30)).toBe("2 anos e 6 meses");
    expect(descreverPrazo(1)).toBe("1 mês");
  });
  it("mascara CPF e formata data sem fuso", () => {
    expect(mascararCpfCnpj("00000000191")).toBe("***.000.001-**");
    expect(formatarData("2026-03-01T00:00:00.000Z")).toBe("01/03/2026");
  });
});
