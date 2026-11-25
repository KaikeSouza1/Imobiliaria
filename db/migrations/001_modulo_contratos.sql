-- Módulo de contratos e documentos.
-- Apenas acréscimos: nada existente é removido. Pode rodar mais de uma vez (IF NOT EXISTS).
-- Pressupõe que as tabelas "imoveis" e "usuarios" já existem (criadas fora deste repositório).

-- ---------------------------------------------------------------
-- Extensões e função de normalização para a busca
-- ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Remove acentos e converte para minúsculas. Declarada IMMUTABLE para poder ser usada em índices
-- (o dicionário é fixado explicitamente, o que torna o resultado estável).
CREATE OR REPLACE FUNCTION f_busca(texto text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT lower(public.unaccent('public.unaccent'::regdictionary, texto)) $$;

-- ---------------------------------------------------------------
-- Locações (garante a tabela caso o banco seja novo; em produção ela já existe)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locacoes (
  id                  SERIAL PRIMARY KEY,
  imovel_id           INTEGER,
  locatario_nome      VARCHAR(255) NOT NULL,
  locatario_cpf       VARCHAR(20),
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
);

-- ---------------------------------------------------------------
-- Clientes: cadastro único de inquilinos e proprietários
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id               SERIAL PRIMARY KEY,
  codigo           VARCHAR(30),
  nome             VARCHAR(255) NOT NULL,
  cpf_cnpj         VARCHAR(20),
  rg               VARCHAR(30),
  data_nascimento  DATE,
  estado_civil     VARCHAR(30),
  profissao        VARCHAR(100),
  email            VARCHAR(255),
  telefone         VARCHAR(50),
  cep              VARCHAR(10),
  logradouro       VARCHAR(255),
  numero           VARCHAR(20),
  complemento      VARCHAR(100),
  bairro           VARCHAR(100),
  cidade           VARCHAR(100),
  uf               VARCHAR(2),
  eh_proprietario  BOOLEAN NOT NULL DEFAULT FALSE,
  eh_inquilino     BOOLEAN NOT NULL DEFAULT FALSE,
  observacoes      TEXT,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS clientes_codigo_uk   ON clientes (codigo) WHERE codigo IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS clientes_cpf_cnpj_uk ON clientes (cpf_cnpj) WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj <> '';
CREATE INDEX IF NOT EXISTS clientes_nome_trgm ON clientes USING gin (f_busca(nome) gin_trgm_ops);

-- ---------------------------------------------------------------
-- Imóvel: proprietário atual (opcional)
-- ---------------------------------------------------------------
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS proprietario_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS imoveis_proprietario_idx ON imoveis (proprietario_id);
CREATE INDEX IF NOT EXISTS imoveis_codigo_trgm   ON imoveis USING gin (f_busca(codigo) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS imoveis_endereco_trgm ON imoveis USING gin (f_busca(coalesce(endereco,'') || ' ' || coalesce(bairro,'') || ' ' || coalesce(cidade,'')) gin_trgm_ops);

-- ---------------------------------------------------------------
-- Locações passam a ser o contrato
-- ---------------------------------------------------------------
ALTER TABLE locacoes ALTER COLUMN locatario_cpf DROP NOT NULL; -- contratos antigos podem não ter CPF

ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS codigo                 VARCHAR(30);
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS proprietario_id        INTEGER REFERENCES clientes(id) ON DELETE SET NULL;
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS inquilino_id           INTEGER REFERENCES clientes(id) ON DELETE SET NULL;
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS data_entrega_chaves    DATE;
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS periodo_reajuste_meses INTEGER NOT NULL DEFAULT 12;
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS proximo_reajuste       DATE;
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS corretor_responsavel   VARCHAR(100);
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS finalidade             VARCHAR(20);
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS imovel_codigo_legado   VARCHAR(50);
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS imovel_endereco_legado VARCHAR(255);
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS numero_pasta           VARCHAR(30);
ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS origem                 VARCHAR(10) NOT NULL DEFAULT 'sistema';

DO $$ BEGIN
  ALTER TABLE locacoes ADD CONSTRAINT locacoes_finalidade_ck CHECK (finalidade IS NULL OR finalidade IN ('residencial','comercial'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE locacoes ADD CONSTRAINT locacoes_origem_ck CHECK (origem IN ('sistema','legado'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS locacoes_codigo_uk ON locacoes (codigo) WHERE codigo IS NOT NULL;
CREATE INDEX IF NOT EXISTS locacoes_status_idx           ON locacoes (status);
CREATE INDEX IF NOT EXISTS locacoes_proximo_reajuste_idx ON locacoes (proximo_reajuste);
CREATE INDEX IF NOT EXISTS locacoes_proprietario_idx     ON locacoes (proprietario_id);
CREATE INDEX IF NOT EXISTS locacoes_inquilino_idx        ON locacoes (inquilino_id);
CREATE INDEX IF NOT EXISTS locacoes_imovel_idx           ON locacoes (imovel_id);
CREATE INDEX IF NOT EXISTS locacoes_corretor_idx         ON locacoes (corretor_responsavel);
CREATE INDEX IF NOT EXISTS locacoes_codigo_trgm          ON locacoes USING gin (f_busca(codigo) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS locacoes_locatario_nome_trgm  ON locacoes USING gin (f_busca(locatario_nome) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS locacoes_legado_trgm          ON locacoes USING gin (f_busca(coalesce(imovel_codigo_legado,'') || ' ' || coalesce(imovel_endereco_legado,'')) gin_trgm_ops);

-- ---------------------------------------------------------------
-- Documentos (PDF fica no storage privado; aqui só a referência)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos (
  id                 SERIAL PRIMARY KEY,
  locacao_id         INTEGER REFERENCES locacoes(id) ON DELETE RESTRICT,
  cliente_id         INTEGER REFERENCES clientes(id) ON DELETE RESTRICT,
  imovel_id          INTEGER REFERENCES imoveis(id)  ON DELETE RESTRICT,
  tipo               VARCHAR(30) NOT NULL DEFAULT 'outro',
  chave_storage      VARCHAR(100) NOT NULL UNIQUE,
  nome_original      VARCHAR(255) NOT NULL,
  tamanho            INTEGER NOT NULL,
  sha256             CHAR(64) NOT NULL,
  incluido_por       VARCHAR(100) NOT NULL,
  incluido_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removido_em        TIMESTAMPTZ,
  removido_por       VARCHAR(100),
  origem_importacao  TEXT,
  CONSTRAINT documentos_vinculo_ck CHECK (num_nonnulls(locacao_id, cliente_id, imovel_id) >= 1),
  CONSTRAINT documentos_tipo_ck CHECK (tipo IN ('contrato_assinado','vistoria','comprovante','documento_pessoal','outro'))
);

-- Mesmo arquivo não entra duas vezes no mesmo vínculo (enquanto não removido).
CREATE UNIQUE INDEX IF NOT EXISTS documentos_sem_duplicidade_uk
  ON documentos (sha256, coalesce(locacao_id,0), coalesce(cliente_id,0), coalesce(imovel_id,0))
  WHERE removido_em IS NULL;
CREATE INDEX IF NOT EXISTS documentos_locacao_idx  ON documentos (locacao_id) WHERE removido_em IS NULL;
CREATE INDEX IF NOT EXISTS documentos_cliente_idx  ON documentos (cliente_id) WHERE removido_em IS NULL;
CREATE INDEX IF NOT EXISTS documentos_imovel_idx   ON documentos (imovel_id)  WHERE removido_em IS NULL;
CREATE INDEX IF NOT EXISTS documentos_recentes_idx ON documentos (incluido_em DESC) WHERE removido_em IS NULL;
CREATE INDEX IF NOT EXISTS documentos_sha256_idx   ON documentos (sha256);

-- Trilha de acesso. Não guarda nome de arquivo nem dado pessoal: só ids, ação, usuário e IP.
CREATE TABLE IF NOT EXISTS documentos_log (
  id            BIGSERIAL PRIMARY KEY,
  documento_id  INTEGER NOT NULL REFERENCES documentos(id) ON DELETE RESTRICT,
  acao          VARCHAR(20) NOT NULL CHECK (acao IN ('incluir','visualizar','baixar','excluir')),
  usuario       VARCHAR(100) NOT NULL,
  ip            VARCHAR(64),
  data_hora     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS documentos_log_documento_idx ON documentos_log (documento_id, data_hora DESC);

-- PDFs da importação em lote que não puderam ser vinculados automaticamente.
CREATE TABLE IF NOT EXISTS importacao_pendencias (
  id              SERIAL PRIMARY KEY,
  caminho         TEXT NOT NULL,
  nome_arquivo    VARCHAR(255) NOT NULL,
  tamanho         INTEGER NOT NULL,
  sha256          CHAR(64) NOT NULL UNIQUE,
  motivo          VARCHAR(255) NOT NULL,
  -- Contrato escolhido manualmente na tela; a próxima execução da importação envia e vincula o arquivo.
  locacao_id      INTEGER REFERENCES locacoes(id) ON DELETE SET NULL,
  resolvido_em    TIMESTAMPTZ,
  documento_id    INTEGER REFERENCES documentos(id) ON DELETE SET NULL,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
