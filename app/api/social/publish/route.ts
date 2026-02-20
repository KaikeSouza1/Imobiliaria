// ARQUIVO: app/api/social/publish/route.ts

import { NextRequest, NextResponse } from "next/server";

const PAGE_TOKEN = process.env.META_PAGE_ACCESS_TOKEN!;
const PAGE_ID = process.env.META_PAGE_ID!;
const IG_ACCOUNT_ID = process.env.META_INSTAGRAM_ACCOUNT_ID!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

function formatarMensagem(imovel: any): string {
  const finalidade = imovel.finalidade === "Venda" ? "🏷️ VENDA" : "🔑 LOCAÇÃO";
  const preco = imovel.preco
    ? `R$ ${Number(imovel.preco).toLocaleString("pt-BR")}`
    : "Consulte";

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
    linhas.push(imovel.descricao.substring(0, 300) + "...");
  }

  linhas.push(``);
  linhas.push(`#imoveis #ImobiliariaPortoIguacu #${imovel.cidade?.replace(/\s/g, "") ?? "PortoUniao"} #${imovel.tipo?.replace(/\s/g, "") ?? "imovel"} #imobiliaria`);

  return linhas.join("\n");
}

async function publishFacebook(imovel: any) {
  const mensagem = formatarMensagem(imovel);
  const linkImovel = `${SITE_URL}/imoveis/${imovel.id}`;
  const fotoUrl = imovel.fotoCapa;

  const res = await fetch(
    `https://graph.facebook.com/v22.0/${PAGE_ID}/photos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: fotoUrl,
        caption: `${mensagem}\n\n🔗 ${linkImovel}`,
        access_token: PAGE_TOKEN,
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(`Facebook: ${data.error.message}`);
  return data;
}

async function publishInstagram(imovel: any) {
  const mensagem = formatarMensagem(imovel);
  const fotoUrl = imovel.fotoCapa;

  // Etapa 1: Criar container de mídia
  const containerRes = await fetch(
    `https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: fotoUrl,
        caption: `${mensagem}\n\n🔗 Link na bio!`,
        access_token: PAGE_TOKEN,
      }),
    }
  );

  const container = await containerRes.json();
  if (container.error) throw new Error(`Instagram container: ${container.error.message}`);
  if (!container.id) throw new Error("Instagram: falha ao criar container");

  // Aguardar processamento
  await new Promise((r) => setTimeout(r, 4000));

  // Etapa 2: Verificar status do container
  const statusRes = await fetch(
    `https://graph.facebook.com/v22.0/${container.id}?fields=status_code&access_token=${PAGE_TOKEN}`
  );
  const status = await statusRes.json();

  if (status.status_code === "ERROR") {
    throw new Error("Instagram: erro no processamento da imagem");
  }

  // Etapa 3: Publicar
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

export async function POST(req: NextRequest) {
  try {
    const { imovel, publicarFacebook, publicarInstagram } = await req.json();

    if (!imovel?.fotoCapa) {
      return NextResponse.json(
        { sucesso: false, erro: "Imóvel sem foto de capa" },
        { status: 400 }
      );
    }

    const resultados: any = {};
    const erros: any = {};

    if (publicarFacebook) {
      try {
        resultados.facebook = await publishFacebook(imovel);
      } catch (e: any) {
        erros.facebook = e.message;
      }
    }

    if (publicarInstagram) {
      try {
        resultados.instagram = await publishInstagram(imovel);
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
    return NextResponse.json(
      { sucesso: false, erro: error.message },
      { status: 500 }
    );
  }
}