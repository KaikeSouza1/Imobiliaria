import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { garantirTabelasLocacao } from "@/lib/locacoes-db";
import { validarContrato } from "@/lib/contratos";
import { filtrosDaUrl } from "@/lib/busca-contratos";
import { criarContrato, listarContratos, resumoContratos, ErroContrato } from "@/lib/contratos-db";

// GET /api/admin/locacoes?q=&codigo=&inquilino=&proprietario=&endereco=&status=&finalidade=&reajuste_de=&reajuste_ate=&pagina=
// Resposta: { itens, total, pagina, por_pagina, paginas, resumo? }  (resumo só com ?resumo=1)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await garantirTabelasLocacao();
    const { searchParams } = new URL(req.url);
    const lista = await listarContratos(filtrosDaUrl(searchParams));
    const resumo = searchParams.get("resumo") === "1" ? await resumoContratos() : undefined;
    return NextResponse.json({ ...lista, resumo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar contratos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await garantirTabelasLocacao();
    const validacao = validarContrato(await req.json());
    if (!validacao.ok) {
      return NextResponse.json({ error: validacao.erros.join(" "), erros: validacao.erros }, { status: 400 });
    }
    const criado = await criarContrato(validacao.dados);
    return NextResponse.json(criado, { status: 201 });
  } catch (error) {
    if (error instanceof ErroContrato) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar contrato" }, { status: 500 });
  }
}
