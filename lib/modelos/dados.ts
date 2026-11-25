// Preenche os modelos com os dados do sistema e guarda o PDF gerado. Só usar no servidor.
import { createHash } from "node:crypto";
import { query } from "../db";
import { formatarCpfCnpj } from "../texto";
import { formatarCep } from "../clientes";
import { mesesEntre } from "../texto";
import { sanitizarNomeOriginal } from "../documentos";
import { gravarDocumento, documentoDuplicado, ErroDocumento } from "../documentos-db";
import { novaChave, enviarDoServidor } from "../storage-documentos";
import { finalidadePorTipo } from "../contratos";
import { hojeISO } from "./extenso";
import { gerarPdf } from "./gerar-pdf";
import type { Empresa, Modelo, Valores } from "./tipos";

export async function carregarEmpresa(): Promise<Empresa> {
  const r = await query("SELECT valor FROM parametros WHERE chave = 'empresa'");
  if (!r.rows[0]) throw new ErroDocumento("Os dados da imobiliária para os documentos não estão cadastrados.", 500);
  return r.rows[0].valor as Empresa;
}

interface ClienteBanco {
  id: number; nome: string; cpf_cnpj: string | null; rg: string | null; estado_civil: string | null; profissao: string | null;
  telefone: string | null; cep: string | null; logradouro: string | null; numero: string | null; complemento: string | null;
  bairro: string | null; cidade: string | null; uf: string | null;
}

async function cliente(id: number | null | undefined): Promise<ClienteBanco | null> {
  if (!id) return null;
  const r = await query("SELECT * FROM clientes WHERE id = $1", [id]);
  return r.rows[0] ?? null;
}

function enderecoCliente(c: ClienteBanco): string {
  const rua = [c.logradouro, c.numero].filter(Boolean).join(", ");
  const cidade = [c.cidade, c.uf].filter(Boolean).join(" ");
  return [rua, c.complemento, c.bairro, cidade].filter(Boolean).join(", ");
}

// Campos de qualificação de uma pessoa a partir do cadastro de clientes.
function pessoa(prefixo: string, c: ClienteBanco | null, nomeReserva?: string | null, cpfReserva?: string | null): Valores {
  if (!c) return { [`${prefixo}_nome`]: nomeReserva ?? "", [`${prefixo}_cpf`]: cpfReserva ? formatarCpfCnpj(cpfReserva) : "" };
  return {
    [`${prefixo}_nome`]: c.nome,
    [`${prefixo}_cpf`]: c.cpf_cnpj ? formatarCpfCnpj(c.cpf_cnpj) : "",
    [`${prefixo}_rg`]: c.rg ?? "",
    [`${prefixo}_estado_civil`]: c.estado_civil ?? "",
    [`${prefixo}_profissao`]: c.profissao ?? "",
    [`${prefixo}_celular`]: c.telefone ?? "",
    [`${prefixo}_endereco`]: enderecoCliente(c),
    [`${prefixo}_cep`]: c.cep ? formatarCep(c.cep) : "",
  };
}

async function imovel(id: number | null | undefined) {
  if (!id) return null;
  const r = await query("SELECT id, codigo, titulo, tipo, finalidade, endereco, bairro, cidade, preco FROM imoveis WHERE id = $1", [id]);
  return r.rows[0] ?? null;
}

function enderecoImovel(i: { endereco: string | null; bairro: string | null; cidade: string | null } | null, legado?: string | null) {
  if (!i) return legado ?? "";
  return [i.endereco, i.bairro, i.cidade].filter(Boolean).join(", ");
}

export interface Origem {
  locacao_id?: number;
  cliente_id?: number;
  imovel_id?: number;
  documento_id?: number;
}

// Valores iniciais do formulário: padrões do modelo + dados do contrato/cliente/imóvel.
export async function preencher(modelo: Modelo, origem: Origem): Promise<{ valores: Valores; contexto: string | null }> {
  const valores: Valores = {};
  for (const c of modelo.campos) if (c.padrao !== undefined) valores[c.id] = c.padrao;
  for (const c of modelo.campos) if (c.tipo === "data" && ["data_assinatura", "data_inicio"].includes(c.id)) valores[c.id] = hojeISO();
  if (modelo.campos.some((c) => c.tipo === "debitos")) valores.debitos = [];

  // Gerar de novo a partir de um documento já gerado: usa os mesmos dados (com a data de hoje).
  if (origem.documento_id) {
    const r = await query("SELECT modelo, dados_modelo FROM documentos WHERE id = $1 AND removido_em IS NULL", [origem.documento_id]);
    if (r.rows[0]?.modelo === modelo.id && r.rows[0].dados_modelo) {
      return { valores: { ...valores, ...r.rows[0].dados_modelo, data_assinatura: hojeISO() }, contexto: "Dados do documento gerado anteriormente" };
    }
  }

  let contexto: string | null = null;
  if (modelo.vinculo === "locacao" && origem.locacao_id) {
    const r = await query("SELECT * FROM locacoes WHERE id = $1", [origem.locacao_id]);
    const l = r.rows[0];
    if (!l) throw new ErroDocumento("Contrato não encontrado.", 404);
    const inq = await cliente(l.inquilino_id);
    const im = await imovel(l.imovel_id);
    const endImovel = enderecoImovel(im, l.imovel_endereco_legado);
    const inicio = l.data_inicio ? String(l.data_inicio instanceof Date ? l.data_inicio.toISOString() : l.data_inicio).slice(0, 10) : "";
    const fim = l.data_fim ? String(l.data_fim instanceof Date ? l.data_fim.toISOString() : l.data_fim).slice(0, 10) : "";
    contexto = `Contrato ${l.codigo ?? `#${l.id}`} — ${inq?.nome ?? l.locatario_nome}`;

    Object.assign(valores, pessoa("locatario", inq, l.locatario_nome, l.locatario_cpf));
    Object.assign(valores, {
      imovel_endereco: endImovel,
      inquilino_nome: inq?.nome ?? l.locatario_nome,
      entregador_nome: inq?.nome ?? l.locatario_nome,
      entregador_cpf: inq?.cpf_cnpj ? formatarCpfCnpj(inq.cpf_cnpj) : l.locatario_cpf ? formatarCpfCnpj(l.locatario_cpf) : "",
      notificado_nome: inq?.nome ?? l.locatario_nome,
      notificado_cpf: inq?.cpf_cnpj ? formatarCpfCnpj(inq.cpf_cnpj) : l.locatario_cpf ? formatarCpfCnpj(l.locatario_cpf) : "",
    });
    if (modelo.id === "contrato_locacao") {
      Object.assign(valores, {
        finalidade: l.finalidade ?? (im ? finalidadePorTipo(im.tipo) : "residencial"),
        imovel_descricao: im?.tipo ? String(im.tipo).toUpperCase() : "",
        data_inicio: inicio || valores.data_inicio,
        data_fim: fim,
        prazo_meses: mesesEntre(inicio, fim) || 12,
        valor_aluguel: Number(l.valor_aluguel) || "",
        dia_vencimento: l.dia_vencimento ?? 20,
      });
      if (l.corretor_responsavel) {
        const u = await query("SELECT nome FROM usuarios WHERE lower(username) = lower($1)", [l.corretor_responsavel]);
        if (u.rows[0]) valores.corretor_nome = u.rows[0].nome;
      }
    }
  }

  if (modelo.vinculo === "proprietario" && origem.cliente_id) {
    const prop = await cliente(origem.cliente_id);
    if (!prop) throw new ErroDocumento("Cliente não encontrado.", 404);
    contexto = `Proprietário ${prop.nome}`;
    Object.assign(valores, pessoa("proprietario", prop));
    // Imóvel: o informado, ou o primeiro imóvel do site ligado a este proprietário.
    let im = await imovel(origem.imovel_id);
    if (!im) {
      const r = await query("SELECT id FROM imoveis WHERE proprietario_id = $1 ORDER BY id LIMIT 1", [prop.id]);
      im = await imovel(r.rows[0]?.id);
    }
    if (im) {
      Object.assign(valores, {
        imovel_endereco: enderecoImovel(im),
        imovel_tipo: im.tipo ? String(im.tipo).toUpperCase() : "",
        imovel_finalidade: finalidadePorTipo(im.tipo),
        objeto_resumo: im.tipo ? `UM(A) ${String(im.tipo).toUpperCase()}` : "",
      });
      if (modelo.id === "intermediacao_venda" && Number(im.preco) > 0) valores.valor_venda = Number(im.preco);
      if (modelo.id === "administracao_locacao" && Number(im.preco) > 0) valores.aluguel_minimo = Number(im.preco);
    }
  }
  return { valores, contexto };
}

export interface DestinoDocumento {
  locacao_id: number | null;
  cliente_id: number | null;
  imovel_id: number | null;
}

// Gera o PDF, guarda no bucket privado e registra em "documentos" (com o modelo e os dados usados).
export async function salvarDocumentoGerado(modelo: Modelo, valores: Valores, destino: DestinoDocumento, usuario: string, ip: string | null) {
  // O PDF leva a data/hora de criação, então dois PDFs do mesmo conteúdo nunca são byte a byte iguais.
  // A duplicidade (duplo clique, reenvio) é detectada pelos dados usados no modelo, no mesmo contrato/cliente.
  const repetido = await query(
    `SELECT nome_original FROM documentos
      WHERE modelo = $1 AND dados_modelo = $2::jsonb AND removido_em IS NULL
        AND coalesce(locacao_id,0) = $3 AND coalesce(cliente_id,0) = $4 AND coalesce(imovel_id,0) = $5
      LIMIT 1`,
    [modelo.id, JSON.stringify(valores), destino.locacao_id ?? 0, destino.cliente_id ?? 0, destino.imovel_id ?? 0]
  );
  if (repetido.rows[0]) {
    throw new ErroDocumento(`Este documento já foi gerado com os mesmos dados ("${repetido.rows[0].nome_original}"). Altere algum campo para gerar outro.`, 409);
  }

  const empresa = await carregarEmpresa();
  const pdf = await gerarPdf(modelo, valores, empresa);
  const sha256 = createHash("sha256").update(pdf).digest("hex");
  const duplicado = await documentoDuplicado(sha256, destino);
  if (duplicado) throw new ErroDocumento(`Um documento idêntico já está salvo ("${duplicado.nome_original}").`, 409);

  const chave = novaChave();
  await enviarDoServidor(chave, pdf);
  return gravarDocumento({
    vinculo: destino,
    tipo: modelo.tipoDocumento,
    chave,
    nome: sanitizarNomeOriginal(modelo.nomeArquivo(valores)),
    tamanho: pdf.length,
    sha256,
    usuario,
    ip,
    modelo: modelo.id,
    dados_modelo: valores,
  });
}
