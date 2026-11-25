import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { carregarMigracoes, ordenarMigracoes, pendentes } from "../scripts/migracoes";

describe("migrações", () => {
  it("ordena pelo número e ignora arquivos que não são .sql", () => {
    expect(ordenarMigracoes(["002_b.sql", "LEIAME.md", "001_a.sql"])).toEqual(["001_a.sql", "002_b.sql"]);
  });

  it("recusa nome fora do padrão", () => {
    expect(() => ordenarMigracoes(["1_a.sql"])).toThrow(/inválido/);
  });

  it("recusa número repetido", () => {
    expect(() => ordenarMigracoes(["001_a.sql", "001_b.sql"])).toThrow(/repetido/);
  });

  it("retorna só as pendentes", () => {
    const todas = [{ nome: "001_a.sql", sql: "" }, { nome: "002_b.sql", sql: "" }];
    expect(pendentes(todas, ["001_a.sql"]).map((m) => m.nome)).toEqual(["002_b.sql"]);
  });

  it("a migração do módulo de contratos é só aditiva", () => {
    const sql = carregarMigracoes(join(__dirname, "..", "db", "migrations"))
      .map((m) => m.sql)
      .join("\n")
      .toUpperCase();
    expect(sql).not.toMatch(/DROP\s+(TABLE|COLUMN)/);
    expect(sql).not.toMatch(/\bDELETE\s+FROM\b/);
    expect(sql).not.toMatch(/\bTRUNCATE\b/);
  });
});
