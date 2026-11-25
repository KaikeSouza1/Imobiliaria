// Acesso ao bucket PRIVADO de documentos no Cloudflare R2. Só usar no servidor.
// Usa um token restrito a este bucket (variáveis R2_DOCUMENTOS_*), separado do bucket público das fotos.
import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID, createHash } from "node:crypto";
import type { Readable } from "node:stream";

const limpar = (v: string | undefined) => (v || "").replace(/['"]/g, "").trim();

let cliente: S3Client | null = null;
function s3() {
  if (!cliente) {
    const conta = limpar(process.env.R2_ACCOUNT_ID);
    const chave = limpar(process.env.R2_DOCUMENTOS_ACCESS_KEY_ID);
    const segredo = limpar(process.env.R2_DOCUMENTOS_SECRET_ACCESS_KEY);
    if (!conta || !chave || !segredo || !bucket()) {
      throw new Error("Armazenamento de documentos não configurado (variáveis R2_DOCUMENTOS_*).");
    }
    cliente = new S3Client({
      region: "auto",
      endpoint: `https://${conta}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: chave, secretAccessKey: segredo },
    });
  }
  return cliente;
}

function bucket() {
  return limpar(process.env.R2_DOCUMENTOS_BUCKET);
}

// Identificador gerado pelo sistema; o nome enviado pelo usuário nunca vira chave.
export function novaChave() {
  return `documentos/${randomUUID()}.pdf`;
}

const RE_CHAVE = /^documentos\/[0-9a-f-]{36}\.pdf$/;
function conferirChave(chave: string) {
  if (!RE_CHAVE.test(chave)) throw new Error("Chave de armazenamento inválida.");
}

// URL temporária para o navegador enviar o arquivo direto ao R2 (evita o limite de 4,5 MB da Vercel).
// O tamanho e o tipo entram na assinatura: outro tamanho ou tipo é recusado pelo R2.
export async function urlDeEnvio(chave: string, tamanho: number) {
  conferirChave(chave);
  return getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: bucket(), Key: chave, ContentType: "application/pdf", ContentLength: tamanho }),
    { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) }
  );
}

// URL de leitura de vida curtíssima, gerada só depois de conferir login e permissão.
export async function urlDeLeitura(chave: string, disposition: string, segundos = 60) {
  conferirChave(chave);
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: chave,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: disposition,
      ResponseCacheControl: "private, no-store",
    }),
    { expiresIn: segundos }
  );
}

export async function tamanhoDoObjeto(chave: string): Promise<number | null> {
  conferirChave(chave);
  try {
    const r = await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: chave }));
    return r.ContentLength ?? null;
  } catch (e) {
    if ((e as { name?: string }).name === "NotFound") return null;
    throw e;
  }
}

// Lê o objeto inteiro em fluxo: devolve os primeiros bytes (para conferir a assinatura) e o SHA-256.
export async function analisarObjeto(chave: string) {
  conferirChave(chave);
  const r = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: chave }));
  const hash = createHash("sha256");
  const inicio: Buffer[] = [];
  let lidosInicio = 0;
  let total = 0;
  for await (const parte of r.Body as Readable) {
    const buf = parte as Buffer;
    hash.update(buf);
    total += buf.length;
    if (lidosInicio < 1029) {
      inicio.push(buf.subarray(0, 1029 - lidosInicio));
      lidosInicio += Math.min(buf.length, 1029 - lidosInicio);
    }
  }
  return { sha256: hash.digest("hex"), inicio: new Uint8Array(Buffer.concat(inicio)), tamanho: total };
}

// Envio direto pelo servidor (usado pela importação em lote, que roda fora da Vercel).
export async function enviarDoServidor(chave: string, conteudo: Buffer) {
  conferirChave(chave);
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: chave, Body: conteudo, ContentType: "application/pdf" }));
}

// Só usado para descartar envios recusados na conferência. Documentos aceitos nunca são apagados (exclusão lógica).
export async function descartarEnvio(chave: string) {
  conferirChave(chave);
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: chave }));
}
