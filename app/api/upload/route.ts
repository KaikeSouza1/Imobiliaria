import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    // Pega todos os arquivos enviados com o nome 'file'
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const urls: string[] = [];

    // Loop para enviar cada arquivo para o Cloudinary
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'imoveis-porto-iguacu' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      urls.push(result.secure_url);
    }

    // Retorna a lista de links gerados
    return NextResponse.json({ urls });
    
  } catch (error) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Erro ao processar upload' }, { status: 500 });
  }
}