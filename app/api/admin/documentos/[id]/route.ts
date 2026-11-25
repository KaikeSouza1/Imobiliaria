import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { removerDocumento, ErroDocumento } from "@/lib/documentos-db";
import { usuarioDaSessao, ipDaRequisicao } from "@/lib/sessao";

// Exclusão lógica: o documento some das telas, mas o arquivo e a trilha continuam guardados.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const usuario = usuarioDaSessao(session);
  if (!session || !usuario) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  try {
    await removerDocumento(id, usuario, ipDaRequisicao(req));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ErroDocumento) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Erro ao excluir documento" }, { status: 500 });
  }
}
