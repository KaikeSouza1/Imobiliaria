// Mede a busca de contratos com muitos registros fictícios, dentro de uma transação desfeita no fim.
// Nada fica gravado. Uso: npx tsx scripts/medir-busca.ts [quantidade]
import "dotenv/config";
import { Pool } from "pg";
import { montarFiltroContratos, EXPRESSAO_PROXIMO_REAJUSTE, type FiltrosContrato } from "../lib/busca-contratos";

const N = Number(process.argv[2]) || 20000;

const SELECT = (where: string, porPagina: number, offset: number) => `
  SELECT l.id, l.codigo, coalesce(inq.nome, l.locatario_nome) AS inquilino_nome, prop.nome AS proprietario_nome,
         ${EXPRESSAO_PROXIMO_REAJUSTE} AS proximo_reajuste,
         (SELECT COUNT(*) FROM documentos d WHERE d.locacao_id = l.id AND d.removido_em IS NULL)::int AS total_documentos,
         COUNT(*) OVER()::int AS total_geral
    FROM locacoes l
    LEFT JOIN imoveis  i    ON i.id    = l.imovel_id
    LEFT JOIN clientes inq  ON inq.id  = l.inquilino_id
    LEFT JOIN clientes prop ON prop.id = l.proprietario_id
    ${where}
   ORDER BY l.criado_em DESC, l.id DESC
   LIMIT ${porPagina} OFFSET ${offset}`;

async function main() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD, database: process.env.DATABASE_NAME,
  });
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    console.log(`Gerando ${N} contratos fictícios (serão descartados)...`);
    await c.query(`
      INSERT INTO clientes (nome, eh_inquilino, eh_proprietario)
      SELECT 'Pessoa Ficticia ' || g || ' ' || (ARRAY['Silva','Souza','Conceição','Pereira','Oliveira','Gonçalves'])[1 + g % 6], TRUE, g % 3 = 0
        FROM generate_series(1, $1) g`, [N]);
    await c.query(`
      INSERT INTO locacoes (codigo, locatario_nome, inquilino_id, proprietario_id, valor_aluguel, data_inicio, status, origem,
                            imovel_codigo_legado, imovel_endereco_legado, numero_pasta)
      SELECT 'FICT-' || g, 'x', cl.id, cl.id, 1000, DATE '2020-01-01' + (g % 1500), (ARRAY['ativo','encerrado','rescindido'])[1 + g % 3], 'legado',
             'IMV-' || g, 'Rua Ficticia ' || g || ', Centro', (g % 400)::text
        FROM generate_series(1, $1) g
        JOIN LATERAL (SELECT id FROM clientes WHERE nome = 'Pessoa Ficticia ' || g || ' ' || (ARRAY['Silva','Souza','Conceição','Pereira','Oliveira','Gonçalves'])[1 + g % 6] LIMIT 1) cl ON TRUE`, [N]);
    await c.query("ANALYZE clientes; ANALYZE locacoes;");

    const casos: [string, FiltrosContrato][] = [
      ["sem filtro (página 1)", {}],
      ["busca geral 'conceicao 1234'", { q: "conceicao 1234" }],
      ["busca geral 'silva'", { q: "silva" }],
      ["inquilino 'ficticia 98'", { inquilino: "ficticia 98" }],
      ["código 'FICT-1999'", { codigo: "FICT-1999" }],
      ["endereço 'rua ficticia 777'", { endereco: "rua ficticia 777" }],
      ["status + reajuste em 2027", { status: "ativo", reajuste_de: "2027-01-01", reajuste_ate: "2027-03-31" }],
      ["sem resultado 'zzzz'", { q: "zzzz" }],
    ];
    for (const [nome, f] of casos) {
      const { where, params, porPagina, offset } = montarFiltroContratos(f);
      const sql = SELECT(where, porPagina, offset);
      await c.query(sql, params); // aquece
      const t0 = performance.now();
      const r = await c.query(sql, params);
      const ms = performance.now() - t0;
      console.log(`${ms.toFixed(0).padStart(5)} ms  ${String(r.rows[0]?.total_geral ?? 0).padStart(6)} resultados  ${nome}`);
    }
  } finally {
    await c.query("ROLLBACK");
    c.release();
    await pool.end();
    console.log("Transação desfeita: nenhum dado gravado.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
