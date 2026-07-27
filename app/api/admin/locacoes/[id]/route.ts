import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { garantirTabelasLocacao, apenasDigitos } from "@/lib/locacoes-db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    await garantirTabelasLocacao();

    const locacaoRes = await query(
      `SELECT l.*, i.titulo AS imovel_titulo, i.endereco AS imovel_endereco, i.cidade AS imovel_cidade,
              i.bairro AS imovel_bairro, i.codigo AS imovel_codigo, i.imagem_url AS imovel_imagem_url
       FROM locacoes l
       LEFT JOIN imoveis i ON i.id = l.imovel_id
       WHERE l.id = $1`,
      [id]
    );

    if (locacaoRes.rows.length === 0) {
      return NextResponse.json({ error: "Locação não encontrada" }, { status: 404 });
    }

    const boletosRes = await query(
      "SELECT * FROM locacao_boletos WHERE locacao_id = $1 ORDER BY vencimento DESC",
      [id]
    );

    const anexosRes = await query(
      "SELECT * FROM locacao_anexos WHERE locacao_id = $1 ORDER BY criado_em DESC",
      [id]
    );

    return NextResponse.json({ ...locacaoRes.rows[0], boletos: boletosRes.rows, anexos: anexosRes.rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar locação" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      imovel_id, locatario_nome, locatario_cpf, locatario_email, locatario_telefone,
      valor_aluguel, dia_vencimento, data_inicio, data_fim, status, observacoes,
    } = body;

    const result = await query(
      `UPDATE locacoes SET
         imovel_id = $1, locatario_nome = $2, locatario_cpf = $3, locatario_email = $4,
         locatario_telefone = $5, valor_aluguel = $6, dia_vencimento = $7,
         data_inicio = $8, data_fim = $9, status = $10, observacoes = $11,
         atualizado_em = NOW()
       WHERE id = $12
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
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Locação não encontrada" }, { status: 404 });
    }

    if (status === "encerrado" && imovel_id) {
      await query("UPDATE imoveis SET status = 'disponivel' WHERE id = $1", [imovel_id]);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar locação" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    await query("DELETE FROM locacoes WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao excluir locação" }, { status: 500 });
  }
}
