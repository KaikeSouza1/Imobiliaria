import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { buscarModelo } from "@/lib/modelos";
import { preencher } from "@/lib/modelos/dados";
import { ErroDocumento } from "@/lib/documentos-db";

const id = (v: string | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

// GET ?locacao_id=&cliente_id=&imovel_id=&documento_id=
// Valores iniciais do formulário, já com os dados do contrato/cliente/imóvel (ou de um documento gerado antes).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const modelo = buscarModelo((await params).id);
  if (!modelo) return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });
  try {
    const sp = new URL(req.url).searchParams;
    return NextResponse.json(
      await preencher(modelo, {
        locacao_id: id(sp.get("locacao_id")),
        cliente_id: id(sp.get("cliente_id")),
        imovel_id: id(sp.get("imovel_id")),
        documento_id: id(sp.get("documento_id")),
      })
    );
  } catch (e) {
    if (e instanceof ErroDocumento) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 });
  }
}
