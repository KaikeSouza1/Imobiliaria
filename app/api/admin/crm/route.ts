import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "relatorios") {
      const funilRes = await query(`
        SELECT estagio, COUNT(*) as qtd, COALESCE(SUM(valor_estimado), 0) as valor
        FROM crm_leads
        GROUP BY estagio
      `);
      
      const kpiRes = await query(`
        SELECT 
          COUNT(*) as total_leads,
          SUM(CASE WHEN estagio = 'FECHADO' THEN 1 ELSE 0 END) as total_vendas,
          COALESCE(SUM(CASE WHEN estagio = 'FECHADO' THEN valor_estimado ELSE 0 END), 0) as receita_total,
          COALESCE(AVG(CASE WHEN estagio = 'FECHADO' THEN valor_estimado ELSE NULL END), 0) as ticket_medio,
          COALESCE(MAX(CASE WHEN estagio = 'FECHADO' THEN valor_estimado ELSE 0 END), 0) as maior_venda,
          COALESCE(SUM(CASE WHEN estagio != 'FECHADO' THEN valor_estimado ELSE 0 END), 0) as pipeline_aberto
        FROM crm_leads
      `);

      return NextResponse.json({
        funil: funilRes.rows,
        kpis: kpiRes.rows[0] || {}
      });
    }

    const result = await query("SELECT * FROM crm_leads ORDER BY criado_em DESC");
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 1. Adicionamos 'origem' aqui
    const { cliente_nome, telefone, email, interesse, valor_estimado, estagio, observacoes, tipo_negocio, corretor, origem } = body;
    
    // 2. Adicionamos 'origem' na instrução SQL e o $10 nos VALUES
    const result = await query(
      `INSERT INTO crm_leads (cliente_nome, telefone, email, interesse, valor_estimado, estagio, observacoes, tipo_negocio, corretor, origem) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        cliente_nome, 
        telefone, 
        email, 
        interesse, 
        valor_estimado || 0, 
        estagio || 'LEAD', 
        observacoes, 
        tipo_negocio || 'Venda', 
        corretor || 'Não Atribuído',
        origem || 'WhatsApp' // Define um padrão se não vier nada
      ]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar lead" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    
    // Se o frontend enviar o cliente_nome, significa que é uma EDIÇÃO COMPLETA do Modal
    if (body.cliente_nome) {
      // 3. Adicionamos 'origem' aqui também
      const { id, cliente_nome, telefone, email, interesse, valor_estimado, estagio, observacoes, tipo_negocio, corretor, origem } = body;
      
      // 4. Adicionamos 'origem = $10' na instrução de UPDATE e o id vira $11
      const result = await query(
        `UPDATE crm_leads 
         SET cliente_nome = $1, telefone = $2, email = $3, interesse = $4, valor_estimado = $5, estagio = $6, observacoes = $7, tipo_negocio = $8, corretor = $9, origem = $10
         WHERE id = $11 RETURNING *`,
        [cliente_nome, telefone, email, interesse, valor_estimado, estagio, observacoes, tipo_negocio, corretor, origem, id]
      );
      return NextResponse.json(result.rows[0]);
    } else {
      // Se não, é só uma atualização rápida de estágio no Kanban (mover de coluna)
      const { id, estagio } = body;
      const result = await query(
        "UPDATE crm_leads SET estagio = $1 WHERE id = $2 RETURNING *",
        [estagio, id]
      );
      return NextResponse.json(result.rows[0]);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar lead" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    await query("DELETE FROM crm_leads WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}
