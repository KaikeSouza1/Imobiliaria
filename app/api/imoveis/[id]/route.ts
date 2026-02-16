import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET: Puxa as informações do banco para o formulário
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // CORREÇÃO: No Next.js 15+ precisamos dar await no params
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
    console.error("Erro ao buscar imóvel:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

// PUT: Salva as alterações
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const preco = parseFloat(body.preco) || 0;
    const area = parseInt(body.area) || 0;
    const quartos = parseInt(body.quartos) || 0;
    const banheiros = parseInt(body.banheiros) || 0;
    const vagas = parseInt(body.vagas) || 0;

    const sql = `
      UPDATE imoveis SET 
      titulo=$1, descricao=$2, preco=$3, tipo=$4, finalidade=$5, cidade=$6, bairro=$7, 
      endereco=$8, area=$9, quartos=$10, banheiros=$11, vagas=$12, imagem_url=$13, codigo=$14, ativo=$15
      WHERE id = $16
    `;

    await query(sql, [
      body.titulo, body.descricao, preco, body.tipo, body.finalidade, body.cidade, 
      body.bairro, body.endereco, area, quartos, banheiros, vagas, body.imagem_url, body.codigo, 
      body.ativo, id
    ]);

    return NextResponse.json({ message: "Atualizado com sucesso!" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar no banco" }, { status: 500 });
  }
}

// DELETE: Exclui o imóvel
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query("DELETE FROM imoveis WHERE id = $1", [id]);
    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}