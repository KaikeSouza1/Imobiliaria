-- Geração de documentos a partir dos modelos da imobiliária (contratos, termos e notificações em PDF).

-- Tipos novos de documento (o PDF gerado é guardado como qualquer outro documento).
ALTER TABLE documentos DROP CONSTRAINT IF EXISTS documentos_tipo_ck;
ALTER TABLE documentos ADD CONSTRAINT documentos_tipo_ck CHECK (tipo IN (
  'contrato_assinado', 'vistoria', 'comprovante', 'documento_pessoal', 'outro',
  'contrato_gerado', 'termo', 'notificacao'
));

-- De qual modelo o PDF saiu e com quais dados: permite gerar de novo corrigindo algum campo.
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS modelo VARCHAR(50);
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS dados_modelo JSONB;

-- Parâmetros do sistema (ex.: dados da imobiliária e do procurador usados nos modelos).
-- Ficam no banco, e não no código, porque incluem documentos pessoais do procurador.
CREATE TABLE IF NOT EXISTS parametros (
  chave          VARCHAR(50) PRIMARY KEY,
  valor          JSONB NOT NULL,
  atualizado_por VARCHAR(100),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
