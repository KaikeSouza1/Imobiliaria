import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { validarCliente } from "@/lib/clientes";
import { listarClientes, resumoClientes, criarCliente, ErroCliente } from "@/lib/clientes-db";

// GET /api/admin/clientes?q=&papel=inquilino|proprietario&pagina=&resumo=1
// Lista do cadastro de clientes (documento mascarado).
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const lista = await listarClientes({
      q: searchParams.get("q") || undefined,
      papel: searchParams.get("papel") || undefined,
      pagina: Number(searchParams.get("pagina")) || 1,
    });
    const resumo = searchParams.get("resumo") === "1" ? await resumoClientes() : undefined;
    return NextResponse.json({ ...lista, resumo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const v = validarCliente(await req.json().catch(() => null));
    if (!v.ok) return NextResponse.json({ error: v.erros.join(" "), erros: v.erros }, { status: 400 });
    return NextResponse.json(await criarCliente(v.dados), { status: 201 });
  } catch (error) {
    if (error instanceof ErroCliente) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error(error);
    return NextResponse.json({ error: "Erro ao cadastrar cliente" }, { status: 500 });
  }
}
