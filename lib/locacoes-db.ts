import { query } from "@/lib/db";

export async function garantirTabelasLocacao() {
  await query(`
    CREATE TABLE IF NOT EXISTS locacoes (
      id                  SERIAL PRIMARY KEY,
      imovel_id           INTEGER,
      locatario_nome      VARCHAR(255) NOT NULL,
      locatario_cpf       VARCHAR(20)  NOT NULL,
      locatario_email     VARCHAR(255),
      locatario_telefone  VARCHAR(50),
      valor_aluguel       NUMERIC(12,2) NOT NULL DEFAULT 0,
      dia_vencimento      INTEGER NOT NULL DEFAULT 10,
      data_inicio         DATE,
      data_fim            DATE,
      status              VARCHAR(30) NOT NULL DEFAULT 'ativo',
      observacoes         TEXT,
      criado_em           TIMESTAMPTZ DEFAULT NOW(),
      atualizado_em       TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS locacao_boletos (
      id               SERIAL PRIMARY KEY,
      locacao_id       INTEGER NOT NULL REFERENCES locacoes(id) ON DELETE CASCADE,
      referencia       VARCHAR(20) NOT NULL,
      valor            NUMERIC(12,2) NOT NULL,
      vencimento       DATE NOT NULL,
      status           VARCHAR(20) NOT NULL DEFAULT 'pendente',
      linha_digitavel  VARCHAR(60),
      codigo_barras    VARCHAR(60),
      pago_em          TIMESTAMPTZ,
      criado_em        TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS locacao_anexos (
      id            SERIAL PRIMARY KEY,
      locacao_id    INTEGER NOT NULL REFERENCES locacoes(id) ON DELETE CASCADE,
      nome_arquivo  VARCHAR(255) NOT NULL,
      url           TEXT NOT NULL,
      tipo          VARCHAR(100),
      tamanho       INTEGER,
      criado_em     TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// Gerador determinístico (sem Math.random) só para preencher o boleto de demonstração
// com uma aparência realista. Nenhum valor aqui é validado por banco algum.
function criarGeradorSeed(seedInicial: number) {
  let seed = seedInicial;
  return (max: number) => {
    seed = (seed * 9301 + 49297) % 233280;
    return Math.floor((seed / 233280) * max);
  };
}

export function gerarLinhaDigitavel(seed: number) {
  const rnd = criarGeradorSeed(seed);
  const bloco = (len: number) => Array.from({ length: len }, () => rnd(10)).join("");
  return `341.9${bloco(4)} ${bloco(5)}.${bloco(6)} ${bloco(5)}.${bloco(6)} 9 ${bloco(14)}`;
}

export function gerarCodigoBarras(seed: number) {
  const rnd = criarGeradorSeed(seed + 7);
  return Array.from({ length: 44 }, () => rnd(10)).join("");
}

export function apenasDigitos(valor: string | null | undefined) {
  return (valor || "").replace(/\D/g, "");
}
