import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { validarPedidoEnvio } from "@/lib/documentos";
import { conferirVinculo, ErroDocumento } from "@/lib/documentos-db";
import { novaChave, urlDeEnvio } from "@/lib/storage-documentos";
import { criarTokenEnvio } from "@/lib/token-envio";
import { usuarioDaSessao } from "@/lib/sessao";

// Passo 1 do envio: valida o pedido e devolve uma URL temporária para o navegador enviar o PDF direto ao R2.
// Corpo: { locacao_id | cliente_id | imovel_id, tipo, nome, tamanho }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const usuario = usuarioDaSessao(session);
  if (!session || !usuario) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const pedido = validarPedidoEnvio(await req.json().catch(() => null));
    if (!pedido.ok) return NextResponse.json({ error: pedido.erro }, { status: 400 });
    await conferirVinculo(pedido.vinculo);

    const chave = novaChave();
    const url = await urlDeEnvio(chave, pedido.tamanho);
    const token = criarTokenEnvio({ chave, nome: pedido.nome, tamanho: pedido.tamanho, tipo: pedido.tipo, vinculo: pedido.vinculo, usuario });
    return NextResponse.json({ url, token });
  } catch (error) {
    if (error instanceof ErroDocumento) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Não foi possível preparar o envio. Tente novamente." }, { status: 500 });
  }
}
