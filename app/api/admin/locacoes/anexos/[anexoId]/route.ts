import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { excluirAnexoDoR2 } from "@/lib/upload-anexo";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ anexoId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { anexoId } = await params;
    const anexoRes = await query("SELECT * FROM locacao_anexos WHERE id = $1", [anexoId]);
    if (anexoRes.rows.length === 0) {
      return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 });
    }

    try {
      await excluirAnexoDoR2(anexoRes.rows[0].url);
    } catch (erroStorage) {
      // Mesmo que a remoção no storage falhe, seguimos removendo o registro para não travar o usuário
      console.error("Erro ao excluir arquivo do storage:", erroStorage);
    }

    await query("DELETE FROM locacao_anexos WHERE id = $1", [anexoId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao excluir anexo" }, { status: 500 });
  }
}
