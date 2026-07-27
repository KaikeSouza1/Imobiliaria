import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { garantirTabelasLocacao, apenasDigitos } from "@/lib/locacoes-db";

// Rota pública (sem login): o locatário informa o CPF e recebe os contratos + boletos vinculados.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cpf = apenasDigitos(body.cpf);

    if (!cpf || cpf.length < 11) {
      return NextResponse.json({ error: "Informe um CPF válido" }, { status: 400 });
    }

    await garantirTabelasLocacao();

    const locacoesRes = await query(
      `SELECT l.*, i.titulo AS imovel_titulo, i.endereco AS imovel_endereco, i.cidade AS imovel_cidade,
              i.bairro AS imovel_bairro, i.imagem_url AS imovel_imagem_url
       FROM locacoes l
       LEFT JOIN imoveis i ON i.id = l.imovel_id
       WHERE l.locatario_cpf = $1
       ORDER BY l.criado_em DESC`,
      [cpf]
    );

    const contratos = [];
    for (const locacao of locacoesRes.rows) {
      const boletosRes = await query(
        "SELECT * FROM locacao_boletos WHERE locacao_id = $1 ORDER BY vencimento DESC",
        [locacao.id]
      );
      contratos.push({ ...locacao, boletos: boletosRes.rows });
    }

    return NextResponse.json({ contratos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao consultar dados" }, { status: 500 });
  }
}
