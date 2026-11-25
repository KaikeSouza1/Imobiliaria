import { describe, expect, it } from "vitest";
import { validarContrato, codigoAutomatico, finalidadePorTipo } from "../lib/contratos";

const base = {
  imovel_id: 10,
  novo_inquilino: { nome: "Inquilino Fictício", cpf_cnpj: "000.000.001-91" },
  valor_aluguel: "1500.50",
  data_inicio: "2026-01-10",
};

describe("validarContrato", () => {
  it("aceita um contrato novo completo e normaliza os campos", () => {
    const r = validarContrato({ ...base, codigo: " ct-1 ", corretor_responsavel: "  ana  " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dados.codigo).toBe("CT-1");
    expect(r.dados.origem).toBe("sistema");
    expect(r.dados.status).toBe("ativo");
    expect(r.dados.valor_aluguel).toBe(1500.5);
    expect(r.dados.periodo_reajuste_meses).toBe(12);
    expect(r.dados.novo_inquilino?.cpf_cnpj).toBe("00000000191");
    expect(r.dados.corretor_responsavel).toBe("ana");
  });

  it("contrato novo exige imóvel, inquilino, início e valor", () => {
    const r = validarContrato({});
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros).toEqual(
      expect.arrayContaining(["Informe o inquilino.", "Selecione o imóvel.", "Informe a data de início.", "Informe o valor do aluguel."])
    );
  });

  it("contrato antigo aceita só os dados da lista impressa", () => {
    const r = validarContrato({
      origem: "legado",
      codigo: "123",
      novo_inquilino: { nome: "Fulano Fictício" },
      imovel_codigo_legado: "A-55",
      valor_aluguel: "800",
      numero_pasta: "7",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dados.imovel_id).toBeNull();
    expect(r.dados.data_inicio).toBeNull();
    expect(r.dados.numero_pasta).toBe("7");
  });

  it("contrato antigo exige código e alguma identificação do imóvel", () => {
    const r = validarContrato({ origem: "legado", novo_inquilino: { nome: "X Y" } });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.join(" ")).toMatch(/código/);
    expect(r.erros.join(" ")).toMatch(/imóvel/);
  });

  it("ignora campos de imóvel antigo quando há imóvel cadastrado", () => {
    const r = validarContrato({ ...base, imovel_codigo_legado: "X" });
    expect(r.ok && r.dados.imovel_codigo_legado).toBeNull();
  });

  it("recusa datas inválidas e término antes do início", () => {
    const r1 = validarContrato({ ...base, data_fim: "2026-02-30" });
    expect(r1.ok).toBe(false);
    const r2 = validarContrato({ ...base, data_fim: "2025-12-31" });
    expect(!r2.ok && r2.erros).toContain("O término não pode ser antes do início.");
  });

  it("recusa CPF/CNPJ com tamanho errado, valores negativos e finalidade desconhecida", () => {
    const r = validarContrato({
      ...base,
      novo_inquilino: { nome: "A B", cpf_cnpj: "123" },
      valor_aluguel: "-1",
      finalidade: "industrial",
      periodo_reajuste_meses: "0",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erros.length).toBeGreaterThanOrEqual(4);
  });

  it("prefere o cliente existente ao novo quando os dois vêm", () => {
    const r = validarContrato({ ...base, inquilino_id: 5 });
    expect(r.ok && r.dados.inquilino_id).toBe(5);
    expect(r.ok && r.dados.novo_inquilino).toBeNull();
  });

  it("status desconhecido vira ativo; código com caractere estranho é recusado", () => {
    expect(validarContrato({ ...base, status: "xpto" }).ok && true).toBe(true);
    expect(validarContrato({ ...base, codigo: "CT<script>" }).ok).toBe(false);
  });
});

describe("auxiliares", () => {
  it("gera código automático com zeros à esquerda", () => {
    expect(codigoAutomatico(42)).toBe("CT-00042");
  });
  it("sugere finalidade pelo tipo do imóvel", () => {
    expect(finalidadePorTipo("Comercial")).toBe("comercial");
    expect(finalidadePorTipo("Barracão")).toBe("comercial");
    expect(finalidadePorTipo("Apartamento")).toBe("residencial");
  });
});
