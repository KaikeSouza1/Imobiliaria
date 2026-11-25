import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { validarCliente } from "@/lib/clientes";
import { buscarCliente, atualizarCliente, excluirCliente, ErroCliente } from "@/lib/clientes-db";

type Ctx = { params: Promise<{ id: string }> };

async function idDe(params: Ctx["params"]) {
  const n = Number((await params).id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function erro(e: unknown, padrao: string) {
  if (e instanceof ErroCliente) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e);
  return NextResponse.json({ error: padrao }, { status: 500 });
}

// Painel do cliente: dados pessoais completos, endereço, contratos, imóveis e documentos pessoais.
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const id = await idDe(params);
  if (!id) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  try {
    const c = await buscarCliente(id);
    if (!c) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    return NextResponse.json(c);
  } catch (e) {
    return erro(e, "Erro ao buscar cliente");
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const id = await idDe(params);
  if (!id) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  try {
    const v = validarCliente(await req.json().catch(() => null));
    if (!v.ok) return NextResponse.json({ error: v.erros.join(" "), erros: v.erros }, { status: 400 });
    return NextResponse.json(await atualizarCliente(id, v.dados));
  } catch (e) {
    return erro(e, "Erro ao salvar cliente");
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const id = await idDe(params);
  if (!id) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  try {
    await excluirCliente(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return erro(e, "Erro ao excluir cliente");
  }
}
