import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { garantirTabelasLocacao } from "@/lib/locacoes-db";
import { enviarAnexoParaR2, TAMANHO_MAXIMO_ANEXO } from "@/lib/upload-anexo";

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
      "SELECT * FROM locacao_anexos WHERE locacao_id = $1 ORDER BY criado_em DESC",
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar anexos" }, { status: 500 });
  }
}

// Upload de documentos do contrato (PDF assinado, comprovantes, etc.) — aceita qualquer tipo de arquivo,
// diferente do upload de fotos de imóveis que já existe no site.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    await garantirTabelasLocacao();

    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const criados = [];
    for (const file of files) {
      if (file.size > TAMANHO_MAXIMO_ANEXO) {
        return NextResponse.json({ error: `Arquivo "${file.name}" excede o limite de 15MB` }, { status: 413 });
      }

      const enviado = await enviarAnexoParaR2(file, `locacoes/${id}`);

      const result = await query(
        `INSERT INTO locacao_anexos (locacao_id, nome_arquivo, url, tipo, tamanho)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [id, enviado.nomeOriginal, enviado.url, enviado.tipo, enviado.tamanho]
      );
      criados.push(result.rows[0]);
    }

    return NextResponse.json(criados, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao enviar anexo" }, { status: 500 });
  }
}
