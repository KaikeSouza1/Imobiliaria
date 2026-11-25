import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { listarDocumentos, listarPastas } from "@/lib/documentos-db";
import { TIPOS_TODOS } from "@/lib/documentos";

// GET /api/admin/documentos?q=&locacao_id=&tipo=&pagina=    documentos recentes / busca
// GET /api/admin/documentos?pastas=1&q=                       contratos com documentos (navegação por pastas)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;
    if (searchParams.get("pastas") === "1") return NextResponse.json(await listarPastas(q));

    const tipo = searchParams.get("tipo");
    const locacao = Number(searchParams.get("locacao_id"));
    return NextResponse.json(
      await listarDocumentos({
        q,
        tipo: tipo && (TIPOS_TODOS as readonly string[]).includes(tipo) ? tipo : undefined,
        locacao_id: Number.isInteger(locacao) && locacao > 0 ? locacao : undefined,
        pagina: Number(searchParams.get("pagina")) || 1,
      })
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar documentos" }, { status: 500 });
  }
}
