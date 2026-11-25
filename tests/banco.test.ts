// Testes que leem o banco. Só rodam com RODAR_TESTES_BANCO=1 e não gravam nada.
import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

const ativo = process.env.RODAR_TESTES_BANCO === "1";

describe.skipIf(!ativo)("esquema do módulo de contratos", () => {
  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  afterAll(() => pool.end());

  it("f_busca ignora acentos e maiúsculas", async () => {
    const { rows } = await pool.query("SELECT f_busca('JOSÉ da Conceição São') AS r");
    expect(rows[0].r).toBe("jose da conceicao sao");
  });

  it("tabelas novas existem", async () => {
    const { rows } = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name = ANY($1)",
      [["clientes", "documentos", "documentos_log", "importacao_pendencias"]]
    );
    expect(rows.map((r) => r.table_name).sort()).toEqual(["clientes", "documentos", "documentos_log", "importacao_pendencias"]);
  });

  it("documento sem vínculo é recusado pelo banco", async () => {
    const cliente = await pool.connect();
    try {
      await cliente.query("BEGIN");
      await expect(
        cliente.query(
          "INSERT INTO documentos (chave_storage, nome_original, tamanho, sha256, incluido_por) VALUES ('teste', 'a.pdf', 1, repeat('0',64), 'teste')"
        )
      ).rejects.toThrow(/documentos_vinculo_ck/);
    } finally {
      await cliente.query("ROLLBACK");
      cliente.release();
    }
  });

  it("f_proximo_reajuste calcula o próximo aniversário sem escorregar o dia", async () => {
    const casos: [string, number, string, string][] = [
      ["2025-01-31", 1, "2025-02-01", "2025-02-28"],
      ["2025-01-31", 1, "2025-03-01", "2025-03-31"],
      ["2024-03-10", 12, "2026-11-25", "2027-03-10"],
      ["2024-03-10", 12, "2027-03-10", "2027-03-10"],
      ["2026-06-01", 12, "2026-01-01", "2027-06-01"],
    ];
    for (const [inicio, meses, ref, esperado] of casos) {
      const { rows } = await pool.query("SELECT f_proximo_reajuste($1::date, $2, $3::date)::text AS r", [inicio, meses, ref]);
      expect(rows[0].r, `${inicio} +${meses}m ref ${ref}`).toBe(esperado);
    }
  });

  it("a listagem roda com todos os filtros (consulta real, só leitura)", async () => {
    const { listarContratos } = await import("../lib/contratos-db");
    const r = await listarContratos({
      q: "a", codigo: "1", inquilino: "a", proprietario: "a", endereco: "a",
      status: "ativo", finalidade: "residencial", corretor: "x",
      reajuste_de: "2020-01-01", reajuste_ate: "2030-12-31",
    });
    expect(Array.isArray(r.itens)).toBe(true);
    const todos = await listarContratos({});
    expect(todos.total).toBeGreaterThanOrEqual(0);
  });

  it("busca por nome usa índice trigram", async () => {
    const cliente = await pool.connect();
    try {
      await cliente.query("SET enable_seqscan = off");
      const { rows } = await cliente.query("EXPLAIN SELECT id FROM clientes WHERE f_busca(nome) LIKE '%' || f_busca('joao') || '%'");
      expect(rows.map((r) => r["QUERY PLAN"]).join("\n")).toMatch(/clientes_nome_trgm/);
    } finally {
      cliente.release();
    }
  });
});
