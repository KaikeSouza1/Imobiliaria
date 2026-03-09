import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import sharp from "sharp";

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
  // Sempre salva como webp após conversão
  return `imovel-${timestamp}-${random}.webp`;
}

async function otimizarImagem(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({
      width: 1280,        // Máximo 1280px de largura
      height: 960,        // Máximo 960px de altura
      fit: "inside",      // Mantém proporção, não corta
      withoutEnlargement: true, // Nunca aumenta imagem pequena
    })
    .webp({
      quality: 82,        // Boa qualidade com tamanho reduzido
      effort: 4,          // Nível de compressão (0-6, mais alto = menor arquivo)
    })
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

      // Otimiza antes de enviar
      const bufferOtimizado = await otimizarImagem(bufferOriginal);

      const fileName = gerarNomeArquivo();

      await R2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: fileName,
          Body: bufferOtimizado,
          ContentType: "image/webp",
        })
      );

      const url = `${process.env.NEXT_PUBLIC_R2_URL}/${fileName}`;
      urls.push(url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Erro no upload R2:", error);
    return NextResponse.json({ error: "Erro ao processar upload" }, { status: 500 });
  }
}