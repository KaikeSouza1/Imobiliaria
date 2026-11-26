-- Contratos de venda no mesmo cadastro de contratos (tabela locacoes), marcados por "tipo".
-- Venda: inquilino_id = comprador, proprietario_id = vendedor, data_inicio = data do contrato.
-- Status reaproveitados: ativo = em andamento, encerrado = concluída (vendido), rescindido = cancelada.
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS tipo VARCHAR(10) NOT NULL DEFAULT 'locacao';
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS valor_venda NUMERIC(14,2);
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS honorarios_percentual NUMERIC(5,2);

DO $$ BEGIN
  ALTER TABLE locacoes ADD CONSTRAINT locacoes_tipo_ck CHECK (tipo IN ('locacao','venda'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS locacoes_tipo_idx ON locacoes (tipo, status);
