// ARQUIVO: app/api/social/publish/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PAGE_TOKEN = process.env.META_PAGE_ACCESS_TOKEN!;
const PAGE_ID = process.env.META_PAGE_ID!;
const IG_ACCOUNT_ID = process.env.META_INSTAGRAM_ACCOUNT_ID!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Busca todas as fotos do imóvel (capa + galeria)
async function buscarFotos(imovel: any): Promise<string[]> {
  const fotos: string[] = [];

  // Sempre começa pela capa
  if (imovel.fotoCapa) fotos.push(imovel.fotoCapa);

  // Busca fotos adicionais na tabela imovel_fotos
  if (imovel.id && imovel.id !== "novo") {
    const { data, error } = await supabase
      .from("imovel_fotos")
      .select("url")
      .eq("imovel_id", imovel.id)
      .order("id", { ascending: true });

    if (!error && data) {
      data.forEach((f: any) => {
        if (f.url && !fotos.includes(f.url)) {
          fotos.push(f.url);
        }
      });
    }
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
    // Post simples com 1 foto
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

  // Múltiplas fotos — publica cada uma sem publicar, depois cria o post
  const fotoIds: string[] = [];
  const fotosParaUsar = fotos.slice(0, 10); // Facebook aceita até 10

  for (const url of fotosParaUsar) {
    const r = await fetch(
      `https://graph.facebook.com/v22.0/${PAGE_ID}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          published: false,
          access_token: PAGE_TOKEN,
        }),
      }
    );
    const d = await r.json();
    if (d.id) fotoIds.push(d.id);
  }

  // Post com todas as fotos
  const attached = fotoIds.map((id) => ({ media_fbid: id }));
  const postRes = await fetch(
    `https://graph.facebook.com/v22.0/${PAGE_ID}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: mensagem,
        attached_media: attached,
        access_token: PAGE_TOKEN,
      }),
    }
  );
  const postData = await postRes.json();
  if (postData.error) throw new Error(`Facebook multi-foto: ${postData.error.message}`);
  return postData;
}

// ============================================================
// INSTAGRAM
// ============================================================
async function publishInstagram(imovel: any, fotos: string[]) {
  const mensagem = formatarMensagem(imovel);
  const fotosParaUsar = fotos.slice(0, 10); // Instagram aceita até 10 no carrossel

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
        body: JSON.stringify({
          creation_id: container.id,
          access_token: PAGE_TOKEN,
        }),
      }
    );
    const published = await publishRes.json();
    if (published.error) throw new Error(`Instagram publish: ${published.error.message}`);
    return published;
  }

  // Carrossel com múltiplas fotos
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
    await new Promise((res) => setTimeout(res, 1000));
  }

  if (itemIds.length === 0) throw new Error("Instagram: nenhum item de carrossel criado");

  // Aguardar processamento
  await new Promise((r) => setTimeout(r, 5000));

  // Criar container do carrossel
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

  // Publicar carrossel
  const publishRes = await fetch(
    `https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: carrossel.id,
        access_token: PAGE_TOKEN,
      }),
    }
  );
  const published = await publishRes.json();
  if (published.error) throw new Error(`Instagram carrossel publish: ${published.error.message}`);
  return published;
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { imovel, publicarFacebook, publicarInstagram } = await req.json();

    if (!imovel?.fotoCapa) {
      return NextResponse.json({ sucesso: false, erro: "Imóvel sem foto de capa" }, { status: 400 });
    }

    // Busca todas as fotos do imóvel
    const fotos = await buscarFotos(imovel);
    console.log(`Total de fotos para publicar: ${fotos.length}`);

    const resultados: any = {};
    const erros: any = {};

    if (publicarFacebook) {
      try {
        resultados.facebook = await publishFacebook(imovel, fotos);
      } catch (e: any) {
        erros.facebook = e.message;
      }
    }

    if (publicarInstagram) {
      try {
        resultados.instagram = await publishInstagram(imovel, fotos);
      } catch (e: any) {
        erros.instagram = e.message;
      }
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