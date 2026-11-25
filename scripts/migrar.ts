// Aplica as migrações de db/migrations que ainda não foram aplicadas.
// Uso: npm run db:migrar            (aplica)
//      npm run db:migrar -- --status (só lista)
import "dotenv/config";
import { Pool } from "pg";
import { join } from "node:path";
import { carregarMigracoes, pendentes } from "./migracoes";

async function main() {
  const somenteStatus = process.argv.includes("--status");
  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        nome        VARCHAR(255) PRIMARY KEY,
        aplicado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const aplicadas = (await pool.query("SELECT nome FROM schema_migrations")).rows.map((r) => r.nome);
    const todas = carregarMigracoes(join(__dirname, "..", "db", "migrations"));
    const aFazer = pendentes(todas, aplicadas);

    for (const m of todas) console.log(`${aplicadas.includes(m.nome) ? "[ok]      " : "[pendente]"} ${m.nome}`);
    if (somenteStatus || aFazer.length === 0) {
      if (aFazer.length === 0) console.log("Nada a aplicar.");
      return;
    }

    for (const m of aFazer) {
      const cliente = await pool.connect();
      try {
        await cliente.query("BEGIN");
        await cliente.query(m.sql);
        await cliente.query("INSERT INTO schema_migrations (nome) VALUES ($1)", [m.nome]);
        await cliente.query("COMMIT");
        console.log(`Aplicada: ${m.nome}`);
      } catch (erro) {
        await cliente.query("ROLLBACK");
        console.error(`Falhou: ${m.nome} (nada desta migração foi gravado)`);
        throw erro;
      } finally {
        cliente.release();
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((erro) => {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
