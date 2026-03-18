import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// ================================================================
// GET — Lista proprietários capturados
// ================================================================
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "kpis") {
      const res = await query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN estagio = 'CAPTADO' THEN 1 ELSE 0 END) as captados,
          SUM(CASE WHEN estagio = 'PERDIDO' THEN 1 ELSE 0 END) as perdidos,
          SUM(CASE WHEN tipo_anuncio = 'Venda' THEN 1 ELSE 0 END) as total_venda,
          SUM(CASE WHEN tipo_anuncio = 'Aluguel' THEN 1 ELSE 0 END) as total_aluguel
        FROM crm_proprietarios
      `);
      return NextResponse.json(res.rows[0]);
    }

    const result = await query(
      "SELECT * FROM crm_proprietarios ORDER BY criado_em DESC"
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar proprietários" }, { status: 500 });
  }
}

// ================================================================
// POST — Salvar proprietário capturado (via extensão)
// ================================================================
export async function POST(req: Request) {
  try {
    // Garante que a tabela existe (cria na primeira vez)
    await criarTabelaSeNaoExiste();

    const body = await req.json();
    const {
      nome_proprietario,
      telefone,
      titulo_imovel,
      preco_anuncio,
      localizacao,
      descricao,
      link_anuncio,
      tipo_anuncio,
      origem,
      estagio,
      corretor,
    } = body;

    // Anti-duplicata: mesmo link não entra duas vezes
    if (link_anuncio) {
      const check = await query(
        "SELECT id FROM crm_proprietarios WHERE link_anuncio = $1",
        [link_anuncio]
      );
      if (check.rows.length > 0) {
        return NextResponse.json(
          { error: "Anúncio já capturado!" },
          { status: 409 }
        );
      }
    }

    const result = await query(
      `INSERT INTO crm_proprietarios
        (nome_proprietario, telefone, titulo_imovel, preco_anuncio, localizacao, descricao, link_anuncio, tipo_anuncio, origem, estagio, corretor)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        nome_proprietario || "Proprietário Anônimo",
        telefone || null,
        titulo_imovel || null,
        preco_anuncio || null,
        localizacao || null,
        descricao || null,
        link_anuncio || null,
        tipo_anuncio || "Indefinido",
        origem || "Facebook Marketplace",
        estagio || "NOVO",
        corretor || "Não Atribuído",
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar proprietário" }, { status: 500 });
  }
}

// ================================================================
// PUT — Atualizar proprietário (corretor, estágio, telefone etc.)
// ================================================================
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id, nome_proprietario, telefone, titulo_imovel,
      preco_anuncio, localizacao, descricao, link_anuncio,
      tipo_anuncio, origem, estagio, corretor, observacoes
    } = body;

    // Atualização rápida de estágio (drag & drop)
    if (!nome_proprietario) {
      const result = await query(
        "UPDATE crm_proprietarios SET estagio = $1 WHERE id = $2 RETURNING *",
        [estagio, id]
      );
      return NextResponse.json(result.rows[0]);
    }

    // Atualização completa (modal)
    const result = await query(
      `UPDATE crm_proprietarios
       SET nome_proprietario=$1, telefone=$2, titulo_imovel=$3, preco_anuncio=$4,
           localizacao=$5, descricao=$6, link_anuncio=$7, tipo_anuncio=$8,
           origem=$9, estagio=$10, corretor=$11, observacoes=$12
       WHERE id=$13 RETURNING *`,
      [
        nome_proprietario, telefone, titulo_imovel, preco_anuncio,
        localizacao, descricao, link_anuncio, tipo_anuncio,
        origem, estagio, corretor, observacoes, id
      ]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// ================================================================
// DELETE — Remover proprietário
// ================================================================
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await query("DELETE FROM crm_proprietarios WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}

// ================================================================
// HELPER — Cria a tabela se não existir ainda
// ================================================================
async function criarTabelaSeNaoExiste() {
  await query(`
    CREATE TABLE IF NOT EXISTS crm_proprietarios (
      id               SERIAL PRIMARY KEY,
      nome_proprietario VARCHAR(255) NOT NULL DEFAULT 'Proprietário Anônimo',
      telefone         VARCHAR(50),
      titulo_imovel    TEXT,
      preco_anuncio    VARCHAR(100),
      localizacao      VARCHAR(255),
      descricao        TEXT,
      link_anuncio     TEXT UNIQUE,
      tipo_anuncio     VARCHAR(50)  DEFAULT 'Indefinido',
      origem           VARCHAR(100) DEFAULT 'Facebook Marketplace',
      estagio          VARCHAR(50)  DEFAULT 'NOVO',
      corretor         VARCHAR(100) DEFAULT 'Não Atribuído',
      observacoes      TEXT,
      criado_em        TIMESTAMPTZ  DEFAULT NOW()
    )
  `);
}