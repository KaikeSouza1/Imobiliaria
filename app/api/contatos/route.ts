import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      "SELECT * FROM contatos ORDER BY criado_em DESC"
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    return NextResponse.json({ error: "Erro ao buscar contatos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, telefone, email, assunto, mensagem } = body;

    if (!nome || !telefone || !mensagem) {
      return NextResponse.json(
        { error: "Nome, telefone e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO contatos (nome, telefone, email, assunto, mensagem)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await query(sql, [nome, telefone, email || null, assunto || null, mensagem]);

    return NextResponse.json(
      { message: "Contato enviado com sucesso!", id: result.rows[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao salvar contato:", error);
    return NextResponse.json({ error: "Erro interno ao salvar contato" }, { status: 500 });
  }
}