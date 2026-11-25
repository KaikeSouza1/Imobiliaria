import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { query } from "@/lib/db";
import { escaparLike, apenasDigitos, mascararCpfCnpj } from "@/lib/texto";

// GET /api/admin/clientes?q=&papel=inquilino|proprietario
// Usado pelo seletor do formulário de contrato. Devolve o documento mascarado.
// O cadastro completo de clientes (F7) virá na Fase 5.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // ?id=N devolve um cliente só (para preencher o seletor a partir do imóvel).
  const id = Number(searchParams.get("id"));
  if (Number.isInteger(id) && id > 0) {
    const r = await query("SELECT id, codigo, nome, cpf_cnpj, telefone FROM clientes WHERE id = $1", [id]);
    if (!r.rows[0]) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    const { cpf_cnpj, ...c } = r.rows[0];
    return NextResponse.json({ ...c, documento: mascararCpfCnpj(cpf_cnpj) });
  }

  const q = (searchParams.get("q") || "").trim();
  const papel = searchParams.get("papel");
  if (q.length < 2) return NextResponse.json([]);

  try {
    const params: unknown[] = [`%${escaparLike(q)}%`];
    let filtroDoc = "";
    const digitos = apenasDigitos(q);
    if (digitos.length >= 3) {
      params.push(`${digitos}%`);
      filtroDoc = ` OR cpf_cnpj LIKE $${params.length}`;
    }
    params.push(q);
    const pSimilaridade = `$${params.length}`;
    const filtroPapel =
      papel === "inquilino" ? " AND eh_inquilino" : papel === "proprietario" ? " AND eh_proprietario" : "";
    const res = await query(
      `SELECT id, codigo, nome, cpf_cnpj, telefone, eh_inquilino, eh_proprietario
         FROM clientes
        WHERE (f_busca(nome) LIKE f_busca($1) OR f_busca(codigo) LIKE f_busca($1)${filtroDoc})${filtroPapel}
        ORDER BY similarity(f_busca(nome), f_busca(${pSimilaridade})) DESC, nome
        LIMIT 10`,
      params
    );
    return NextResponse.json(
      res.rows.map(({ cpf_cnpj, ...c }) => ({ ...c, documento: mascararCpfCnpj(cpf_cnpj) }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 });
  }
}
