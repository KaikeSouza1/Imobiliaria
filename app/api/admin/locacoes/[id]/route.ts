import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { garantirTabelasLocacao } from "@/lib/locacoes-db";
import { validarContrato } from "@/lib/contratos";
import { atualizarContrato, buscarContrato, excluirContrato, ErroContrato } from "@/lib/contratos-db";

type Ctx = { params: Promise<{ id: string }> };

function idValido(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function respostaErro(error: unknown, padrao: string) {
  if (error instanceof ErroContrato) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: padrao }, { status: 500 });
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const id = idValido((await params).id);
  if (!id) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
  try {
    await garantirTabelasLocacao();
    const contrato = await buscarContrato(id);
    if (!contrato) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    return NextResponse.json(contrato);
  } catch (error) {
    return respostaErro(error, "Erro ao buscar contrato");
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const id = idValido((await params).id);
  if (!id) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
  try {
    const validacao = validarContrato(await req.json());
    if (!validacao.ok) {
      return NextResponse.json({ error: validacao.erros.join(" "), erros: validacao.erros }, { status: 400 });
    }
    return NextResponse.json(await atualizarContrato(id, validacao.dados));
  } catch (error) {
    return respostaErro(error, "Erro ao atualizar contrato");
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const id = idValido((await params).id);
  if (!id) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
  try {
    await excluirContrato(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return respostaErro(error, "Erro ao excluir contrato");
  }
}
