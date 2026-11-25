// Números, valores e datas por extenso, como aparecem nos contratos ("R$ 1.200,00 (mil e duzentos reais)").

const UNIDADES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
  "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (c) partes.push(CENTENAS[c]);
  if (resto) {
    if (resto < 20) partes.push(UNIDADES[resto]);
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      partes.push(u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
    }
  }
  return partes.join(" e ");
}

const ESCALAS: [string, string][] = [["", ""], ["mil", "mil"], ["milhão", "milhões"], ["bilhão", "bilhões"]];

// Inteiro por extenso (0 a 999.999.999.999).
export function numeroPorExtenso(valor: number): string {
  const n = Math.floor(Math.abs(valor));
  if (n === 0) return "zero";
  const grupos: number[] = [];
  let resto = n;
  while (resto > 0) {
    grupos.push(resto % 1000);
    resto = Math.floor(resto / 1000);
  }
  const partes: { texto: string; valor: number }[] = [];
  for (let i = grupos.length - 1; i >= 0; i--) {
    const g = grupos[i];
    if (!g) continue;
    let texto: string;
    if (i === 1) texto = g === 1 ? "mil" : `${ate999(g)} mil`;
    else if (i >= 2) texto = `${ate999(g)} ${g === 1 ? ESCALAS[i][0] : ESCALAS[i][1]}`;
    else texto = ate999(g);
    partes.push({ texto, valor: g });
  }
  // "e" antes do último grupo quando ele é < 100 ou centena redonda (ex.: "mil e duzentos", "dois mil e cinco").
  let saida = partes[0].texto;
  for (let i = 1; i < partes.length; i++) {
    const ultimo = i === partes.length - 1;
    const v = partes[i].valor;
    saida += ultimo && (v < 100 || v % 100 === 0) ? ` e ${partes[i].texto}` : ` ${partes[i].texto}`;
  }
  return saida;
}

// Valor em reais por extenso: 1200 -> "mil e duzentos reais"; 109.09 -> "cento e nove reais e nove centavos".
export function reaisPorExtenso(valor: number): string {
  const centavosTotal = Math.round(Math.abs(valor) * 100);
  const reais = Math.floor(centavosTotal / 100);
  const centavos = centavosTotal % 100;
  const partes: string[] = [];
  if (reais) {
    const milhaoRedondo = reais >= 1_000_000 && reais % 1_000_000 === 0;
    partes.push(`${numeroPorExtenso(reais)}${milhaoRedondo ? " de" : ""} ${reais === 1 ? "real" : "reais"}`);
  }
  if (centavos) partes.push(`${numeroPorExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  return partes.length ? partes.join(" e ") : "zero reais";
}

export function moeda(valor: number): string {
  return Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// "R$ 1.200,00 (mil e duzentos reais)"
export function moedaComExtenso(valor: number): string {
  return `R$ ${moeda(valor)} (${reaisPorExtenso(valor)})`;
}

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function partesData(iso: string) {
  const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return null;
  return { a, m, d };
}

// "2026-11-18" -> "18 de Novembro de 2026" (minúsculo com { minusculo: true })
export function dataPorExtenso(iso: string, opcoes: { minusculo?: boolean } = {}): string {
  const p = partesData(iso);
  if (!p) return "";
  const mes = MESES[p.m - 1];
  return `${String(p.d).padStart(2, "0")} de ${opcoes.minusculo ? mes.toLowerCase() : mes} de ${p.a}`;
}

// "2026-11-18" -> "18/11/2026"
export function dataCurta(iso: string): string {
  const p = partesData(iso);
  return p ? `${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")}/${p.a}` : "";
}

// "2027-11-18" -> "18.11.27" (como na cláusula de rescisão)
export function dataPontos(iso: string): string {
  const p = partesData(iso);
  return p ? `${String(p.d).padStart(2, "0")}.${String(p.m).padStart(2, "0")}.${String(p.a).slice(2)}` : "";
}

// Soma meses mantendo o dia (31/01 + 1 mês = 28/02).
export function somarMeses(iso: string, meses: number): string {
  const p = partesData(iso);
  if (!p) return "";
  const alvo = new Date(Date.UTC(p.a, p.m - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(p.d, ultimoDia));
  return alvo.toISOString().slice(0, 10);
}

// 12 -> "12 (doze)"; com maiusculas: "24 (VINTE E QUATRO)"
export function numeroComExtenso(n: number, opcoes: { maiusculas?: boolean } = {}): string {
  const ext = numeroPorExtenso(n);
  return `${n} (${opcoes.maiusculas ? ext.toUpperCase() : ext})`;
}

export function hojeISO(): string {
  const d = new Date();
  // Data no fuso do Brasil (UTC-3), para o documento não sair com a data de amanhã à noite.
  return new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}
