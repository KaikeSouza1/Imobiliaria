-- Próxima data de reajuste calculada a partir do início do contrato e do período (em meses).
-- Sempre soma a partir da data de início, para não "escorregar" o dia (ex.: 31/01 + 1 mês = 28/02, + 2 meses = 31/03).
-- Retorna a primeira data de aniversário >= referencia. NULL se não houver início ou período.
CREATE OR REPLACE FUNCTION f_proximo_reajuste(inicio date, periodo_meses integer, referencia date)
RETURNS date
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE STRICT
AS $$
DECLARE
  k integer;
  candidata date;
BEGIN
  IF periodo_meses <= 0 THEN
    RETURN NULL;
  END IF;
  -- Estimativa direta do número de períodos já passados, depois ajuste fino.
  k := greatest(1, floor(((extract(year FROM age(referencia, inicio)) * 12) + extract(month FROM age(referencia, inicio))) / periodo_meses)::integer);
  candidata := (inicio + make_interval(months => k * periodo_meses))::date;
  WHILE candidata < referencia LOOP
    k := k + 1;
    candidata := (inicio + make_interval(months => k * periodo_meses))::date;
  END LOOP;
  WHILE k > 1 AND (inicio + make_interval(months => (k - 1) * periodo_meses))::date >= referencia LOOP
    k := k - 1;
    candidata := (inicio + make_interval(months => k * periodo_meses))::date;
  END LOOP;
  RETURN candidata;
END $$;

COMMENT ON COLUMN locacoes.proximo_reajuste IS
  'Reservado para os alertas de reajuste (fora do escopo atual). As telas usam f_proximo_reajuste(data_inicio, periodo_reajuste_meses, CURRENT_DATE).';
