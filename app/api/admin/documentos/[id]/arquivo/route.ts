import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { buscarDocumento, registrarLog } from "@/lib/documentos-db";
import { contentDisposition } from "@/lib/documentos";
import { urlDeLeitura } from "@/lib/storage-documentos";
import { usuarioDaSessao, ipDaRequisicao } from "@/lib/sessao";

// GET /api/admin/documentos/[id]/arquivo?modo=ver|baixar
// Confere login, registra no log e redireciona para uma URL assinada que expira em 60 segundos.
// O arquivo não tem endereço público; sem passar por aqui, não há como abri-lo.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const usuario = usuarioDaSessao(session);
  if (!session || !usuario) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });

  try {
    const doc = await buscarDocumento(id);
    if (!doc || doc.removido_em) return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });

    const baixar = new URL(req.url).searchParams.get("modo") === "baixar";
    await registrarLog(doc.id, baixar ? "baixar" : "visualizar", usuario, ipDaRequisicao(req));
    const url = await urlDeLeitura(doc.chave_storage, contentDisposition(baixar ? "attachment" : "inline", doc.nome_original));

    const res = NextResponse.redirect(url, 302);
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("Referrer-Policy", "no-referrer");
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao abrir documento" }, { status: 500 });
  }
}
