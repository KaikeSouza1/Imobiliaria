import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Forçamos a limpeza de qualquer aspa, espaço ou caractere zoado que venha do .env
const accountId = (process.env.R2_ACCOUNT_ID || '').replace(/['"]/g, '').trim();
const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').replace(/['"]/g, '').trim();
const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').replace(/['"]/g, '').trim();
const bucketName = (process.env.R2_BUCKET_NAME || 'imobiliaria').replace(/['"]/g, '').trim();

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  forcePathStyle: true, // Obrigatório para o Cloudflare
});

async function testarConexao() {
  console.log("⏳ Testando conexão com o Cloudflare R2...");
  console.log(`🔗 Endpoint: https://${accountId}.r2.cloudflarestorage.com\n`);

  try {
    // Tenta listar apenas 1 objeto do bucket para validar a assinatura
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1
    });
    const response = await r2.send(command);
    
    console.log("✅ SUCESSO! A conexão com o Cloudflare R2 está funcionando perfeitamente.");
    console.log(`Status HTTP: ${response.$metadata.httpStatusCode}`);
  } catch (error) {
    console.error("❌ ERRO DE CONEXÃO (Veja os detalhes abaixo):");
    console.error(error);
  }
}

testarConexao();