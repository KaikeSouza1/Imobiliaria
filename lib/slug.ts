// lib/slug.ts — Geração e parse de slugs para imóveis

export function generateSlug(imovel: {
  id: number;
  titulo: string;
  tipo: string;
  finalidade: string;
  bairro: string;
  cidade: string;
}): string {
  const toSlug = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^a-z0-9\s-]/g, "")   // remove especiais
      .trim()
      .replace(/\s+/g, "-");           // espaços → hífens

  const finalidade = imovel.finalidade === "Venda" ? "venda" : "aluguel";
  const tipo = toSlug(imovel.tipo);
  const bairro = toSlug(imovel.bairro);
  const cidade = toSlug(imovel.cidade);

  // Formato: /imovel/venda/casa/sao-pedro-porto-uniao-12
  return `${finalidade}/${tipo}/${bairro}-${cidade}-${imovel.id}`;
}

export function extractIdFromSlug(slug: string): string | null {
  // Pega o último segmento e extrai o número no final
  const parts = slug.split("-");
  const id = parts[parts.length - 1];
  return /^\d+$/.test(id) ? id : null;
}