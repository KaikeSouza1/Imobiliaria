-- Campo único de busca por contrato, com índice trigram, para a busca geral ser rápida com muitos contratos.
-- Reúne código, pasta, inquilino, proprietário, código/título/endereço do imóvel e dados de contratos antigos.
-- Mantido pelo próprio banco (gatilhos): ao gravar o contrato e ao renomear cliente ou alterar endereço/código do imóvel.

ALTER TABLE locacoes ADD COLUMN IF NOT EXISTS texto_busca TEXT;

CREATE OR REPLACE FUNCTION f_texto_busca_contrato(
  p_codigo text, p_pasta text, p_locatario text, p_inquilino_id integer, p_proprietario_id integer,
  p_imovel_id integer, p_imovel_codigo_legado text, p_imovel_endereco_legado text
) RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT f_busca(concat_ws(' ',
    p_codigo, 'pasta ' || p_pasta, p_locatario,
    (SELECT nome FROM clientes WHERE id = p_inquilino_id),
    (SELECT nome FROM clientes WHERE id = p_proprietario_id),
    (SELECT concat_ws(' ', codigo, titulo, endereco, bairro, cidade) FROM imoveis WHERE id = p_imovel_id),
    p_imovel_codigo_legado, p_imovel_endereco_legado
  ))
$$;

CREATE OR REPLACE FUNCTION trg_locacoes_texto_busca() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.texto_busca := f_texto_busca_contrato(
    NEW.codigo, NEW.numero_pasta, NEW.locatario_nome, NEW.inquilino_id, NEW.proprietario_id,
    NEW.imovel_id, NEW.imovel_codigo_legado, NEW.imovel_endereco_legado);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS locacoes_texto_busca ON locacoes;
CREATE TRIGGER locacoes_texto_busca
  BEFORE INSERT OR UPDATE ON locacoes
  FOR EACH ROW EXECUTE FUNCTION trg_locacoes_texto_busca();

-- Cliente renomeado: recalcula os contratos em que aparece.
CREATE OR REPLACE FUNCTION trg_clientes_texto_busca() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.nome IS DISTINCT FROM OLD.nome THEN
    UPDATE locacoes SET texto_busca = NULL WHERE inquilino_id = NEW.id OR proprietario_id = NEW.id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS clientes_texto_busca ON clientes;
CREATE TRIGGER clientes_texto_busca
  AFTER UPDATE OF nome ON clientes
  FOR EACH ROW EXECUTE FUNCTION trg_clientes_texto_busca();

-- Imóvel com código/título/endereço alterado: recalcula os contratos dele.
CREATE OR REPLACE FUNCTION trg_imoveis_texto_busca() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.codigo, NEW.titulo, NEW.endereco, NEW.bairro, NEW.cidade)
     IS DISTINCT FROM (OLD.codigo, OLD.titulo, OLD.endereco, OLD.bairro, OLD.cidade) THEN
    UPDATE locacoes SET texto_busca = NULL WHERE imovel_id = NEW.id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS imoveis_texto_busca ON imoveis;
CREATE TRIGGER imoveis_texto_busca
  AFTER UPDATE OF codigo, titulo, endereco, bairro, cidade ON imoveis
  FOR EACH ROW EXECUTE FUNCTION trg_imoveis_texto_busca();

-- Preenche os contratos existentes (o gatilho recalcula a cada UPDATE).
UPDATE locacoes SET texto_busca = NULL;

CREATE INDEX IF NOT EXISTS locacoes_texto_busca_trgm ON locacoes USING gin (texto_busca gin_trgm_ops);

-- Imóveis na busca global (pessoas já têm índice por nome desde a 001).
CREATE INDEX IF NOT EXISTS imoveis_busca_trgm ON imoveis USING gin (
  f_busca(coalesce(codigo,'') || ' ' || coalesce(titulo,'') || ' ' || coalesce(endereco,'') || ' ' || coalesce(bairro,'') || ' ' || coalesce(cidade,''))
  gin_trgm_ops);
