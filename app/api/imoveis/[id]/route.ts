import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const destaque = body.destaque || false; // Adicionado
    const ativo = body.ativo !== undefined ? body.ativo : true;
    const latitude = body.latitude || -26.2303;
    const longitude = body.longitude || -51.0904;

    const sql = `
      UPDATE imoveis SET 
        titulo=$1, descricao=$2, preco=$3, tipo=$4, finalidade=$5, 
        cidade=$6, bairro=$7, endereco=$8, area=$9, quartos=$10, 
        banheiros=$11, vagas=$12, imagem_url=$13, codigo=$14, ativo=$15, 
        status=$16, latitude=$17, longitude=$18, destaque=$19
      WHERE id = $20
    `;

    await query(sql, [
      body.titulo, body.descricao, preco, body.tipo, body.finalidade,
      body.cidade, body.bairro, body.endereco, area, quartos,
      banheiros, vagas, body.imagem_url, body.codigo, ativo, 
      status, latitude, longitude, destaque, id
    ]);

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
    await query("DELETE FROM imoveis WHERE id = $1", [id]);
    return NextResponse.json({ message: "Excluído!" });
  } catch (error: any) {
    console.error("ERRO NO DELETE:", error?.message || error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}