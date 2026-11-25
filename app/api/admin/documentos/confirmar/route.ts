import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { ehPdf, TAMANHO_MAXIMO_DOCUMENTO } from "@/lib/documentos";
import { documentoDuplicado, gravarDocumento, ErroDocumento } from "@/lib/documentos-db";
import { analisarObjeto, descartarEnvio, tamanhoDoObjeto } from "@/lib/storage-documentos";
import { lerTokenEnvio } from "@/lib/token-envio";
import { usuarioDaSessao, ipDaRequisicao } from "@/lib/sessao";
import { query } from "@/lib/db";

// Passo 3 do envio: confere o arquivo que chegou ao R2 (tamanho, assinatura de PDF, duplicidade) e só então registra.
// Arquivo recusado é apagado do R2 na hora.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const usuario = usuarioDaSessao(session);
  if (!session || !usuario) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const corpo = await req.json().catch(() => null);
  const dados = lerTokenEnvio(corpo?.token, usuario);
  if (!dados) return NextResponse.json({ error: "Envio expirado ou inválido. Tente anexar de novo." }, { status: 400 });

  const recusar = async (erro: string, status: number) => {
    await descartarEnvio(dados.chave).catch((e) => console.error("Falha ao descartar envio recusado:", e));
    return NextResponse.json({ error: erro }, { status });
  };

  try {
    const jaRegistrado = await query("SELECT 1 FROM documentos WHERE chave_storage = $1", [dados.chave]);
    if (jaRegistrado.rows[0]) return NextResponse.json({ error: "Este envio já foi confirmado." }, { status: 409 });

    const tamanho = await tamanhoDoObjeto(dados.chave);
    if (tamanho === null) return NextResponse.json({ error: "O arquivo não chegou ao armazenamento. Tente de novo." }, { status: 400 });
    if (tamanho !== dados.tamanho || tamanho > TAMANHO_MAXIMO_DOCUMENTO) {
      return recusar("O arquivo recebido não confere com o enviado.", 400);
    }

    const analise = await analisarObjeto(dados.chave);
    if (!ehPdf(analise.inicio)) return recusar(`"${dados.nome}" não é um PDF válido.`, 400);

    const duplicado = await documentoDuplicado(analise.sha256, dados.vinculo);
    if (duplicado) return recusar(`Este arquivo já está anexado como "${duplicado.nome_original}".`, 409);

    const doc = await gravarDocumento({
      vinculo: dados.vinculo,
      tipo: dados.tipo,
      chave: dados.chave,
      nome: dados.nome,
      tamanho: analise.tamanho,
      sha256: analise.sha256,
      usuario,
      ip: ipDaRequisicao(req),
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    if (error instanceof ErroDocumento) {
      if ((error as ErroDocumento & { descartar?: boolean }).descartar) return recusar(error.message, error.status);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao registrar o documento." }, { status: 500 });
  }
}
