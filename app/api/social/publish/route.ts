// ARQUIVO: app/api/social/publish/route.ts

import { NextRequest, NextResponse } from "next/server";

const PAGE_TOKEN = process.env.META_PAGE_ACCESS_TOKEN!;
const PAGE_ID = process.env.META_PAGE_ID!;
const IG_ACCOUNT_ID = process.env.META_INSTAGRAM_ACCOUNT_ID!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

// Busca fotos do imóvel via Supabase REST API (sem pacote externo)
async function buscarFotos(imovel: any): Promise<string[]> {
  const fotos: string[] = [];

  if (imovel.fotoCapa) fotos.push(imovel.fotoCapa);

  if (!imovel.id || imovel.id === "novo") return fotos;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return fotos;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/imovel_fotos?imovel_id=eq.${imovel.id}&select=url&order=id.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      data.forEach((f: any) => {
        if (f.url && !fotos.includes(f.url)) fotos.push(f.url);
      });
    }
  } catch (e) {
    console.error("Erro ao buscar fotos:", e);
  }

  return fotos;
}

function formatarMensagem(imovel: any): string {
  const finalidade = imovel.finalidade === "Venda" ? "🏷️ VENDA" : "🔑 LOCAÇÃO";
  const preco = imovel.preco
    ? `R$ ${Number(imovel.preco).toLocaleString("pt-BR")}`
    : "Consulte";

  const linkImovel = `${SITE_URL}/imoveis/${imovel.id}`;

  const linhas = [
    `${finalidade} — ${imovel.tipo}`,
    ``,
    `📍 ${imovel.bairro}, ${imovel.cidade}/PR`,
    `💰 ${preco}`,
  ];

  if (imovel.area) linhas.push(`📐 ${imovel.area}m²`);
  if (imovel.quartos) linhas.push(`🛏️ ${imovel.quartos} quarto(s)`);
  if (imovel.banheiros) linhas.push(`🚿 ${imovel.banheiros} banheiro(s)`);
  if (imovel.vagas) linhas.push(`🚗 ${imovel.vagas} vaga(s)`);

  if (imovel.descricao) {
    linhas.push(``);
    linhas.push(imovel.descricao.substring(0, 250) + "...");
  }

  linhas.push(``);
  linhas.push(`🔗 ${linkImovel}`);
  linhas.push(``);
  linhas.push(`#imoveis #ImobiliariaPortoIguacu #PortoUniao #${(imovel.tipo || "imovel").replace(/\s/g, "")} #imobiliaria`);

  return linhas.join("\n");
}

// ============================================================
// FACEBOOK
// ============================================================
async function publishFacebook(imovel: any, fotos: string[]) {
  const mensagem = formatarMensagem(imovel);

  if (fotos.length <= 1) {
    const res = await fetch(
      `https://graph.facebook.com/v22.0/${PAGE_ID}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: fotos[0],
          caption: mensagem,
          access_token: PAGE_TOKEN,
        }),
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(`Facebook: ${data.error.message}`);
    return data;
  }

  // Múltiplas fotos — sobe cada uma sem publicar
  const fotoIds: string[] = [];
  for (const url of fotos.slice(0, 10)) {
    const r = await fetch(
      `https://graph.facebook.com/v22.0/${PAGE_ID}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, published: false, access_token: PAGE_TOKEN }),
      }
    );
    const d = await r.json();
    if (d.id) fotoIds.push(d.id);
  }

  const postRes = await fetch(
    `https://graph.facebook.com/v22.0/${PAGE_ID}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: mensagem,
        attached_media: fotoIds.map((id) => ({ media_fbid: id })),
        access_token: PAGE_TOKEN,
      }),
    }
  );
  const postData = await postRes.json();
  if (postData.error) throw new Error(`Facebook: ${postData.error.message}`);
  return postData;
}

// ============================================================
// INSTAGRAM
// ============================================================
async function publishInstagram(imovel: any, fotos: string[]) {
  const mensagem = formatarMensagem(imovel);
  const fotosParaUsar = fotos.slice(0, 10);

  if (fotosParaUsar.length <= 1) {
    // Post simples
    const containerRes = await fetch(
      `https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: fotosParaUsar[0],
          caption: mensagem,
          access_token: PAGE_TOKEN,
        }),
      }
    );
    const container = await containerRes.json();
    if (container.error) throw new Error(`Instagram container: ${container.error.message}`);
    if (!container.id) throw new Error(`Instagram: container sem ID`);

    await new Promise((r) => setTimeout(r, 5000));

    const publishRes = await fetch(
      `https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: container.id, access_token: PAGE_TOKEN }),
      }
    );
    const published = await publishRes.json();
    if (published.error) throw new Error(`Instagram publish: ${published.error.message}`);
    return published;
  }

  // Carrossel
  const itemIds: string[] = [];
  for (const url of fotosParaUsar) {
    const r = await fetch(
      `https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: url,
          is_carousel_item: true,
          access_token: PAGE_TOKEN,
        }),
      }
    );
    const d = await r.json();
    if (d.id) itemIds.push(d.id);
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (itemIds.length === 0) throw new Error("Instagram: nenhum item de carrossel criado");

  await new Promise((r) => setTimeout(r, 5000));

  const carrosselRes = await fetch(
    `https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: itemIds,
        caption: mensagem,
        access_token: PAGE_TOKEN,
      }),
    }
  );
  const carrossel = await carrosselRes.json();
  if (carrossel.error) throw new Error(`Instagram carrossel: ${carrossel.error.message}`);

  await new Promise((r) => setTimeout(r, 3000));

  const publishRes = await fetch(
    `https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: carrossel.id, access_token: PAGE_TOKEN }),
    }
  );
  const published = await publishRes.json();
  if (published.error) throw new Error(`Instagram carrossel publish: ${published.error.message}`);
  return published;
}

// ============================================================
// HANDLER
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { imovel, publicarFacebook, publicarInstagram } = await req.json();

    if (!imovel?.fotoCapa) {
      return NextResponse.json({ sucesso: false, erro: "Imóvel sem foto de capa" }, { status: 400 });
    }

    const fotos = await buscarFotos(imovel);
    console.log(`Fotos para publicar: ${fotos.length}`);

    const resultados: any = {};
    const erros: any = {};

    if (publicarFacebook) {
      try { resultados.facebook = await publishFacebook(imovel, fotos); }
      catch (e: any) { erros.facebook = e.message; }
    }

    if (publicarInstagram) {
      try { resultados.instagram = await publishInstagram(imovel, fotos); }
      catch (e: any) { erros.instagram = e.message; }
    }

    const temErro = Object.keys(erros).length > 0;
    const temSucesso = Object.keys(resultados).length > 0;

    return NextResponse.json({
      sucesso: temSucesso,
      parcial: temSucesso && temErro,
      resultados,
      erros: temErro ? erros : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
}