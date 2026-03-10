import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function gerarNomeArquivo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `imovel-${timestamp}-${random}.webp`;
}

async function otimizarComMarcaDagua(buffer: Buffer): Promise<Buffer> {
  // Lê o logo da pasta public
  const logoPath = path.join(process.cwd(), "public", "logo_nova.png");
  const logoBuffer = fs.readFileSync(logoPath);

  // Pega dimensões da imagem principal
  const imagem = sharp(buffer);
  const { width = 1280, height = 960 } = await imagem.metadata();

  // Redimensiona o logo para 35% da largura da imagem
  const logoWidth = Math.round(width * 0.35);
  const logoResized = await sharp(logoBuffer)
    .resize(logoWidth)
    .composite([]) // mantém transparência
    .png()
    .toBuffer();

  // Pega dimensões do logo já redimensionado
  const { width: lw = 0, height: lh = 0 } = await sharp(logoResized).metadata();

  // Centraliza
  const left = Math.round((width - lw) / 2);
  const top = Math.round((height - lh) / 2);

  return imagem
    .resize({
      width: 1280,
      height: 960,
      fit: "inside",
      withoutEnlargement: true,
    })
    .composite([
      {
        input: logoResized,
        left,
        top,
        blend: "over",
      },
    ])
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const bufferOriginal = Buffer.from(arrayBuffer);

      const bufferFinal = await otimizarComMarcaDagua(bufferOriginal);
      const fileName = gerarNomeArquivo();

      await R2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: fileName,
          Body: bufferFinal,
          ContentType: "image/webp",
        })
      );

      urls.push(`${process.env.NEXT_PUBLIC_R2_URL}/${fileName}`);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Erro no upload R2:", error);
    return NextResponse.json({ error: "Erro ao processar upload" }, { status: 500 });
  }
}