import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { listarCorretores } from "@/lib/contratos-db";

// Listas auxiliares do formulário de contrato (corretores).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ corretores: await listarCorretores() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao carregar opções" }, { status: 500 });
  }
}
