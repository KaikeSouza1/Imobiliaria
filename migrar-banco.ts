import { Pool } from 'pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// 1. CONFIGURAÇÃO DO BANCO (PG PURO)
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

// 2. CONFIGURAÇÃO DO CLOUDFLARE R2
// Limpeza automática de aspas/espaços das chaves novas
const r2AccountId = (process.env.R2_ACCOUNT_ID || '').replace(/['"]/g, '').trim();
const r2AccessKeyId = (process.env.R2_ACCESS_KEY_ID || '').replace(/['"]/g, '').trim();
const r2SecretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').replace(/['"]/g, '').trim();
const bucketName = (process.env.R2_BUCKET_NAME || 'imobiliaria').replace(/['"]/g, '').trim();
const r2PublicUrl = (process.env.NEXT_PUBLIC_R2_URL || '').replace(/['"]/g, '').trim();

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
  forcePathStyle: true, // Necessário para o Cloudflare aceitar a conexão
});

// 3. FUNÇÃO PARA TRANSFERIR DO CLOUDINARY PARA R2
async function transferirImagemParaR2(urlAntiga: string): Promise<string> {
  // Se não for do cloudinary, mantém a URL original
  if (!urlAntiga || !urlAntiga.includes('cloudinary')) return urlAntiga;

  try {
    const resposta = await fetch(urlAntiga);
    if (!resposta.ok) throw new Error(`Falha ao baixar imagem: ${resposta.statusText}`);
    
    const arrayBuffer = await resposta.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Gera um nome de arquivo único baseado no timestamp
    const extensao = urlAntiga.split('.').pop()?.split('?')[0] || 'jpg';
    const nomeArquivo = `imovel-${Date.now()}-${Math.random().toString(36).substring(7)}.${extensao}`;

    // Upload para o bucket do R2
    await r2.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: nomeArquivo,
      Body: buffer,
      ContentType: resposta.headers.get('content-type') || 'image/jpeg',
    }));

    // Retorna a nova URL pública do Cloudflare
    return `${r2PublicUrl}/${nomeArquivo}`;
  } catch (erro) {
    console.error(`Erro ao processar imagem ${urlAntiga}:`, erro);
    throw erro; 
  }
}

// 4. LOOP DE MIGRAÇÃO NO BANCO DE DADOS
async function rodarMigracao() {
  try {
    console.log("🚀 Iniciando migração de imagens...");

    // Migrar capas dos imóveis
    const imoveis = await pool.query(
      "SELECT id, imagem_url FROM public.imoveis WHERE imagem_url LIKE '%cloudinary%'"
    );
    console.log(`Encontrados ${imoveis.rowCount} imóveis para atualizar.`);

    for (const row of imoveis.rows) {
      try {
        const novaUrl = await transferirImagemParaR2(row.imagem_url);
        await pool.query("UPDATE public.imoveis SET imagem_url = $1 WHERE id = $2", [novaUrl, row.id]);
        console.log(`✅ Imóvel ID ${row.id} atualizado.`);
      } catch (e) {
        console.error(`❌ Falha no imóvel ID ${row.id}`);
      }
    }

    // Migrar fotos da galeria
    const fotos = await pool.query(
      "SELECT id, url FROM public.imovel_fotos WHERE url LIKE '%cloudinary%'"
    );
    console.log(`Encontradas ${fotos.rowCount} fotos de galeria para atualizar.`);

    for (const row of fotos.rows) {
      try {
        const novaUrl = await transferirImagemParaR2(row.url);
        await pool.query("UPDATE public.imovel_fotos SET url = $1 WHERE id = $2", [novaUrl, row.id]);
        console.log(`✅ Foto ID ${row.id} atualizada.`);
      } catch (e) {
        console.error(`❌ Falha na foto ID ${row.id}`);
      }
    }

    console.log("\n✨ Migração finalizada com sucesso!");
  } catch (erro) {
    console.error("Erro fatal durante a migração:", erro);
  } finally {
    await pool.end();
  }
}

rodarMigracao();