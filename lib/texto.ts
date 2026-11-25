// Funções puras de texto, usadas no cliente e no servidor.

// Remove acentos e converte para minúsculas (mesma regra da função f_busca do banco).
export function normalizarBusca(texto: string | null | undefined): string {
  return (texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Escapa os curingas do LIKE para que "%" e "_" digitados pelo usuário sejam tratados como texto.
export function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function apenasDigitos(valor: string | null | undefined): string {
  return (valor || "").replace(/\D/g, "");
}

export function formatarCpfCnpj(valor: string | null | undefined): string {
  const d = apenasDigitos(valor);
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return valor || "";
}

// Mostra só o meio do documento (ex.: ***.456.789-**), para listas e seletores.
export function mascararCpfCnpj(valor: string | null | undefined): string {
  const d = apenasDigitos(valor);
  if (d.length === 11) return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
  if (d.length === 14) return `**.${d.slice(2, 5)}.${d.slice(5, 8)}/****-**`;
  return "";
}

export function formatarMoeda(valor: number | string | null | undefined): string {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Datas DATE do Postgres chegam como "YYYY-MM-DD" ou ISO; exibimos sem conversão de fuso.
export function formatarData(valor: string | null | undefined): string {
  if (!valor) return "—";
  const [ano, mes, dia] = String(valor).slice(0, 10).split("-");
  if (!ano || !mes || !dia) return "—";
  return `${dia}/${mes}/${ano}`;
}

// Diferença em meses completos entre duas datas "YYYY-MM-DD".
export function mesesEntre(inicio: string | null | undefined, fim: string | null | undefined): number | null {
  if (!inicio || !fim) return null;
  const [a1, m1, d1] = String(inicio).slice(0, 10).split("-").map(Number);
  if ([a1, m1, d1].some((n) => !Number.isFinite(n))) return null;
  // Soma 1 dia ao término: contrato de 01/01 a 31/12 conta 12 meses completos.
  const fimMais1 = new Date(`${String(fim).slice(0, 10)}T00:00:00Z`);
  if (isNaN(fimMais1.getTime())) return null;
  fimMais1.setUTCDate(fimMais1.getUTCDate() + 1);
  let meses = (fimMais1.getUTCFullYear() - a1) * 12 + (fimMais1.getUTCMonth() + 1 - m1);
  if (fimMais1.getUTCDate() < d1) meses -= 1;
  return Math.max(0, meses);
}

export function descreverPrazo(meses: number | null): string {
  if (meses === null) return "—";
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const partes = [];
  if (anos) partes.push(`${anos} ${anos === 1 ? "ano" : "anos"}`);
  if (resto) partes.push(`${resto} ${resto === 1 ? "mês" : "meses"}`);
  return partes.length ? partes.join(" e ") : "menos de 1 mês";
}
