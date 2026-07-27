// Funções puras de data — sem dependência de banco/Node — podem ser importadas
// tanto no servidor (rotas de API) quanto no cliente (telas "use client" de preview).

// Calcula uma data de vencimento válida mesmo em meses curtos (ex: dia 31 em fevereiro)
export function calcularVencimento(ano: number, mesIndex: number, diaVencimento: number) {
  const ultimoDiaDoMes = new Date(ano, mesIndex + 1, 0).getDate();
  const dia = Math.min(diaVencimento, ultimoDiaDoMes);
  return new Date(ano, mesIndex, dia);
}

export function formatarReferencia(ano: number, mesIndex: number) {
  return `${String(mesIndex + 1).padStart(2, "0")}/${ano}`;
}

// Lista cada mês (ano + mesIndex) entre duas datas, inclusive nas pontas.
// Limitado a 240 meses (20 anos) como trava de segurança contra períodos absurdos.
export function listarMesesEntre(inicio: Date, fim: Date) {
  const meses: { ano: number; mesIndex: number }[] = [];
  let ano = inicio.getFullYear();
  let mesIndex = inicio.getMonth();
  const anoFim = fim.getFullYear();
  const mesIndexFim = fim.getMonth();

  let guarda = 0;
  while ((ano < anoFim || (ano === anoFim && mesIndex <= mesIndexFim)) && guarda < 240) {
    meses.push({ ano, mesIndex });
    mesIndex++;
    if (mesIndex > 11) { mesIndex = 0; ano++; }
    guarda++;
  }
  return meses;
}
