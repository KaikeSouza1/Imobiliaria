// Acesso ao banco para documentos. Só usar no servidor.
import { query, transacao } from "./db";
import { escaparLike } from "./texto";
import type { TipoQualquerDocumento, Vinculo } from "./documentos";

export type AcaoLog = "incluir" | "visualizar" | "baixar" | "excluir";

export class ErroDocumento extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

// O log guarda só ids, ação, usuário e IP. Nada de nome de arquivo ou dado pessoal.
export async function registrarLog(documentoId: number, acao: AcaoLog, usuario: string, ip: string | null) {
  await query("INSERT INTO documentos_log (documento_id, acao, usuario, ip) VALUES ($1, $2, $3, $4)", [
    documentoId, acao, usuario, ip ? ip.slice(0, 64) : null,
  ]);
}

export async function conferirVinculo(v: Vinculo) {
  const checagens: [number | null, string, string][] = [
    [v.locacao_id, "locacoes", "Contrato não encontrado."],
    [v.cliente_id, "clientes", "Cliente não encontrado."],
    [v.imovel_id, "imoveis", "Imóvel não encontrado."],
  ];
  for (const [id, tabela, erro] of checagens) {
    if (!id) continue;
    const r = await query(`SELECT 1 FROM ${tabela} WHERE id = $1`, [id]);
    if (!r.rows[0]) throw new ErroDocumento(erro, 404);
  }
}

export async function documentoDuplicado(sha256: string, v: Vinculo) {
  const r = await query(
    `SELECT id, nome_original FROM documentos
      WHERE sha256 = $1 AND removido_em IS NULL
        AND coalesce(locacao_id,0) = $2 AND coalesce(cliente_id,0) = $3 AND coalesce(imovel_id,0) = $4
      LIMIT 1`,
    [sha256, v.locacao_id ?? 0, v.cliente_id ?? 0, v.imovel_id ?? 0]
  );
  return r.rows[0] as { id: number; nome_original: string } | undefined;
}

export interface NovoDocumento {
  vinculo: Vinculo;
  tipo: TipoQualquerDocumento;
  chave: string;
  nome: string;
  tamanho: number;
  sha256: string;
  usuario: string;
  ip: string | null;
  origem_importacao?: string | null;
  /** Documento gerado pelo sistema: de qual modelo e com quais dados (para gerar de novo). */
  modelo?: string | null;
  dados_modelo?: unknown;
}

export async function gravarDocumento(d: NovoDocumento) {
  try {
    return await transacao(async (c) => {
      const r = await c.query(
        `INSERT INTO documentos (locacao_id, cliente_id, imovel_id, tipo, chave_storage, nome_original, tamanho, sha256, incluido_por, origem_importacao, modelo, dados_modelo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id, locacao_id, cliente_id, imovel_id, tipo, nome_original, tamanho, incluido_por, incluido_em, modelo`,
        [d.vinculo.locacao_id, d.vinculo.cliente_id, d.vinculo.imovel_id, d.tipo, d.chave, d.nome, d.tamanho, d.sha256, d.usuario, d.origem_importacao ?? null,
         d.modelo ?? null, d.dados_modelo === undefined ? null : JSON.stringify(d.dados_modelo)]
      );
      await c.query("INSERT INTO documentos_log (documento_id, acao, usuario, ip) VALUES ($1, 'incluir', $2, $3)", [
        r.rows[0].id, d.usuario, d.ip ? d.ip.slice(0, 64) : null,
      ]);
      return r.rows[0];
    });
  } catch (e) {
    const erro = e as { code?: string; constraint?: string };
    if (erro.code === "23505" && erro.constraint === "documentos_chave_storage_key") {
      // Mesma confirmação enviada duas vezes: o arquivo já pertence a um documento válido, não pode ser descartado.
      throw new ErroDocumento("Este envio já foi confirmado.", 409);
    }
    if (erro.code === "23505") {
      // Dois envios do mesmo arquivo ao mesmo tempo: o índice único segura o segundo.
      throw Object.assign(new ErroDocumento("Este arquivo já está anexado a este registro.", 409), { descartar: true });
    }
    throw e;
  }
}

export async function buscarDocumento(id: number) {
  const r = await query(
    "SELECT id, locacao_id, cliente_id, imovel_id, tipo, chave_storage, nome_original, tamanho, removido_em FROM documentos WHERE id = $1",
    [id]
  );
  return r.rows[0] as
    | { id: number; locacao_id: number | null; cliente_id: number | null; imovel_id: number | null; tipo: string; chave_storage: string; nome_original: string; tamanho: number; removido_em: string | null }
    | undefined;
}

export async function removerDocumento(id: number, usuario: string, ip: string | null) {
  return transacao(async (c) => {
    const r = await c.query(
      "UPDATE documentos SET removido_em = NOW(), removido_por = $2 WHERE id = $1 AND removido_em IS NULL RETURNING id",
      [id, usuario]
    );
    if (!r.rows[0]) throw new ErroDocumento("Documento não encontrado ou já excluído.", 404);
    await c.query("INSERT INTO documentos_log (documento_id, acao, usuario, ip) VALUES ($1, 'excluir', $2, $3)", [
      id, usuario, ip ? ip.slice(0, 64) : null,
    ]);
  });
}

export interface FiltrosDocumentos {
  q?: string;
  locacao_id?: number;
  tipo?: string;
  pagina?: number;
}

// Repositório: documentos recentes, com busca por nome do arquivo, código do contrato ou partes.
export async function listarDocumentos(f: FiltrosDocumentos) {
  const cond = ["d.removido_em IS NULL"];
  const params: unknown[] = [];
  if (f.locacao_id) {
    params.push(f.locacao_id);
    cond.push(`d.locacao_id = $${params.length}`);
  }
  if (f.tipo) {
    params.push(f.tipo);
    cond.push(`d.tipo = $${params.length}`);
  }
  if (f.q && f.q.trim()) {
    params.push(`%${escaparLike(f.q.trim())}%`);
    const p = `f_busca($${params.length})`;
    cond.push(`(f_busca(d.nome_original) LIKE ${p} OR f_busca(l.codigo) LIKE ${p}
      OR f_busca(coalesce(inq.nome, l.locatario_nome)) LIKE ${p} OR f_busca(prop.nome) LIKE ${p}
      OR f_busca(cli.nome) LIKE ${p} OR f_busca(i.codigo) LIKE ${p})`);
  }
  const porPagina = 25;
  const pagina = Math.max(1, Math.floor(Number(f.pagina) || 1));
  const r = await query(
    `SELECT d.id, d.tipo, d.nome_original, d.tamanho, d.incluido_por, d.incluido_em,
            d.locacao_id, l.codigo AS contrato_codigo,
            coalesce(inq.nome, l.locatario_nome) AS inquilino_nome,
            d.cliente_id, cli.nome AS cliente_nome,
            coalesce(d.imovel_id, l.imovel_id) AS imovel_id, i.codigo AS imovel_codigo,
            COUNT(*) OVER()::int AS total_geral
       FROM documentos d
       LEFT JOIN locacoes l   ON l.id = d.locacao_id
       LEFT JOIN clientes inq ON inq.id = l.inquilino_id
       LEFT JOIN clientes prop ON prop.id = l.proprietario_id
       LEFT JOIN clientes cli ON cli.id = d.cliente_id
       LEFT JOIN imoveis i    ON i.id = coalesce(d.imovel_id, l.imovel_id)
      WHERE ${cond.join(" AND ")}
      ORDER BY d.incluido_em DESC, d.id DESC
      LIMIT ${porPagina} OFFSET ${(pagina - 1) * porPagina}`,
    params
  );
  const total = r.rows[0]?.total_geral ?? 0;
  return {
    itens: r.rows.map((x) => { delete x.total_geral; return x; }),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

// Navegação por pastas: cada contrato com documentos é uma pasta.
export async function listarPastas(q?: string) {
  const params: unknown[] = [];
  let filtro = "";
  if (q && q.trim()) {
    params.push(`%${escaparLike(q.trim())}%`);
    filtro = `AND (f_busca(l.codigo) LIKE f_busca($1) OR f_busca(coalesce(inq.nome, l.locatario_nome)) LIKE f_busca($1))`;
  }
  const r = await query(
    `SELECT l.id, l.codigo, l.numero_pasta, coalesce(inq.nome, l.locatario_nome) AS inquilino_nome,
            COUNT(d.id)::int AS total, MAX(d.incluido_em) AS ultimo
       FROM documentos d
       JOIN locacoes l ON l.id = d.locacao_id
       LEFT JOIN clientes inq ON inq.id = l.inquilino_id
      WHERE d.removido_em IS NULL ${filtro}
      GROUP BY l.id, l.codigo, l.numero_pasta, inq.nome, l.locatario_nome
      ORDER BY l.codigo NULLS LAST
      LIMIT 200`,
    params
  );
  return r.rows;
}
