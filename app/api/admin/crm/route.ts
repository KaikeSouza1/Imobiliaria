import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
  // Verifica a sessão atual logada
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  
  const userRole = (session.user as any).role;
  const userName = session.user?.name;

  // Monta os filtros de segurança baseado no papel do usuário
  let baseCondition = "WHERE estagio != 'ARQUIVADO'";
  let params: any[] = [];
  let listCondition = "";

  if (userRole === "corretor") {
     baseCondition += " AND corretor = $1";
     listCondition = "WHERE corretor = $1";
     params.push(userName);
  }

  try {
    if (action === "relatorios") {
      const funilRes = await query(`
        SELECT estagio, COUNT(*) as qtd, COALESCE(SUM(valor_estimado), 0) as valor
        FROM crm_leads
        ${baseCondition}
        GROUP BY estagio
      `, params);
      
      const kpiRes = await query(`
        SELECT 
          COUNT(*) as total_leads,
          SUM(CASE WHEN estagio = 'FECHADO' THEN 1 ELSE 0 END) as total_vendas,
          COALESCE(SUM(CASE WHEN estagio = 'FECHADO' THEN valor_estimado ELSE 0 END), 0) as receita_total,
          COALESCE(AVG(CASE WHEN estagio = 'FECHADO' THEN valor_estimado ELSE NULL END), 0) as ticket_medio,
          COALESCE(MAX(CASE WHEN estagio = 'FECHADO' THEN valor_estimado ELSE 0 END), 0) as maior_venda,
          COALESCE(SUM(CASE WHEN estagio NOT IN ('FECHADO', 'ARQUIVADO') THEN valor_estimado ELSE 0 END), 0) as pipeline_aberto
        FROM crm_leads
        ${baseCondition}
      `, params);

      return NextResponse.json({
        funil: funilRes.rows,
        kpis: kpiRes.rows[0] || {}
      });
    }

    // Listagem da Tabela (Kanban)
    const listQuery = `SELECT * FROM crm_leads ${listCondition} ORDER BY criado_em DESC`;
    const result = await query(listQuery, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      cliente_nome, telefone, email, interesse, valor_estimado, 
      estagio, observacoes, tipo_negocio, corretor, origem, 
      categoria_imovel, link_origem 
    } = body;
    
    if (link_origem) {
      const check = await query("SELECT id FROM crm_leads WHERE link_origem = $1", [link_origem]);
      if (check.rows.length > 0) {
        return NextResponse.json({ error: "Lead já capturado do Facebook!" }, { status: 409 });
      }
    }
    
    const result = await query(
      `INSERT INTO crm_leads (cliente_nome, telefone, email, interesse, valor_estimado, estagio, observacoes, tipo_negocio, corretor, origem, categoria_imovel, link_origem) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        cliente_nome || 'Lead Facebook', 
        telefone, 
        email, 
        interesse, 
        valor_estimado || 0, 
        estagio || 'LEAD', 
        observacoes, 
        tipo_negocio || 'Venda', 
        corretor || 'Não Atribuído',
        origem || 'Facebook',
        categoria_imovel || 'Indefinido',
        link_origem || null
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
    
    if (body.cliente_nome) {
      const { 
        id, cliente_nome, telefone, email, interesse, valor_estimado, 
        estagio, observacoes, tipo_negocio, corretor, origem, 
        categoria_imovel, link_origem 
      } = body;
      
      const result = await query(
        `UPDATE crm_leads 
         SET cliente_nome = $1, telefone = $2, email = $3, interesse = $4, valor_estimado = $5, estagio = $6, observacoes = $7, tipo_negocio = $8, corretor = $9, origem = $10, categoria_imovel = $11, link_origem = $12
         WHERE id = $13 RETURNING *`,
        [cliente_nome, telefone, email, interesse, valor_estimado, estagio, observacoes, tipo_negocio, corretor, origem, categoria_imovel, link_origem, id]
      );
      return NextResponse.json(result.rows[0]);
    } else {
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