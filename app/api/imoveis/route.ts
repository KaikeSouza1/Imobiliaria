import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query("SELECT * FROM imoveis ORDER BY criado_em DESC");
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const preco = parseFloat(body.preco) || 0;
    const area = parseInt(body.area) || 0;
    const quartos = parseInt(body.quartos) || 0;
    const banheiros = parseInt(body.banheiros) || 0;
    const vagas = parseInt(body.vagas) || 0;
    const status = body.status || "disponivel"; // NOVO

    const sqlImovel = `
      INSERT INTO imoveis (
        titulo, descricao, preco, tipo, finalidade, cidade, bairro, 
        endereco, area, quartos, banheiros, vagas, imagem_url, codigo, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id
    `;

    const values = [
      body.titulo, body.descricao, preco, body.tipo, body.finalidade, body.cidade, 
      body.bairro, body.endereco, area, quartos, banheiros, vagas, body.imagem_url, body.codigo, status
    ];

    const result = await query(sqlImovel, values);
    const novoImovelId = result.rows[0].id;

    if (body.fotos_adicionais && body.fotos_adicionais.length > 0) {
      for (const url of body.fotos_adicionais) {
        await query(
          "INSERT INTO imovel_fotos (imovel_id, url) VALUES ($1, $2)",
          [novoImovelId, url]
        );
      }
    }
    
    return NextResponse.json({ message: "Cadastrado com sucesso!" }, { status: 201 });
  } catch (error) {
    console.error("Erro no Banco de Dados:", error);
    return NextResponse.json({ error: "Erro interno ao cadastrar" }, { status: 500 });
  }
}