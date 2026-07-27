import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";

// Atualização parcial: aceita qualquer combinação de status / vencimento / valor.
// Usado tanto pelo botão rápido "marcar como pago" quanto pela edição manual da data/valor do boleto.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boletoId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { boletoId } = await params;
    const atualRes = await query("SELECT * FROM locacao_boletos WHERE id = $1", [boletoId]);
    if (atualRes.rows.length === 0) {
      return NextResponse.json({ error: "Boleto não encontrado" }, { status: 404 });
    }
    const atual = atualRes.rows[0];
    const body = await request.json();

    const status = body.status !== undefined ? (body.status === "pago" ? "pago" : "pendente") : atual.status;
    const valor = body.valor !== undefined && body.valor !== "" ? parseFloat(body.valor) || 0 : atual.valor;

    let vencimento = atual.vencimento;
    if (body.vencimento) {
      const data = new Date(body.vencimento);
      if (isNaN(data.getTime())) {
        return NextResponse.json({ error: "Data de vencimento inválida" }, { status: 400 });
      }
      vencimento = data.toISOString().slice(0, 10);
    }

    const pagoEm = status === "pago" ? (atual.status === "pago" ? atual.pago_em : new Date().toISOString()) : null;

    const result = await query(
      "UPDATE locacao_boletos SET status = $1, valor = $2, vencimento = $3, pago_em = $4 WHERE id = $5 RETURNING *",
      [status, valor, vencimento, pagoEm, boletoId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar boleto" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boletoId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { boletoId } = await params;
    await query("DELETE FROM locacao_boletos WHERE id = $1", [boletoId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao excluir boleto" }, { status: 500 });
  }
}
