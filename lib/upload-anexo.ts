import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const TAMANHO_MAXIMO_ANEXO = 15 * 1024 * 1024; // 15MB

function sanitizarNome(nome: string) {
  const semAcentos = nome
    .normalize("NFD")
    .split("")
    .filter((ch) => ch.charCodeAt(0) < 0x300 || ch.charCodeAt(0) > 0x36f)
    .join("");
  return semAcentos.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

// Envia o arquivo original (PDF, DOC, imagem, etc.) sem nenhum processamento —
// diferente do /api/upload, que é específico para fotos de imóveis (converte pra webp, aplica marca d'água).
export async function enviarAnexoParaR2(file: File, pastaPrefixo: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const nomeOriginal = file.name || "arquivo";
  const chave = `${pastaPrefixo}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizarNome(nomeOriginal)}`;

  await R2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: chave,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    })
  );

  return {
    url: `${process.env.NEXT_PUBLIC_R2_URL}/${chave}`,
    nomeOriginal,
    tipo: file.type || "application/octet-stream",
    tamanho: buffer.length,
  };
}

export async function excluirAnexoDoR2(url: string) {
  const prefixo = `${process.env.NEXT_PUBLIC_R2_URL}/`;
  if (!url.startsWith(prefixo)) return;
  const chave = url.slice(prefixo.length);
  await R2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: chave }));
}
