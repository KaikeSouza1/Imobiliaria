import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      "SELECT * FROM anuncios ORDER BY criado_em DESC"
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar anúncios:", error);
    return NextResponse.json({ error: "Erro ao buscar anúncios" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, telefone, email, finalidade, tipo, endereco, valor, area, descricao } = body;

    if (!nome || !telefone) {
      return NextResponse.json(
        { error: "Nome e telefone são obrigatórios" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO anuncios (nome, telefone, email, finalidade, tipo, endereco, valor, area, descricao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const result = await query(sql, [
      nome,
      telefone,
      email || null,
      finalidade || "Quero Vender",
      tipo || "Casa",
      endereco || null,
      valor || null,
      area || null,
      descricao || null,
    ]);

    return NextResponse.json(
      { message: "Anúncio enviado com sucesso!", id: result.rows[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao salvar anúncio:", error);
    return NextResponse.json({ error: "Erro interno ao salvar anúncio" }, { status: 500 });
  }
}