import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET: Buscar um único imóvel (para preencher o formulário de edição)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await query("SELECT * FROM imoveis WHERE id = $1", [id]);
    const fotos = await query("SELECT url FROM imovel_fotos WHERE imovel_id = $1", [id]);

    if (res.rows.length === 0) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const imovel = res.rows[0];
    imovel.fotos_adicionais = fotos.rows.map((f: { url: string }) => f.url);

    return NextResponse.json(imovel);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}

// PUT: Atualizar dados (incluindo Inativar/Ativar)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      titulo, descricao, preco, tipo, finalidade, cidade, bairro,
      endereco, area, quartos, banheiros, vagas, imagem_url, codigo, ativo
    } = body;

    const sql = `
      UPDATE imoveis SET 
      titulo=$1, descricao=$2, preco=$3, tipo=$4, finalidade=$5, cidade=$6, bairro=$7, 
      endereco=$8, area=$9, quartos=$10, banheiros=$11, vagas=$12, imagem_url=$13, codigo=$14, ativo=$15
      WHERE id = $16
    `;

    await query(sql, [
      titulo, descricao, preco, tipo, finalidade, cidade, bairro,
      endereco, area, quartos, banheiros, vagas, imagem_url, codigo, ativo, id
    ]);

    return NextResponse.json({ message: "Atualizado com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE: Excluir imóvel
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query("DELETE FROM imoveis WHERE id = $1", [id]);
    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}