import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { garantirTabelasLocacao, gerarLinhaDigitavel, gerarCodigoBarras } from "@/lib/locacoes-db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    await garantirTabelasLocacao();
    const result = await query(
      "SELECT * FROM locacao_boletos WHERE locacao_id = $1 ORDER BY vencimento DESC",
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar boletos" }, { status: 500 });
  }
}

// Recebe a lista já definida (e eventualmente revisada) de boletos a gerar — o front-end
// é quem monta o preview com as datas/valores de cada mês antes de confirmar aqui.
// Body: { itens: [{ referencia: "07/2026", vencimento: "2026-07-10", valor: 1200.5 }, ...] }
// Meses cuja referência já existe para o contrato são simplesmente ignorados (sem duplicar).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    await garantirTabelasLocacao();

    const locacaoRes = await query("SELECT * FROM locacoes WHERE id = $1", [id]);
    if (locacaoRes.rows.length === 0) {
      return NextResponse.json({ error: "Locação não encontrada" }, { status: 404 });
    }
    const locacao = locacaoRes.rows[0];

    const body = await request.json().catch(() => ({}));
    const itens = Array.isArray(body.itens) ? body.itens : [];

    if (itens.length === 0) {
      return NextResponse.json({ error: "Nenhum boleto informado para gerar" }, { status: 400 });
    }
    if (itens.length > 240) {
      return NextResponse.json({ error: "Muitos boletos de uma vez (máximo de 240)" }, { status: 400 });
    }
    for (const item of itens) {
      if (!item.referencia || !item.vencimento || isNaN(new Date(item.vencimento).getTime())) {
        return NextResponse.json({ error: "Um dos boletos informados está com dados inválidos" }, { status: 400 });
      }
    }

    const existentesRes = await query(
      "SELECT referencia FROM locacao_boletos WHERE locacao_id = $1",
      [id]
    );
    const referenciasExistentes = new Set<string>(existentesRes.rows.map((r: any) => r.referencia));

    const criados = [];
    let ignorados = 0;
    let seed = Number(id) * 1000 + existentesRes.rows.length;

    for (const item of itens) {
      if (referenciasExistentes.has(item.referencia)) {
        ignorados++;
        continue;
      }
      seed += 1;
      const valor = parseFloat(item.valor) || Number(locacao.valor_aluguel) || 0;

      const result = await query(
        `INSERT INTO locacao_boletos
          (locacao_id, referencia, valor, vencimento, status, linha_digitavel, codigo_barras)
         VALUES ($1,$2,$3,$4,'pendente',$5,$6)
         RETURNING *`,
        [
          id,
          item.referencia,
          valor,
          new Date(item.vencimento).toISOString().slice(0, 10),
          gerarLinhaDigitavel(seed),
          gerarCodigoBarras(seed),
        ]
      );

      criados.push(result.rows[0]);
      referenciasExistentes.add(item.referencia);
    }

    return NextResponse.json({ criados, ignorados }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao gerar boleto(s)" }, { status: 500 });
  }
}
