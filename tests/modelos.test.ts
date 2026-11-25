import { describe, expect, it } from "vitest";
import { MODELOS, buscarModelo } from "../lib/modelos";
import { validarValores, partesMarcadas, flexionar, qualificacao } from "../lib/modelos/tipos";
import { gerarPdf } from "../lib/modelos/gerar-pdf";

import { EMPRESA_TESTE, EXEMPLOS } from "./fixtures/modelos";

describe("modelos de documento", () => {
  it("todos os modelos têm exemplo de teste e ids únicos", () => {
    expect(new Set(MODELOS.map((m) => m.id)).size).toBe(MODELOS.length);
    for (const m of MODELOS) expect(EXEMPLOS[m.id], m.id).toBeDefined();
  });

  it.each(MODELOS.map((m) => [m.id]))("%s: exemplo completo passa na validação e gera PDF", async (id) => {
    const m = buscarModelo(id)!;
    expect(validarValores(m, EXEMPLOS[id])).toEqual([]);
    const pdf = await gerarPdf(m, EXEMPLOS[id], EMPRESA_TESTE);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(5000);
  });

  it("aponta campos obrigatórios vazios", () => {
    const erros = validarValores(buscarModelo("contrato_locacao")!, {});
    expect(erros.join(" ")).toMatch(/Nome completo/);
    expect(erros.join(" ")).toMatch(/Início/);
  });

  it("campos do fiador só são exigidos com fiador marcado", () => {
    const m = buscarModelo("contrato_locacao")!;
    const semFiador = { ...EXEMPLOS.contrato_locacao, tem_fiador: false, fiador_nome: "", fiador_cpf: "" };
    expect(validarValores(m, semFiador)).toEqual([]);
    expect(validarValores(m, { ...semFiador, tem_fiador: true }).join(" ")).toMatch(/Fiador/);
  });

  it("notificação exige pelo menos um débito", () => {
    const m = buscarModelo("notificacao_extrajudicial")!;
    expect(validarValores(m, { ...EXEMPLOS.notificacao_extrajudicial, debitos: [] }).join(" ")).toMatch(/débito/);
  });

  it("texto do contrato: cláusula 4 renumerada sem o fundo e finalidade comercial", () => {
    const m = buscarModelo("contrato_locacao")!;
    const blocos = m.montar({ ...EXEMPLOS.contrato_locacao, tem_fundo: false, finalidade: "comercial" }, EMPRESA_TESTE);
    const tudo = blocos.map((b) => ("texto" in b ? b.texto : "")).join("\n");
    expect(tudo).toContain("CONTRATO DE LOCAÇÃO DE IMÓVEL COMERCIAL");
    expect(tudo).toContain("fins de uso comercial");
    expect(tudo).not.toContain("Fundo de Conservação");
    expect(tudo).toContain("**4.2 - Os demais alugueis será pago até o dia 20");
    expect(tudo).toContain("R$ 1.200,00 (mil e duzentos reais), incluso água e taxa de lixo");
    expect(tudo).toContain("com início em 18 de Novembro de 2026 a 18 de Novembro de 2027");
    expect(tudo).toContain("no dia **18.11.27**");
  });

  it("texto digitado não quebra o negrito", () => {
    const v = { ...EXEMPLOS.termo_entrega_chaves, inquilino_nome: "**Maria**" };
    const blocos = buscarModelo("termo_entrega_chaves")!.montar(v, EMPRESA_TESTE);
    const p = blocos.find((b) => b.t === "p" && b.texto.includes("contrato de locação de"));
    expect(p && "texto" in p && p.texto).toContain("**MARIA.**");
  });
});

describe("ajudantes de texto", () => {
  it("separa negrito", () => {
    expect(partesMarcadas("a **b** c")).toEqual([{ texto: "a ", negrito: false }, { texto: "b", negrito: true }, { texto: " c", negrito: false }]);
  });
  it("concordância de gênero", () => {
    expect(flexionar("solteiro(a)", "feminino")).toBe("Solteira");
    expect(flexionar("casado(a)", "masculino")).toBe("Casado");
    expect(flexionar("Brasileiro(a)", "feminino")).toBe("Brasileira");
    const q = qualificacao(EXEMPLOS.contrato_locacao, "locatario");
    expect(q).toContain("Portadora do **RG sob N° 1.234.567 SESP PR,** e Inscrita no **CPF sob N° 529.982.247-25.**");
    expect(q).toContain("Residente e domiciliada na Rua Exemplo, 10, Centro, Cidade Exemplo PR, CEP 84600-000.");
  });
});
