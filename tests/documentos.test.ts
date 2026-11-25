import { describe, expect, it, beforeAll } from "vitest";
import {
  ehPdf, sanitizarNomeOriginal, validarPedidoEnvio, contentDisposition, TAMANHO_MAXIMO_DOCUMENTO,
} from "../lib/documentos";
import { criarTokenEnvio, lerTokenEnvio } from "../lib/token-envio";

const bytes = (s: string) => new TextEncoder().encode(s);

describe("ehPdf (tipo real do arquivo)", () => {
  it("reconhece PDF pela assinatura", () => {
    expect(ehPdf(bytes("%PDF-1.7\n..."))).toBe(true);
  });
  it("tolera bytes antes da assinatura (até 1024)", () => {
    expect(ehPdf(bytes(" ".repeat(500) + "%PDF-1.4"))).toBe(true);
    expect(ehPdf(bytes(" ".repeat(2000) + "%PDF-1.4"))).toBe(false);
  });
  it("recusa imagem, executável e texto renomeados para .pdf", () => {
    expect(ehPdf(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(false); // JPEG
    expect(ehPdf(bytes("MZ\x90\x00"))).toBe(false); // EXE
    expect(ehPdf(bytes("<html>%PD"))).toBe(false);
    expect(ehPdf(new Uint8Array())).toBe(false);
  });
});

describe("sanitizarNomeOriginal", () => {
  it("remove caminho, caracteres perigosos e mantém acentos", () => {
    expect(sanitizarNomeOriginal("C:\\Users\\x\\Contrato São João.pdf")).toBe("Contrato São João.pdf");
    expect(sanitizarNomeOriginal("../../etc/passwd")).toBe("passwd.pdf");
    expect(sanitizarNomeOriginal('a<b>:"c|?*.pdf')).toBe("abc.pdf");
    expect(sanitizarNomeOriginal("\u0000\u001f")).toBe("documento.pdf");
    expect(sanitizarNomeOriginal("...oculto.pdf")).toBe("oculto.pdf");
  });
  it("limita o tamanho do nome", () => {
    expect(sanitizarNomeOriginal("a".repeat(500) + ".pdf").length).toBe(200);
  });
});

describe("validarPedidoEnvio", () => {
  const ok = { locacao_id: 3, tipo: "vistoria", nome: "vistoria.pdf", tamanho: 1000 };
  it("aceita pedido válido", () => {
    const r = validarPedidoEnvio(ok);
    expect(r.ok && r.vinculo).toEqual({ locacao_id: 3, cliente_id: null, imovel_id: null });
  });
  it("exige vínculo (sem arquivo solto)", () => {
    const r = validarPedidoEnvio({ ...ok, locacao_id: undefined });
    expect(!r.ok && r.erro).toMatch(/vinculado/);
  });
  it("recusa extensão diferente de PDF", () => {
    const r = validarPedidoEnvio({ ...ok, nome: "foto.jpg" });
    expect(!r.ok && r.erro).toMatch(/não é PDF/);
  });
  it("recusa arquivo acima do limite e vazio, com mensagem clara", () => {
    const r = validarPedidoEnvio({ ...ok, tamanho: TAMANHO_MAXIMO_DOCUMENTO + 1 });
    expect(!r.ok && r.erro).toMatch(/limite é 20 MB/);
    expect(validarPedidoEnvio({ ...ok, tamanho: 0 }).ok).toBe(false);
  });
  it("recusa tipo de documento desconhecido", () => {
    expect(validarPedidoEnvio({ ...ok, tipo: "qualquer" }).ok).toBe(false);
  });
});

describe("contentDisposition", () => {
  it("gera nome ASCII e UTF-8 sem aspas soltas", () => {
    const h = contentDisposition("attachment", 'Contrato "São" João.pdf');
    expect(h).toBe(`attachment; filename="Contrato _Sao_ Joao.pdf"; filename*=UTF-8''Contrato%20%22S%C3%A3o%22%20Jo%C3%A3o.pdf`);
  });
});

describe("token de envio", () => {
  beforeAll(() => { process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "segredo-de-teste"; });
  const dados = {
    chave: "documentos/00000000-0000-0000-0000-000000000000.pdf",
    nome: "a.pdf", tamanho: 10, tipo: "outro" as const,
    vinculo: { locacao_id: 1, cliente_id: null, imovel_id: null }, usuario: "ana",
  };
  it("lê o token do mesmo usuário", () => {
    expect(lerTokenEnvio(criarTokenEnvio(dados), "ana")?.chave).toBe(dados.chave);
  });
  it("recusa outro usuário, token alterado e expirado", () => {
    const t = criarTokenEnvio(dados);
    expect(lerTokenEnvio(t, "bruno")).toBeNull();
    const [corpo, assinatura] = t.split(".");
    const alterado = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(corpo, "base64url").toString()), tamanho: 999 })).toString("base64url");
    expect(lerTokenEnvio(`${alterado}.${assinatura}`, "ana")).toBeNull();
    expect(lerTokenEnvio(criarTokenEnvio(dados, -1), "ana")).toBeNull();
    expect(lerTokenEnvio("lixo", "ana")).toBeNull();
  });
});
