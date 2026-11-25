// Regras de documentos (PDF). Funções puras, usadas no navegador, no servidor e nos testes.

export const TIPOS_DOCUMENTO = ["contrato_assinado", "vistoria", "comprovante", "documento_pessoal", "outro"] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

// Tipos que só o gerador de documentos usa (não aparecem na escolha de upload).
export const TIPOS_GERADOS = ["contrato_gerado", "termo", "notificacao"] as const;
export const TIPOS_TODOS = [...TIPOS_DOCUMENTO, ...TIPOS_GERADOS] as const;
export type TipoQualquerDocumento = (typeof TIPOS_TODOS)[number];

export const ROTULO_TIPO_DOCUMENTO: Record<string, string> = {
  contrato_assinado: "Contrato assinado",
  vistoria: "Vistoria",
  comprovante: "Comprovante",
  documento_pessoal: "Documento pessoal",
  outro: "Outro",
  contrato_gerado: "Contrato gerado",
  termo: "Termo",
  notificacao: "Notificação",
};

export const TAMANHO_MAXIMO_DOCUMENTO = 20 * 1024 * 1024; // 20 MB
export const TAMANHO_MAXIMO_TEXTO = "20 MB";

export interface Vinculo {
  locacao_id: number | null;
  cliente_id: number | null;
  imovel_id: number | null;
}

// O PDF começa com "%PDF-". Alguns geradores colocam bytes antes; o padrão tolera até 1024.
export function ehPdf(inicio: Uint8Array): boolean {
  const assinatura = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
  const limite = Math.min(inicio.length - assinatura.length, 1024);
  for (let i = 0; i <= limite; i++) {
    let ok = true;
    for (let j = 0; j < assinatura.length; j++) {
      if (inicio[i + j] !== assinatura[j]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// Nome original só para exibição: tira caminho, caracteres de controle e símbolos perigosos.
// O arquivo é guardado com um identificador gerado pelo sistema, nunca com este nome.
export function sanitizarNomeOriginal(nome: string | null | undefined): string {
  let n = String(nome || "").split(/[\\/]/).pop() || "";
  n = n.normalize("NFC").replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "").replace(/\s+/g, " ").trim();
  n = n.replace(/^\.+/, "");
  if (!n.toLowerCase().endsWith(".pdf")) n = `${n || "documento"}.pdf`;
  if (n.length > 200) n = `${n.slice(0, 196)}.pdf`;
  return n;
}

export function formatarTamanho(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ResultadoPedido =
  | { ok: true; nome: string; tamanho: number; tipo: TipoDocumento; vinculo: Vinculo }
  | { ok: false; erro: string };

function id(valor: unknown): number | null {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Valida o pedido de envio (antes do arquivo sair do navegador).
export function validarPedidoEnvio(body: unknown): ResultadoPedido {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const vinculo: Vinculo = { locacao_id: id(b.locacao_id), cliente_id: id(b.cliente_id), imovel_id: id(b.imovel_id) };
  if (!vinculo.locacao_id && !vinculo.cliente_id && !vinculo.imovel_id) {
    return { ok: false, erro: "O documento precisa estar vinculado a um contrato, cliente ou imóvel." };
  }
  const tipo = (TIPOS_DOCUMENTO as readonly string[]).includes(String(b.tipo)) ? (b.tipo as TipoDocumento) : null;
  if (!tipo) return { ok: false, erro: "Escolha o tipo do documento." };

  const nomeBruto = String(b.nome || "");
  if (!/\.pdf$/i.test(nomeBruto.trim())) return { ok: false, erro: `"${nomeBruto || "Arquivo"}" não é PDF. Só arquivos PDF são aceitos.` };

  const tamanho = Number(b.tamanho);
  if (!Number.isInteger(tamanho) || tamanho <= 0) return { ok: false, erro: "O arquivo está vazio." };
  if (tamanho > TAMANHO_MAXIMO_DOCUMENTO) {
    return { ok: false, erro: `"${nomeBruto}" tem ${formatarTamanho(tamanho)}. O limite é ${TAMANHO_MAXIMO_TEXTO}.` };
  }
  return { ok: true, nome: sanitizarNomeOriginal(nomeBruto), tamanho, tipo, vinculo };
}

// Conferência rápida no navegador, antes de pedir a URL de envio (o servidor confere de novo).
export async function conferirArquivoNoNavegador(arquivo: File): Promise<string | null> {
  if (!/\.pdf$/i.test(arquivo.name)) return `"${arquivo.name}" não é PDF. Só arquivos PDF são aceitos.`;
  if (arquivo.size === 0) return `"${arquivo.name}" está vazio.`;
  if (arquivo.size > TAMANHO_MAXIMO_DOCUMENTO) {
    return `"${arquivo.name}" tem ${formatarTamanho(arquivo.size)}. O limite é ${TAMANHO_MAXIMO_TEXTO}.`;
  }
  const inicio = new Uint8Array(await arquivo.slice(0, 1029).arrayBuffer());
  if (!ehPdf(inicio)) return `"${arquivo.name}" tem extensão .pdf, mas o conteúdo não é de um PDF.`;
  return null;
}

// Nome de arquivo para o cabeçalho Content-Disposition (ASCII + versão UTF-8).
export function contentDisposition(modo: "inline" | "attachment", nome: string): string {
  const ascii = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${modo}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nome)}`;
}
