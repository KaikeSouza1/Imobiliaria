import { describe, expect, it } from "vitest";
import { cpfValido, cnpjValido, erroCpfCnpj, validarCliente, enderecoCompleto } from "../lib/clientes";
import { validarContrato } from "../lib/contratos";

// Documentos fictícios gerados apenas para teste (dígitos verificadores válidos).
const CPF_OK = "529.982.247-25";
const CNPJ_OK = "11.222.333/0001-81";

describe("CPF e CNPJ", () => {
  it("aceita dígitos verificadores corretos", () => {
    expect(cpfValido(CPF_OK)).toBe(true);
    expect(cnpjValido(CNPJ_OK)).toBe(true);
  });
  it("recusa dígito errado e sequências repetidas", () => {
    expect(cpfValido("529.982.247-24")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cnpjValido("11.222.333/0001-80")).toBe(false);
    expect(cnpjValido("00000000000000")).toBe(false);
  });
  it("mensagem clara para cada caso", () => {
    expect(erroCpfCnpj("")).toBeNull();
    expect(erroCpfCnpj("123")).toMatch(/11 \(CPF\) ou 14 \(CNPJ\)/);
    expect(erroCpfCnpj("529.982.247-24")).toMatch(/CPF inválido/);
    expect(erroCpfCnpj("11222333000180", "proprietário")).toMatch(/CNPJ do proprietário inválido/);
  });
  it("contrato também confere o dígito do CPF do novo inquilino", () => {
    const r = validarContrato({ imovel_id: 1, valor_aluguel: 1, data_inicio: "2026-01-01", novo_inquilino: { nome: "A B", cpf_cnpj: "529.982.247-24" } });
    expect(!r.ok && r.erros.join()).toMatch(/CPF do inquilino inválido/);
  });
});

describe("validarCliente", () => {
  const base = { nome: "Maria Fictícia", eh_inquilino: true };
  it("aceita cadastro mínimo e normaliza", () => {
    const r = validarCliente({ ...base, cpf_cnpj: CPF_OK, email: " MARIA@Exemplo.COM ", uf: "pr", cep: "84600-000" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dados.cpf_cnpj).toBe("52998224725");
    expect(r.dados.email).toBe("maria@exemplo.com");
    expect(r.dados.uf).toBe("PR");
    expect(r.dados.cep).toBe("84600000");
    expect(r.dados.eh_proprietario).toBe(false);
  });
  it("exige nome e pelo menos um tipo", () => {
    const r = validarCliente({ nome: "A" });
    expect(!r.ok && r.erros).toEqual(expect.arrayContaining(["Informe o nome completo.", "Marque se a pessoa é inquilina, proprietária ou as duas coisas."]));
  });
  it("recusa e-mail, CEP, UF, estado civil e nascimento inválidos", () => {
    const r = validarCliente({ ...base, email: "x@", cep: "123", uf: "XX", estado_civil: "enrolado", data_nascimento: "2999-01-01" });
    expect(!r.ok && r.erros.length).toBe(5);
  });
  it("monta o endereço completo", () => {
    expect(enderecoCompleto({ logradouro: "Rua A", numero: "10", bairro: "Centro", cidade: "União da Vitória", uf: "PR", cep: "84600000" }))
      .toBe("Rua A, 10 · Centro · União da Vitória/PR · CEP 84600-000");
  });
});
