import { describe, expect, it } from "vitest";
import { podeUsarModuloContratos, rotaDoModuloContratos } from "../lib/permissoes";

describe("acesso ao módulo de contratos", () => {
  it("libera só os usuários da lista, sem diferenciar maiúsculas", () => {
    expect(podeUsarModuloContratos("portoadmin")).toBe(true);
    expect(podeUsarModuloContratos("Andre")).toBe(true);
    expect(podeUsarModuloContratos("anna")).toBe(false);
    expect(podeUsarModuloContratos("")).toBe(false);
    expect(podeUsarModuloContratos(undefined)).toBe(false);
    expect(podeUsarModuloContratos("andre2")).toBe(false);
  });

  it("reconhece telas e APIs do módulo, sem pegar rotas parecidas", () => {
    for (const r of ["/admin/locacoes", "/admin/locacoes/2", "/admin/clientes/novo", "/admin/documentos", "/admin/busca",
      "/api/admin/locacoes", "/api/admin/documentos/5/arquivo", "/api/admin/clientes/sugestoes", "/api/admin/busca"]) {
      expect(rotaDoModuloContratos(r), r).toBe(true);
    }
    for (const r of ["/admin/imoveis", "/admin/mensagens", "/admin/corretores", "/crm", "/api/admin/agenda", "/api/admin/locacoesx", "/area-cliente"]) {
      expect(rotaDoModuloContratos(r), r).toBe(false);
    }
  });
});
