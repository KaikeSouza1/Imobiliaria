import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { query } from "@/lib/db";
import { mascararCpfCnpj } from "@/lib/texto";
import { buscarClientes } from "@/lib/busca-global";

// Seletor de cliente do formulário de contrato. Sempre devolve o documento mascarado.
// GET ?q=texto  -> até 10 sugestões
// GET ?id=N     -> um cliente (para sugerir o proprietário a partir do imóvel)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (Number.isInteger(id) && id > 0) {
      const r = await query("SELECT id, codigo, nome, cpf_cnpj, telefone FROM clientes WHERE id = $1", [id]);
      if (!r.rows[0]) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
      const { cpf_cnpj, ...c } = r.rows[0];
      return NextResponse.json({ ...c, documento: mascararCpfCnpj(cpf_cnpj) });
    }
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 2) return NextResponse.json([]);
    return NextResponse.json(await buscarClientes(q, 10));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 });
  }
}
