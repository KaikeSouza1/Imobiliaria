import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // INCREMENTA AS VISUALIZAÇÕES TODA VEZ QUE A PÁGINA É ACESSADA
    await query("UPDATE imoveis SET visualizacoes = COALESCE(visualizacoes, 0) + 1 WHERE id = $1", [id]);

    const res = await query("SELECT * FROM imoveis WHERE id = $1", [id]);
    
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
    }

    const fotos = await query("SELECT url FROM imovel_fotos WHERE imovel_id = $1", [id]);
    
    const imovel = res.rows[0];
    imovel.fotos_adicionais = fotos.rows.map((f: any) => f.url);

    return NextResponse.json(imovel);
  } catch (error) {
    console.error("ERRO NO GET:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const preco = parseFloat(body.preco) || 0;
    const area = parseInt(body.area) || 0;
    const quartos = parseInt(body.quartos) || 0;
    const banheiros = parseInt(body.banheiros) || 0;
    const vagas = parseInt(body.vagas) || 0;
    const status = body.status || "disponivel";
    const destaque = body.destaque || false; 
    const ativo = body.ativo !== undefined ? body.ativo : true;
    const latitude = body.latitude || -26.2303;
    const longitude = body.longitude || -51.0904;

    const sql = `
      UPDATE imoveis SET 
        titulo=$1, descricao=$2, preco=$3, tipo=$4, finalidade=$5, 
        cidade=$6, bairro=$7, endereco=$8, area=$9, quartos=$10, 
        banheiros=$11, vagas=$12, imagem_url=$13, codigo=$14, ativo=$15, 
        status=$16, latitude=$17, longitude=$18, destaque=$19, video_url=$20
      WHERE id = $21
    `;

    // 1. Atualiza os dados principais na tabela imoveis
    await query(sql, [
      body.titulo, body.descricao, preco, body.tipo, body.finalidade,
      body.cidade, body.bairro, body.endereco, area, quartos,
      banheiros, vagas, body.imagem_url, body.codigo, ativo, 
      status, latitude, longitude, destaque, body.video_url, id
    ]);

    // 2. ATUALIZAÇÃO DA GALERIA (Fotos Adicionais)
    // Primeiro, removemos todas as fotos atuais deste imóvel na tabela de fotos
    await query("DELETE FROM imovel_fotos WHERE imovel_id = $1", [id]);

    // Depois, inserimos a nova lista de URLs que veio do formulário (sem a foto que você excluiu)
    const fotosAdicionais = body.fotos_adicionais || [];
    for (const url of fotosAdicionais) {
      await query("INSERT INTO imovel_fotos (imovel_id, url) VALUES ($1, $2)", [id, url]);
    }

    return NextResponse.json({ message: "Atualizado!" });

  } catch (error: any) {
    console.error("❌ ERRO NO PUT:", error?.message || error);
    return NextResponse.json(
      { error: "Erro ao atualizar", detail: error?.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Se você não tiver um ON DELETE CASCADE no banco, é bom deletar as fotos antes do imóvel
    await query("DELETE FROM imovel_fotos WHERE imovel_id = $1", [id]);
    await query("DELETE FROM imoveis WHERE id = $1", [id]);
    return NextResponse.json({ message: "Excluído!" });
  } catch (error: any) {
    console.error("ERRO NO DELETE:", error?.message || error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}