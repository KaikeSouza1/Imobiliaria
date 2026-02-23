import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const PAGE_TOKEN = process.env.META_PAGE_ACCESS_TOKEN!;
const PAGE_ID = process.env.META_PAGE_ID!;
const IG_ACCOUNT_ID = process.env.META_INSTAGRAM_ACCOUNT_ID!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: false,
});

async function buscarFotos(imovelId: string): Promise<string[]> {
  try {
    const idInt = parseInt(imovelId);
    if (isNaN(idInt)) return [];

    const result = await pool.query(
      "SELECT url FROM imovel_fotos WHERE imovel_id = $1 ORDER BY id ASC",
      [idInt]
    );

    return result.rows.map((r: any) => r.url).filter(Boolean);
  } catch (e) {
    console.error("Erro ao buscar fotos:", e);
    return [];
  }
}

function formatarLegenda(imovel: any, paraInstagram: boolean): string {
  const linkImovel = `${SITE_URL}/imovel/${imovel.id}`;

  const linhas = [
    `🏠 ${imovel.tipo} para ${imovel.finalidade}`,
    ``,
    `📍 ${imovel.bairro}, ${imovel.cidade}/PR`,
    ``,
  ];

  // Descrição do imóvel como corpo do post
  if (imovel.descricao && imovel.descricao.trim()) {
    linhas.push(imovel.descricao.trim());
    linhas.push(``);
  }

  linhas.push(`💬 Consulte todas as informações:`);

  if (paraInstagram) {
    linhas.push(`👉 Link completo na bio do perfil!`);
  } else {
    linhas.push(`👉 ${linkImovel}`);
  }

  linhas.push(``);
  linhas.push(`#imoveis #ImobiliariaPortoIguacu #PortoUniao #UniaoVitoria #${(imovel.tipo || "imovel").replace(/\s/g, "")}`);

  return linhas.join("\n");
}

// ============================================================
// FACEBOOK
// ============================================================
async function publishFacebook(imovel: any, fotos: string[]) {
  const mensagem = formatarLegenda(imovel, false);
  const fotosParaUsar = fotos.slice(0, 10);

  if (fotosParaUsar.length === 1) {
    const res = await fetch(`https://graph.facebook.com/v22.0/${PAGE_ID}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: fotosParaUsar[0],
        caption: mensagem,
        access_token: PAGE_TOKEN,
      }),
    });
    const data = await res.json();
    console.log("FB foto única:", JSON.stringify(data));
    if (data.error) throw new Error(`Facebook: ${data.error.message}`);
    return data;
  }

  const fotoIds: string[] = [];
  for (const url of fotosParaUsar) {
    const r = await fetch(`https://graph.facebook.com/v22.0/${PAGE_ID}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, published: false, access_token: PAGE_TOKEN }),
    });
    const d = await r.json();
    console.log("FB upload foto:", JSON.stringify(d));
    if (d.id) fotoIds.push(d.id);
  }

  console.log(`FB fotos enviadas: ${fotoIds.length} de ${fotosParaUsar.length}`);
  if (fotoIds.length === 0) throw new Error("Facebook: nenhuma foto enviada");

  const postRes = await fetch(`https://graph.facebook.com/v22.0/${PAGE_ID}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: mensagem,
      attached_media: fotoIds.map((id) => ({ media_fbid: id })),
      access_token: PAGE_TOKEN,
    }),
  });
  const postData = await postRes.json();
  console.log("FB post:", JSON.stringify(postData));
  if (postData.error) throw new Error(`Facebook: ${postData.error.message}`);
  return postData;
}

// ============================================================
// INSTAGRAM
// ============================================================
async function publishInstagram(imovel: any, fotos: string[]) {
  const mensagem = formatarLegenda(imovel, true);
  const fotosParaUsar = fotos.slice(0, 10);

  if (fotosParaUsar.length === 1) {
    const containerRes = await fetch(`https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: fotosParaUsar[0],
        caption: mensagem,
        access_token: PAGE_TOKEN,
      }),
    });
    const container = await containerRes.json();
    if (container.error) throw new Error(`Instagram container: ${container.error.message}`);
    if (!container.id) throw new Error(`Instagram: container sem ID`);

    await new Promise((r) => setTimeout(r, 5000));

    const publishRes = await fetch(`https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: container.id, access_token: PAGE_TOKEN }),
    });
    const published = await publishRes.json();
    if (published.error) throw new Error(`Instagram publish: ${published.error.message}`);
    return published;
  }

  const itemIds: string[] = [];
  for (const url of fotosParaUsar) {
    const r = await fetch(`https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: url,
        is_carousel_item: true,
        access_token: PAGE_TOKEN,
      }),
    });
    const d = await r.json();
    console.log("IG item:", JSON.stringify(d));
    if (d.id) itemIds.push(d.id);
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`IG itens criados: ${itemIds.length} de ${fotosParaUsar.length}`);
  if (itemIds.length === 0) throw new Error("Instagram: nenhum item de carrossel criado");

  await new Promise((r) => setTimeout(r, 5000));

  const carrosselRes = await fetch(`https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "CAROUSEL",
      children: itemIds,
      caption: mensagem,
      access_token: PAGE_TOKEN,
    }),
  });
  const carrossel = await carrosselRes.json();
  console.log("IG carrossel:", JSON.stringify(carrossel));
  if (carrossel.error) throw new Error(`Instagram carrossel: ${carrossel.error.message}`);
  if (!carrossel.id) throw new Error("Instagram: carrossel sem ID");

  await new Promise((r) => setTimeout(r, 5000));

  const publishRes = await fetch(`https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: carrossel.id, access_token: PAGE_TOKEN }),
  });
  const published = await publishRes.json();
  if (published.error) throw new Error(`Instagram carrossel publish: ${published.error.message}`);
  return published;
}

// ============================================================
// ENDPOINT: PREVIEW (GET)
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imovelId = searchParams.get("imovelId");
    const fotoCapa = searchParams.get("fotoCapa");

    if (!imovelId || !fotoCapa) {
      return NextResponse.json({ error: "imovelId e fotoCapa são obrigatórios" }, { status: 400 });
    }

    const fotosGaleria = await buscarFotos(imovelId);
    const todasFotos = [fotoCapa, ...fotosGaleria.filter((f) => f !== fotoCapa)];

    console.log(`Preview imóvel ${imovelId}: ${todasFotos.length} foto(s) encontrada(s)`);

    return NextResponse.json({
      fotos: todasFotos,
      total: todasFotos.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// ENDPOINT: PUBLICAR (POST)
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { imovel, publicarFacebook, publicarInstagram } = await req.json();

    if (!imovel?.fotoCapa) {
      return NextResponse.json({ sucesso: false, erro: "Imóvel sem foto de capa" }, { status: 400 });
    }

    const fotosGaleria = await buscarFotos(String(imovel.id));
    const todasFotos = [imovel.fotoCapa, ...fotosGaleria.filter((f) => f !== imovel.fotoCapa)];

    console.log(`Publicando imóvel ${imovel.id} com ${todasFotos.length} foto(s)`);

    const resultados: any = {};
    const erros: any = {};

    if (publicarFacebook) {
      try {
        resultados.facebook = await publishFacebook(imovel, todasFotos);
      } catch (e: any) {
        erros.facebook = e.message;
      }
    }

    if (publicarInstagram) {
      try {
        resultados.instagram = await publishInstagram(imovel, todasFotos);
      } catch (e: any) {
        erros.instagram = e.message;
      }
    }

    const temErro = Object.keys(erros).length > 0;
    const temSucesso = Object.keys(resultados).length > 0;

    return NextResponse.json({
      sucesso: temSucesso && !temErro,
      parcial: temSucesso && temErro,
      resultados,
      erros: temErro ? erros : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
}