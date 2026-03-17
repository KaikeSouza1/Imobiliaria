import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query("SELECT * FROM crm_leads ORDER BY criado_em DESC");
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cliente_nome, telefone, email, interesse, valor_estimado, estagio, observacoes, tipo_negocio, corretor, origem } = body;
    
    const result = await query(
      `INSERT INTO crm_leads (cliente_nome, telefone, email, interesse, valor_estimado, estagio, observacoes, tipo_negocio, corretor, origem) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [cliente_nome, telefone, email, interesse, valor_estimado || 0, estagio || 'LEAD', observacoes, tipo_negocio || 'Venda', corretor || 'Não Atribuído', origem || 'Desconhecida']
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar lead" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (body.cliente_nome) {
      const { id, cliente_nome, telefone, email, interesse, valor_estimado, estagio, observacoes, tipo_negocio, corretor, origem } = body;
      const result = await query(
        `UPDATE crm_leads 
         SET cliente_nome = $1, telefone = $2, email = $3, interesse = $4, valor_estimado = $5, estagio = $6, observacoes = $7, tipo_negocio = $8, corretor = $9, origem = $10
         WHERE id = $11 RETURNING *`,
        [cliente_nome, telefone, email, interesse, valor_estimado, estagio, observacoes, tipo_negocio, corretor, origem, id]
      );
      return NextResponse.json(result.rows[0]);
    } else {
      const { id, estagio } = body;
      const result = await query("UPDATE crm_leads SET estagio = $1 WHERE id = $2 RETURNING *", [estagio, id]);
      return NextResponse.json(result.rows[0]);
    }
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await query("DELETE FROM crm_leads WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}