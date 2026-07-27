import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { garantirTabelasLocacao, apenasDigitos } from "@/lib/locacoes-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await garantirTabelasLocacao();

    const result = await query(`
      SELECT
        l.*,
        i.titulo   AS imovel_titulo,
        i.endereco AS imovel_endereco,
        i.cidade   AS imovel_cidade,
        i.bairro   AS imovel_bairro,
        i.codigo   AS imovel_codigo,
        i.imagem_url AS imovel_imagem_url,
        (SELECT COUNT(*) FROM locacao_boletos b WHERE b.locacao_id = l.id AND b.status = 'pendente' AND b.vencimento < CURRENT_DATE) AS boletos_atrasados,
        (SELECT COUNT(*) FROM locacao_boletos b WHERE b.locacao_id = l.id) AS total_boletos
      FROM locacoes l
      LEFT JOIN imoveis i ON i.id = l.imovel_id
      ORDER BY l.criado_em DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar locações" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    await garantirTabelasLocacao();
    const body = await req.json();
    const {
      imovel_id, locatario_nome, locatario_cpf, locatario_email, locatario_telefone,
      valor_aluguel, dia_vencimento, data_inicio, data_fim, status, observacoes,
    } = body;

    if (!imovel_id || !locatario_nome || !locatario_cpf) {
      return NextResponse.json({ error: "Selecione o imóvel e informe nome e CPF do locatário" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO locacoes
        (imovel_id, locatario_nome, locatario_cpf, locatario_email, locatario_telefone,
         valor_aluguel, dia_vencimento, data_inicio, data_fim, status, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        imovel_id,
        locatario_nome,
        apenasDigitos(locatario_cpf),
        locatario_email || null,
        locatario_telefone || null,
        parseFloat(valor_aluguel) || 0,
        parseInt(dia_vencimento) || 10,
        data_inicio || null,
        data_fim || null,
        status || "ativo",
        observacoes || null,
      ]
    );

    // Reaproveita o campo de status já usado no cadastro de imóveis
    await query("UPDATE imoveis SET status = 'alugado' WHERE id = $1", [imovel_id]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar locação" }, { status: 500 });
  }
}
