-- Corrige a 003:
-- 1) o texto de busca usa o nome do cadastro de clientes; locatario_nome só entra em contrato antigo sem inquilino vinculado;
-- 2) ao alterar o cliente, as cópias locatario_* do contrato (lidas pela Área do Cliente) acompanham o cadastro.

CREATE OR REPLACE FUNCTION f_texto_busca_contrato(
  p_codigo text, p_pasta text, p_locatario text, p_inquilino_id integer, p_proprietario_id integer,
  p_imovel_id integer, p_imovel_codigo_legado text, p_imovel_endereco_legado text
) RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT f_busca(concat_ws(' ',
    p_codigo, 'pasta ' || p_pasta,
    coalesce((SELECT nome FROM clientes WHERE id = p_inquilino_id), p_locatario),
    (SELECT nome FROM clientes WHERE id = p_proprietario_id),
    (SELECT concat_ws(' ', codigo, titulo, endereco, bairro, cidade) FROM imoveis WHERE id = p_imovel_id),
    p_imovel_codigo_legado, p_imovel_endereco_legado
  ))
$$;

CREATE OR REPLACE FUNCTION trg_clientes_texto_busca() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.nome, NEW.cpf_cnpj, NEW.email, NEW.telefone) IS DISTINCT FROM (OLD.nome, OLD.cpf_cnpj, OLD.email, OLD.telefone) THEN
    -- Contratos em que é inquilino: atualiza as cópias (o gatilho de locacoes recalcula o texto de busca).
    UPDATE locacoes
       SET locatario_nome = NEW.nome, locatario_cpf = NEW.cpf_cnpj,
           locatario_email = NEW.email, locatario_telefone = NEW.telefone
     WHERE inquilino_id = NEW.id;
  END IF;
  IF NEW.nome IS DISTINCT FROM OLD.nome THEN
    UPDATE locacoes SET texto_busca = NULL WHERE proprietario_id = NEW.id AND inquilino_id IS DISTINCT FROM NEW.id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS clientes_texto_busca ON clientes;
CREATE TRIGGER clientes_texto_busca
  AFTER UPDATE OF nome, cpf_cnpj, email, telefone ON clientes
  FOR EACH ROW EXECUTE FUNCTION trg_clientes_texto_busca();

UPDATE locacoes SET texto_busca = NULL;
