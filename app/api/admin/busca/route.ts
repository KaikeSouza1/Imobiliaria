import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { filtrosDaUrl } from "@/lib/busca-contratos";
import { listarContratos } from "@/lib/contratos-db";
import { buscarClientes, buscarImoveis, descreverFoco } from "@/lib/busca-global";

// GET /api/admin/busca?q=&inquilino=&proprietario=&codigo=&endereco=&status=&reajuste_de=&reajuste_ate=&cliente_id=&imovel_id=&pagina=
// Resposta: { contratos: {itens,total,pagina,paginas}, clientes: [], imoveis: [], foco }
// Pessoas e imóveis só aparecem na busca simples (q), na primeira página.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const filtros = filtrosDaUrl(searchParams);
    const q = (filtros.q || "").trim();
    const comRelacionados = q.length >= 2 && (filtros.pagina ?? 1) === 1;

    const [contratos, clientes, imoveis, foco] = await Promise.all([
      listarContratos(filtros),
      comRelacionados ? buscarClientes(q) : Promise.resolve([]),
      comRelacionados ? buscarImoveis(q) : Promise.resolve([]),
      descreverFoco(filtros.cliente_id, filtros.imovel_id),
    ]);
    return NextResponse.json({ contratos, clientes, imoveis, foco });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro na busca" }, { status: 500 });
  }
}
