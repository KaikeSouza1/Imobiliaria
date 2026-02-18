import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, anotacao } = body;

    const allowedStatus = ["novo", "visto", "em_contato", "finalizado"];
    if (status && !allowedStatus.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status !== undefined) {
      updates.push(`status = $${idx}`);
      values.push(status);
      idx++;
    }

    if (anotacao !== undefined) {
      updates.push(`anotacao = $${idx}`);
      values.push(anotacao);
      idx++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
    }

    values.push(id);
    const sql = `UPDATE contatos SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`;
    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar contato:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query("DELETE FROM contatos WHERE id = $1", [id]);
    return NextResponse.json({ message: "Deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar contato:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}