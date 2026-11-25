import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { buscarModelo } from "@/lib/modelos";
import { validarValores, type Valores } from "@/lib/modelos/tipos";
import { gerarPdf } from "@/lib/modelos/gerar-pdf";
import { carregarEmpresa, salvarDocumentoGerado } from "@/lib/modelos/dados";
import { conferirVinculo, ErroDocumento } from "@/lib/documentos-db";
import { contentDisposition } from "@/lib/documentos";
import { usuarioDaSessao, ipDaRequisicao } from "@/lib/sessao";

const id = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// POST { valores, acao: "previa" | "salvar", locacao_id?, cliente_id?, imovel_id? }
// previa -> devolve o PDF para conferir (não guarda nada)
// salvar -> gera, guarda no bucket privado e registra nos documentos do contrato/cliente
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const usuario = usuarioDaSessao(session);
  if (!session || !usuario) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const modelo = buscarModelo((await params).id);
  if (!modelo) return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });

  try {
    const corpo = (await req.json().catch(() => null)) as { valores?: Valores; acao?: string; locacao_id?: unknown; cliente_id?: unknown; imovel_id?: unknown } | null;
    const valores = corpo?.valores && typeof corpo.valores === "object" ? corpo.valores : {};
    const erros = validarValores(modelo, valores);
    if (erros.length) return NextResponse.json({ error: erros.join(" "), erros }, { status: 400 });

    if (corpo?.acao !== "salvar") {
      const pdf = await gerarPdf(modelo, valores, await carregarEmpresa());
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": contentDisposition("inline", "previa.pdf"),
          "Cache-Control": "private, no-store",
        },
      });
    }

    // O PDF salvo precisa ficar ligado a um registro: contrato (locação) ou proprietário.
    const destino = {
      locacao_id: modelo.vinculo === "locacao" ? id(corpo.locacao_id) : null,
      cliente_id: modelo.vinculo === "proprietario" ? id(corpo.cliente_id) : null,
      imovel_id: modelo.vinculo === "proprietario" ? id(corpo.imovel_id) : null,
    };
    if (!destino.locacao_id && !destino.cliente_id) {
      return NextResponse.json(
        { error: modelo.vinculo === "locacao" ? "Escolha o contrato onde o documento será guardado." : "Escolha o proprietário onde o documento será guardado." },
        { status: 400 }
      );
    }
    await conferirVinculo(destino);
    const doc = await salvarDocumentoGerado(modelo, valores, destino, usuario, ipDaRequisicao(req));
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    if (e instanceof ErroDocumento) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Não foi possível gerar o documento." }, { status: 500 });
  }
}
