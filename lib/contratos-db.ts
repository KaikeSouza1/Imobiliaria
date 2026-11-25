// Acesso ao banco para contratos (tabela locacoes). Só usar no servidor.
import type { PoolClient } from "pg";
import { query, transacao } from "./db";
import { codigoAutomatico, type DadosContrato, type NovoCliente } from "./contratos";
import { montarFiltroContratos, EXPRESSAO_PROXIMO_REAJUSTE, type FiltrosContrato } from "./busca-contratos";

export class ErroContrato extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const FROM_CONTRATOS = `
  FROM locacoes l
  LEFT JOIN imoveis  i    ON i.id    = l.imovel_id
  LEFT JOIN clientes inq  ON inq.id  = l.inquilino_id
  LEFT JOIN clientes prop ON prop.id = l.proprietario_id
`;

export async function listarContratos(filtros: FiltrosContrato) {
  const { where, params, porPagina, offset, pagina } = montarFiltroContratos(filtros);
  const res = await query(
    `SELECT
       l.id, l.codigo, l.status, l.origem, l.valor_aluguel, l.data_inicio, l.data_fim,
       l.finalidade, l.numero_pasta, l.corretor_responsavel,
       coalesce(inq.nome, l.locatario_nome) AS inquilino_nome,
       prop.nome AS proprietario_nome,
       l.imovel_id, i.codigo AS imovel_codigo, i.titulo AS imovel_titulo,
       i.endereco AS imovel_endereco, i.bairro AS imovel_bairro, i.cidade AS imovel_cidade,
       l.imovel_codigo_legado, l.imovel_endereco_legado,
       ${EXPRESSAO_PROXIMO_REAJUSTE} AS proximo_reajuste,
       (SELECT COUNT(*) FROM documentos d WHERE d.locacao_id = l.id AND d.removido_em IS NULL)::int AS total_documentos,
       COUNT(*) OVER()::int AS total_geral
     ${FROM_CONTRATOS}
     ${where}
     ORDER BY l.criado_em DESC, l.id DESC
     LIMIT ${porPagina} OFFSET ${offset}`,
    params
  );
  const total = res.rows[0]?.total_geral ?? 0;
  return {
    itens: res.rows.map((r) => {
      delete r.total_geral;
      return r;
    }),
    total,
    pagina,
    por_pagina: porPagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export async function resumoContratos() {
  const res = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'ativo')::int AS ativos,
      COALESCE(SUM(valor_aluguel) FILTER (WHERE status = 'ativo'), 0)::float AS receita_mensal,
      COUNT(*) FILTER (
        WHERE status = 'ativo'
          AND f_proximo_reajuste(data_inicio, periodo_reajuste_meses, CURRENT_DATE) <= CURRENT_DATE + 30
      )::int AS reajustes_30_dias
    FROM locacoes
  `);
  return res.rows[0];
}

export async function buscarContrato(id: number) {
  const res = await query(
    `SELECT
       l.*,
       ${EXPRESSAO_PROXIMO_REAJUSTE} AS proximo_reajuste_calculado,
       i.codigo AS imovel_codigo, i.titulo AS imovel_titulo, i.tipo AS imovel_tipo,
       i.endereco AS imovel_endereco, i.bairro AS imovel_bairro, i.cidade AS imovel_cidade,
       i.imagem_url AS imovel_imagem_url,
       inq.id AS inq_id, inq.codigo AS inq_codigo, inq.nome AS inq_nome, inq.cpf_cnpj AS inq_cpf_cnpj,
       inq.telefone AS inq_telefone, inq.email AS inq_email,
       prop.id AS prop_id, prop.codigo AS prop_codigo, prop.nome AS prop_nome, prop.cpf_cnpj AS prop_cpf_cnpj,
       prop.telefone AS prop_telefone, prop.email AS prop_email,
       u.nome AS corretor_nome
     ${FROM_CONTRATOS}
     LEFT JOIN usuarios u ON lower(u.username) = lower(l.corretor_responsavel)
     WHERE l.id = $1`,
    [id]
  );
  if (!res.rows[0]) return null;

  const docs = await query(
    `SELECT id, tipo, nome_original, tamanho, incluido_por, incluido_em
       FROM documentos
      WHERE locacao_id = $1 AND removido_em IS NULL
      ORDER BY incluido_em DESC`,
    [id]
  );
  return { ...res.rows[0], documentos: docs.rows };
}

// Usa o cliente informado, reaproveita um existente pelo CPF/CNPJ ou cadastra um novo.
async function resolverCliente(
  c: PoolClient,
  id: number | null,
  novo: NovoCliente | null,
  papel: "inquilino" | "proprietario"
): Promise<number | null> {
  const flag = papel === "inquilino" ? "eh_inquilino" : "eh_proprietario";
  if (id) {
    const r = await c.query(`UPDATE clientes SET ${flag} = TRUE, atualizado_em = NOW() WHERE id = $1 RETURNING id`, [id]);
    if (!r.rows[0]) throw new ErroContrato(`O ${papel === "inquilino" ? "inquilino" : "proprietário"} selecionado não existe mais.`);
    return id;
  }
  if (!novo) return null;
  if (novo.cpf_cnpj) {
    const existente = await c.query(
      `UPDATE clientes SET ${flag} = TRUE, atualizado_em = NOW() WHERE cpf_cnpj = $1 RETURNING id`,
      [novo.cpf_cnpj]
    );
    if (existente.rows[0]) return existente.rows[0].id;
  }
  const criado = await c.query(
    `INSERT INTO clientes (nome, cpf_cnpj, telefone, email, ${flag}) VALUES ($1, $2, $3, $4, TRUE) RETURNING id`,
    [novo.nome, novo.cpf_cnpj, novo.telefone, novo.email]
  );
  await c.query(`UPDATE clientes SET codigo = 'CL-' || lpad(id::text, 5, '0') WHERE id = $1 AND codigo IS NULL`, [criado.rows[0].id]);
  return criado.rows[0].id;
}

function traduzirErroBanco(erro: unknown, codigo: string | null): never {
  const e = erro as { code?: string; constraint?: string };
  if (e?.code === "23505" && e.constraint === "locacoes_codigo_uk") {
    throw new ErroContrato(`Já existe um contrato com o código ${codigo}.`, 409);
  }
  throw erro;
}

const COLUNAS = [
  "codigo", "origem", "status", "imovel_id", "imovel_codigo_legado", "imovel_endereco_legado",
  "inquilino_id", "proprietario_id", "locatario_nome", "locatario_cpf", "locatario_email", "locatario_telefone",
  "valor_aluguel", "dia_vencimento", "data_inicio", "data_fim", "data_entrega_chaves",
  "periodo_reajuste_meses", "corretor_responsavel", "finalidade", "numero_pasta", "observacoes",
] as const;

async function montarLinha(c: PoolClient, d: DadosContrato) {
  const inquilino_id = await resolverCliente(c, d.inquilino_id, d.novo_inquilino, "inquilino");
  const proprietario_id = await resolverCliente(c, d.proprietario_id, d.novo_proprietario, "proprietario");

  // Campos locatario_* continuam preenchidos para a Área do Cliente, que ainda lê deles.
  const inq = (await c.query("SELECT nome, cpf_cnpj, email, telefone FROM clientes WHERE id = $1", [inquilino_id])).rows[0];

  if (d.imovel_id) {
    const im = await c.query("SELECT id FROM imoveis WHERE id = $1", [d.imovel_id]);
    if (!im.rows[0]) throw new ErroContrato("O imóvel selecionado não existe mais.");
    if (proprietario_id) {
      // Só preenche o proprietário do imóvel se ainda estiver vazio; nunca sobrescreve.
      await c.query("UPDATE imoveis SET proprietario_id = $1 WHERE id = $2 AND proprietario_id IS NULL", [proprietario_id, d.imovel_id]);
    }
  }

  return {
    ...d,
    inquilino_id,
    proprietario_id,
    locatario_nome: inq?.nome ?? "",
    locatario_cpf: inq?.cpf_cnpj ?? null,
    locatario_email: inq?.email ?? null,
    locatario_telefone: inq?.telefone ?? null,
  } as Record<(typeof COLUNAS)[number], unknown>;
}

export async function criarContrato(d: DadosContrato) {
  try {
    return await transacao(async (c) => {
      const linha = await montarLinha(c, d);
      const valores = COLUNAS.map((k) => linha[k]);
      const res = await c.query(
        `INSERT INTO locacoes (${COLUNAS.join(", ")})
         VALUES (${COLUNAS.map((_, i) => `$${i + 1}`).join(", ")})
         RETURNING id, codigo`,
        valores
      );
      const criado = res.rows[0];
      if (!criado.codigo) {
        criado.codigo = codigoAutomatico(criado.id);
        await c.query("UPDATE locacoes SET codigo = $1 WHERE id = $2", [criado.codigo, criado.id]);
      }
      // Mantém o comportamento anterior: contrato ativo marca o imóvel como alugado.
      if (d.imovel_id && d.status === "ativo") {
        await c.query("UPDATE imoveis SET status = 'alugado' WHERE id = $1", [d.imovel_id]);
      }
      return criado as { id: number; codigo: string };
    });
  } catch (erro) {
    traduzirErroBanco(erro, d.codigo);
  }
}

export async function atualizarContrato(id: number, d: DadosContrato) {
  try {
    return await transacao(async (c) => {
      const atual = await c.query("SELECT id, codigo FROM locacoes WHERE id = $1 FOR UPDATE", [id]);
      if (!atual.rows[0]) throw new ErroContrato("Contrato não encontrado.", 404);

      const linha = await montarLinha(c, { ...d, codigo: d.codigo ?? atual.rows[0].codigo ?? codigoAutomatico(id) });
      const sets = COLUNAS.map((k, i) => `${k} = $${i + 1}`).join(", ");
      await c.query(
        `UPDATE locacoes SET ${sets}, atualizado_em = NOW() WHERE id = $${COLUNAS.length + 1}`,
        [...COLUNAS.map((k) => linha[k]), id]
      );
      if (d.imovel_id && d.status !== "ativo") {
        // Comportamento anterior: ao encerrar, o imóvel volta a ficar disponível.
        await c.query("UPDATE imoveis SET status = 'disponivel' WHERE id = $1 AND status = 'alugado'", [d.imovel_id]);
      }
      return { id };
    });
  } catch (erro) {
    traduzirErroBanco(erro, d.codigo);
  }
}

export async function excluirContrato(id: number) {
  const docs = await query(
    "SELECT COUNT(*)::int AS n FROM documentos WHERE locacao_id = $1",
    [id]
  );
  if (docs.rows[0].n > 0) {
    throw new ErroContrato(
      `Este contrato tem ${docs.rows[0].n} documento(s) vinculado(s) e não pode ser excluído. Altere o status para "Encerrado".`,
      409
    );
  }
  const res = await query("DELETE FROM locacoes WHERE id = $1 RETURNING id", [id]);
  if (!res.rows[0]) throw new ErroContrato("Contrato não encontrado.", 404);
}

export async function listarCorretores() {
  const res = await query("SELECT username, nome FROM usuarios ORDER BY nome");
  return res.rows as { username: string; nome: string }[];
}
