import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { MODELOS, resumoModelo } from "@/lib/modelos";

// Lista os modelos de documento (campos do formulário de cada um).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  return NextResponse.json(MODELOS.map(resumoModelo));
}
