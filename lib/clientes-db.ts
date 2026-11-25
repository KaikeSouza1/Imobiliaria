// Acesso ao banco para clientes (inquilinos e proprietários). Só usar no servidor.
import { query, transacao } from "./db";
import { escaparLike, apenasDigitos, mascararCpfCnpj } from "./texto";
import { separarPalavras } from "./busca-contratos";
import type { DadosCliente } from "./clientes";

export class ErroCliente extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const COLUNAS = [
  "nome", "cpf_cnpj", "rg", "data_nascimento", "estado_civil", "profissao", "email", "telefone",
  "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf", "eh_proprietario", "eh_inquilino", "observacoes",
] as const;

export interface FiltrosClientes {
  q?: string;
  papel?: string; // inquilino | proprietario
  pagina?: number;
}

export async function listarClientes(f: FiltrosClientes) {
  const cond: string[] = [];
  const params: unknown[] = [];
  for (const palavra of separarPalavras(f.q)) {
    params.push(`%${escaparLike(palavra)}%`);
    const p = `$${params.length}`;
    const digitos = apenasDigitos(palavra);
    let porDoc = "";
    if (digitos.length >= 3 && digitos.length === palavra.replace(/[.\-/]/g, "").length) {
      params.push(`%${digitos}%`);
      porDoc = ` OR c.cpf_cnpj LIKE $${params.length}`;
    }
    cond.push(`(f_busca(c.nome) LIKE f_busca(${p}) OR f_busca(c.codigo) LIKE f_busca(${p}) OR f_busca(c.cidade) LIKE f_busca(${p})${porDoc})`);
  }
  if (f.papel === "inquilino") cond.push("c.eh_inquilino");
  if (f.papel === "proprietario") cond.push("c.eh_proprietario");

  const porPagina = 25;
  const pagina = Math.max(1, Math.floor(Number(f.pagina) || 1));
  const r = await query(
    `SELECT c.id, c.codigo, c.nome, c.cpf_cnpj, c.telefone, c.email, c.cidade, c.uf, c.eh_inquilino, c.eh_proprietario,
            (SELECT COUNT(*) FROM locacoes l WHERE l.inquilino_id = c.id OR l.proprietario_id = c.id)::int AS total_contratos,
            (SELECT COUNT(*) FROM imoveis i WHERE i.proprietario_id = c.id)::int AS total_imoveis,
            COUNT(*) OVER()::int AS total_geral
       FROM clientes c
      ${cond.length ? `WHERE ${cond.join(" AND ")}` : ""}
      ORDER BY c.nome
      LIMIT ${porPagina} OFFSET ${(pagina - 1) * porPagina}`,
    params
  );
  const total = r.rows[0]?.total_geral ?? 0;
  return {
    // Na lista o documento vai sempre mascarado.
    itens: r.rows.map((linha) => {
      const { cpf_cnpj, ...c } = linha;
      delete c.total_geral;
      return { ...c, documento: mascararCpfCnpj(cpf_cnpj) };
    }),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export async function resumoClientes() {
  const r = await query(`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE eh_inquilino)::int AS inquilinos,
           COUNT(*) FILTER (WHERE eh_proprietario)::int AS proprietarios
      FROM clientes`);
  return r.rows[0];
}

// Painel completo: dados, contratos (como inquilino e como proprietário), imóveis e documentos pessoais.
export async function buscarCliente(id: number) {
  const r = await query("SELECT * FROM clientes WHERE id = $1", [id]);
  if (!r.rows[0]) return null;
  const [contratos, imoveis, documentos] = await Promise.all([
    query(
      `SELECT l.id, l.codigo, l.status, l.valor_aluguel, l.data_inicio, l.data_fim,
              CASE WHEN l.inquilino_id = $1 THEN 'inquilino' ELSE 'proprietario' END AS papel,
              coalesce(inq.nome, l.locatario_nome) AS inquilino_nome, prop.nome AS proprietario_nome,
              coalesce(i.codigo, l.imovel_codigo_legado) AS imovel_codigo, i.titulo AS imovel_titulo,
              coalesce(NULLIF(concat_ws(', ', i.endereco, i.bairro, i.cidade), ''), l.imovel_endereco_legado) AS imovel_endereco
         FROM locacoes l
         LEFT JOIN imoveis i ON i.id = l.imovel_id
         LEFT JOIN clientes inq ON inq.id = l.inquilino_id
         LEFT JOIN clientes prop ON prop.id = l.proprietario_id
        WHERE l.inquilino_id = $1 OR l.proprietario_id = $1
        ORDER BY l.data_inicio DESC NULLS LAST, l.id DESC`,
      [id]
    ),
    query(
      `SELECT id, codigo, titulo, tipo, endereco, bairro, cidade, status FROM imoveis WHERE proprietario_id = $1 ORDER BY titulo`,
      [id]
    ),
    query(
      `SELECT id, tipo, nome_original, tamanho, incluido_por, incluido_em
         FROM documentos WHERE cliente_id = $1 AND removido_em IS NULL ORDER BY incluido_em DESC`,
      [id]
    ),
  ]);
  return { ...r.rows[0], contratos: contratos.rows, imoveis: imoveis.rows, documentos: documentos.rows };
}

function traduzirErro(e: unknown): never {
  const erro = e as { code?: string; constraint?: string };
  if (erro.code === "23505" && erro.constraint === "clientes_cpf_cnpj_uk") {
    throw new ErroCliente("Já existe um cliente cadastrado com este CPF/CNPJ. Use a busca para encontrá-lo.", 409);
  }
  throw e;
}

export async function criarCliente(d: DadosCliente) {
  try {
    return await transacao(async (c) => {
      const r = await c.query(
        `INSERT INTO clientes (${COLUNAS.join(", ")}) VALUES (${COLUNAS.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`,
        COLUNAS.map((k) => d[k])
      );
      const id = r.rows[0].id as number;
      const codigo = `CL-${String(id).padStart(5, "0")}`;
      await c.query("UPDATE clientes SET codigo = $1 WHERE id = $2", [codigo, id]);
      return { id, codigo };
    });
  } catch (e) {
    traduzirErro(e);
  }
}

export async function atualizarCliente(id: number, d: DadosCliente) {
  try {
    const r = await query(
      `UPDATE clientes SET ${COLUNAS.map((k, i) => `${k} = $${i + 1}`).join(", ")}, atualizado_em = NOW()
        WHERE id = $${COLUNAS.length + 1} RETURNING id`,
      [...COLUNAS.map((k) => d[k]), id]
    );
    if (!r.rows[0]) throw new ErroCliente("Cliente não encontrado.", 404);
    return { id };
  } catch (e) {
    if (e instanceof ErroCliente) throw e;
    traduzirErro(e);
  }
}

// Só exclui quem não tem contrato, imóvel nem documento vinculado (os dados pessoais saem do banco de verdade).
export async function excluirCliente(id: number) {
  const v = await query(
    `SELECT (SELECT COUNT(*) FROM locacoes WHERE inquilino_id = $1 OR proprietario_id = $1)::int AS contratos,
            (SELECT COUNT(*) FROM imoveis WHERE proprietario_id = $1)::int AS imoveis,
            (SELECT COUNT(*) FROM documentos WHERE cliente_id = $1)::int AS documentos`,
    [id]
  );
  const { contratos, imoveis, documentos } = v.rows[0];
  if (contratos || imoveis || documentos) {
    const partes = [
      contratos && `${contratos} contrato(s)`,
      imoveis && `${imoveis} imóvel(is)`,
      documentos && `${documentos} documento(s)`,
    ].filter(Boolean);
    throw new ErroCliente(`Este cliente tem ${partes.join(", ")} vinculado(s) e não pode ser excluído.`, 409);
  }
  const r = await query("DELETE FROM clientes WHERE id = $1 RETURNING id", [id]);
  if (!r.rows[0]) throw new ErroCliente("Cliente não encontrado.", 404);
}
