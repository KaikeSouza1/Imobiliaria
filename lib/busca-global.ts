// Busca global: contratos (via busca-contratos) + pessoas e imóveis relacionados. Só usar no servidor.
import { query } from "./db";
import { escaparLike, mascararCpfCnpj, apenasDigitos } from "./texto";
import { separarPalavras } from "./busca-contratos";

// Cada palavra precisa aparecer na expressão (em qualquer ordem).
function todasAsPalavras(expressao: string, q: string, params: unknown[]) {
  const partes = separarPalavras(q).map((p) => {
    params.push(`%${escaparLike(p)}%`);
    return `${expressao} LIKE f_busca($${params.length})`;
  });
  return partes.length ? partes.join(" AND ") : "FALSE";
}

export async function buscarClientes(q: string, limite = 6) {
  const params: unknown[] = [q];
  const porNome = todasAsPalavras("f_busca(c.nome)", q, params);
  const porCodigo = todasAsPalavras("f_busca(c.codigo)", q, params);
  let porDocumento = "";
  const digitos = apenasDigitos(q);
  if (digitos.length >= 3) {
    params.push(`${digitos}%`);
    porDocumento = ` OR c.cpf_cnpj LIKE $${params.length}`;
  }
  const r = await query(
    `SELECT c.id, c.codigo, c.nome, c.cpf_cnpj, c.telefone, c.cidade, c.eh_inquilino, c.eh_proprietario,
            (SELECT COUNT(*) FROM locacoes l WHERE l.inquilino_id = c.id OR l.proprietario_id = c.id)::int AS total_contratos
       FROM clientes c
      WHERE (${porNome}) OR (${porCodigo})${porDocumento}
      ORDER BY similarity(f_busca(c.nome), f_busca($1)) DESC, c.nome
      LIMIT ${limite}`,
    params
  );
  return r.rows.map(({ cpf_cnpj, ...c }) => ({ ...c, documento: mascararCpfCnpj(cpf_cnpj) }));
}

// Cadastros mais recentes (mostrados assim que o campo de cliente recebe foco, antes de digitar).
export async function clientesRecentes(limite = 8) {
  const r = await query(
    `SELECT c.id, c.codigo, c.nome, c.cpf_cnpj, c.telefone, c.cidade, c.eh_inquilino, c.eh_proprietario,
            (SELECT COUNT(*) FROM locacoes l WHERE l.inquilino_id = c.id OR l.proprietario_id = c.id)::int AS total_contratos
       FROM clientes c
      ORDER BY c.atualizado_em DESC, c.id DESC
      LIMIT ${limite}`
  );
  return r.rows.map(({ cpf_cnpj, ...c }) => ({ ...c, documento: mascararCpfCnpj(cpf_cnpj) }));
}

export async function buscarImoveis(q: string, limite = 6) {
  const params: unknown[] = [];
  const onde = todasAsPalavras(
    // Mesma expressão do índice imoveis_busca_trgm (migração 003).
    "f_busca(coalesce(i.codigo,'') || ' ' || coalesce(i.titulo,'') || ' ' || coalesce(i.endereco,'') || ' ' || coalesce(i.bairro,'') || ' ' || coalesce(i.cidade,''))",
    q,
    params
  );
  const r = await query(
    `SELECT i.id, i.codigo, i.titulo, i.tipo, i.endereco, i.bairro, i.cidade, i.status,
            (SELECT COUNT(*) FROM locacoes l WHERE l.imovel_id = i.id)::int AS total_contratos
       FROM imoveis i
      WHERE ${onde}
      ORDER BY (SELECT COUNT(*) FROM locacoes l WHERE l.imovel_id = i.id) DESC, i.criado_em DESC
      LIMIT ${limite}`,
    params
  );
  return r.rows;
}

// Cabeçalho quando a busca está "focada" em uma pessoa ou um imóvel.
export async function descreverFoco(clienteId?: number, imovelId?: number) {
  if (clienteId) {
    const r = await query("SELECT id, codigo, nome, telefone, eh_inquilino, eh_proprietario FROM clientes WHERE id = $1", [clienteId]);
    return r.rows[0] ? { tipo: "cliente" as const, ...r.rows[0] } : null;
  }
  if (imovelId) {
    const r = await query("SELECT id, codigo, titulo, endereco, bairro, cidade FROM imoveis WHERE id = $1", [imovelId]);
    return r.rows[0] ? { tipo: "imovel" as const, ...r.rows[0] } : null;
  }
  return null;
}
