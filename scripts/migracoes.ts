import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Migracao {
  nome: string;
  sql: string;
}

const PADRAO_NOME = /^\d{3}_[a-z0-9_]+\.sql$/;

// Lista os arquivos de migração em ordem. Nome fora do padrão NNN_nome.sql é erro,
// para que um arquivo mal nomeado não seja ignorado em silêncio.
export function ordenarMigracoes(arquivos: string[]): string[] {
  const sql = arquivos.filter((a) => a.endsWith(".sql"));
  const invalidos = sql.filter((a) => !PADRAO_NOME.test(a));
  if (invalidos.length) {
    throw new Error(`Nome de migração inválido (use NNN_nome.sql): ${invalidos.join(", ")}`);
  }
  const ordenados = [...sql].sort();
  const prefixos = ordenados.map((a) => a.slice(0, 3));
  const repetido = prefixos.find((p, i) => prefixos.indexOf(p) !== i);
  if (repetido) throw new Error(`Número de migração repetido: ${repetido}`);
  return ordenados;
}

export function carregarMigracoes(pasta: string): Migracao[] {
  return ordenarMigracoes(readdirSync(pasta)).map((nome) => ({
    nome,
    sql: readFileSync(join(pasta, nome), "utf8"),
  }));
}

export function pendentes(todas: Migracao[], aplicadas: string[]): Migracao[] {
  const feitas = new Set(aplicadas);
  return todas.filter((m) => !feitas.has(m.nome));
}
