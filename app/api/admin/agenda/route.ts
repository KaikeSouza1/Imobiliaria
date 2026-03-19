import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    // Fazemos um JOIN com crm_leads para pegar o nome do cliente associado (se houver)
    const result = await query(`
      SELECT a.*, l.cliente_nome as lead_nome 
      FROM crm_agenda a
      LEFT JOIN crm_leads l ON a.lead_id = l.id
      ORDER BY a.data_hora ASC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar agenda" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { titulo, descricao, data_hora, corretor, lead_id, tipo } = body;
    
    const result = await query(
      `INSERT INTO crm_agenda (titulo, descricao, data_hora, corretor, lead_id, tipo, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Pendente') RETURNING *`,
      [titulo, descricao || '', data_hora, corretor, lead_id || null, tipo || 'Visita']
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar compromisso" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;
    
    // Atualiza apenas o status (Pendente, Concluído, Cancelado)
    const result = await query(
      "UPDATE crm_agenda SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar compromisso" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    await query("DELETE FROM crm_agenda WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}