import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  const adminUser = process.env.ADMIN_USER ? process.env.ADMIN_USER.replace(/^"|"$/g, "").toLowerCase() : undefined;
  if (!session || (session.user as any).username !== adminUser) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const res = await query("SELECT id, username, nome, role FROM usuarios ORDER BY nome");
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar corretores" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const adminUser = process.env.ADMIN_USER ? process.env.ADMIN_USER.replace(/^"|"$/g, "").toLowerCase() : undefined;
  if (!session || (session.user as any).username !== adminUser) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { username, nome, role } = body;
    if (!username || !nome) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    const check = await query("SELECT id FROM usuarios WHERE username = $1", [username.toLowerCase()]);
    if (check.rows.length > 0) {
      return NextResponse.json({ error: "Usuário já existe" }, { status: 409 });
    }

    const res = await query(
      "INSERT INTO usuarios (username, nome, role) VALUES ($1, $2, $3) RETURNING id, username, nome, role",
      [username.toLowerCase(), nome, role || 'corretor']
    );

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar corretor" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const adminUser = process.env.ADMIN_USER ? process.env.ADMIN_USER.replace(/^"|"$/g, "").toLowerCase() : undefined;
  if (!session || (session.user as any).username !== adminUser) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });

    await query("DELETE FROM usuarios WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}
