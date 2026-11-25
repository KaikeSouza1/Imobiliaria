# Plano: módulo de contratos e documentos com busca global

Status: **Fase 2 concluída em 25/11/2026. Aguardando validação para a Fase 3.**

## Ajustes combinados após a aprovação (25/11/2026)

- **Boletos ficam fora do módulo.** As telas de contrato não mostram nem geram boletos por enquanto. As tabelas e rotas de boletos não são apagadas, só deixam de aparecer nas telas do módulo.
- **Nada entra no menu ainda.** As telas novas ficam acessíveis só pela URL até a liberação.
- **Banco:** liberado o uso do banco de produção. O usuário do banco é superusuário, então as extensões foram instaladas sem problema e o plano B da busca não é necessário. Os testes que acessam o banco só leem dados ou rodam dentro de transação com `ROLLBACK`.

## 1. O que já existe e foi levado em conta

| Item | Onde | Observação |
|---|---|---|
| Stack | Next.js 16 (App Router), React 19, TypeScript, Tailwind 3, `lucide-react` | Hospedado na Vercel (região `gru1`). |
| Banco | PostgreSQL com `pg` puro ([lib/db.ts](../lib/db.ts)) | O Prisma está no `package.json`, mas não é usado. Não há migrações: as tabelas são criadas em tempo de execução com `CREATE TABLE IF NOT EXISTS`. |
| Autenticação | next-auth com credenciais ([route.ts](../app/api/auth/[...nextauth]/route.ts)) | Existem dois papéis: `admin` (definido no `.env`) e `corretor` (tabela `usuarios`). A tabela `usuarios` tem uma coluna `role`, mas o login ignora o valor dela e sempre devolve `corretor`. |
| Proteção de rotas | [middleware.ts](../middleware.ts) e `getServerSession` em cada rota de API | Qualquer usuário logado acessa tudo, exceto a tela de Corretores. |
| **Locações** | `locacoes`, `locacao_boletos`, `locacao_anexos` ([lib/locacoes-db.ts](../lib/locacoes-db.ts)), telas em `/admin/locacoes` | Já é um cadastro de contratos de aluguel (inquilino, imóvel, valor, início e fim, status, anexos), mas **não aparece no menu**. Os anexos vão para o R2 com **URL pública**. |
| Imóveis | tabela `imoveis` e listagem em [app/admin/imoveis/page.tsx](../app/admin/imoveis/page.tsx) | Os filtros são busca, código, cidade ou bairro, tipo, finalidade e status, todos aplicados no cliente. É o padrão visual que vamos seguir. |
| Proprietários do CRM | `crm_proprietarios` | São leads captados de anúncios, não proprietários com contrato. **Não serão reutilizados como cadastro.** |
| Armazenamento | Cloudflare R2 via `@aws-sdk/client-s3` ([lib/upload-anexo.ts](../lib/upload-anexo.ts)) | O bucket atual é público (`NEXT_PUBLIC_R2_URL`). |
| Testes | nenhum | Ainda não há executor de testes. |

## 2. Decisões

### 2.1 O contrato aproveita `locacoes`
Não vamos criar uma tabela nova de contratos. A tabela `locacoes` vira o contrato e ganha colunas novas com `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`:
`codigo` (único), `proprietario_id`, `inquilino_id`, `data_entrega_chaves`, `periodo_reajuste_meses` (padrão 12), `proximo_reajuste`, `corretor_responsavel`, `finalidade` (residencial ou comercial), `imovel_codigo_legado`, `imovel_endereco_legado`, `numero_pasta` e `origem` (`sistema` ou `legado`).

- Os campos `locatario_*` continuam onde estão, porque os boletos e a Área do Cliente dependem deles. O inquilino passa a ser `inquilino_id`, e os campos antigos são preenchidos automaticamente para manter a compatibilidade.
- `locatario_cpf` deixa de ser `NOT NULL`, porque contratos antigos da lista impressa podem não ter o CPF.
- `imovel_id` continua opcional. Contrato antigo de imóvel que não está no site usa `imovel_codigo_legado` e `imovel_endereco_legado`.
- O proprietário fica no próprio contrato (`proprietario_id`), que é quem era o dono quando o contrato foi assinado. Também criamos `imoveis.proprietario_id`, que é opcional e preenche o proprietário automaticamente ao escolher o imóvel.
- A tela de Contratos reaproveita e amplia `/admin/locacoes` (listagem, novo, editar e detalhes). Na interface, o nome passa a ser "Contratos".

### 2.2 Clientes num cadastro único
Criamos a tabela nova `clientes` para inquilinos e proprietários: `codigo`, `nome`, `nome_busca` (normalizado), `cpf_cnpj`, `rg`, `data_nascimento`, `estado_civil`, `profissao`, `email`, `telefone`, endereço (`cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf`), `eh_proprietario`, `eh_inquilino`, `observacoes` e as datas de criação e atualização. A mesma pessoa pode ser inquilina e proprietária.

Os documentos pessoais (RG, comprovante etc.) entram como `documentos` ligados a `cliente_id`.

### 2.3 Documentos: tabela `documentos` e bucket privado no R2
- Tabela `documentos`: `locacao_id`, `cliente_id` e `imovel_id` (todos opcionais, mas há um `CHECK` exigindo pelo menos um), `tipo` (`contrato_assinado`, `vistoria`, `comprovante`, `documento_pessoal`, `outro`), `chave_storage` (UUID gerado pelo sistema), `nome_original` (sanitizado), `tamanho`, `sha256`, `incluido_por`, `incluido_em`, `removido_em`, `removido_por` e `origem_importacao` (caminho relativo, usado pela importação).
- **Sem duplicidade:** índice único em `(sha256, locacao_id)` só para documentos não removidos. Se o mesmo arquivo for enviado de novo para o mesmo contrato, ele é recusado com uma mensagem clara.
- **Exclusão lógica:** a exclusão só preenche `removido_em`. O arquivo continua no R2.
- **Log:** tabela `documentos_log` com `documento_id`, `acao` (incluir, visualizar, baixar, excluir), `usuario`, `data_hora` e `ip`. O log não guarda nome do arquivo, CPF ou nome de pessoa.
- **Armazenamento:** um bucket R2 **privado e novo**, configurado em `R2_DOCUMENTOS_BUCKET`. Não vamos usar o bucket público das fotos, porque qualquer arquivo dele pode ser acessado pela URL. Os arquivos ficam em `documentos/<uuid>.pdf`. Ver e baixar passam pela rota autenticada `/api/admin/documentos/[id]/arquivo`, que confere a permissão, grava o log e repassa o arquivo (`inline` para ver, `attachment` para baixar). Não existe URL pública.
- **Upload na Vercel:** as funções da Vercel aceitam no máximo cerca de 4,5 MB por requisição, e um contrato escaneado costuma passar disso. O fluxo terá três passos:
  1. O servidor gera uma URL de envio assinada (PUT) que vale por 5 minutos.
  2. O navegador envia o arquivo direto para o R2.
  3. O servidor confirma o envio, lendo o arquivo do R2 e conferindo o tamanho (até **20 MB**), a assinatura `%PDF-` nos primeiros bytes (o tipo real, não a extensão) e o SHA-256. Se a validação falhar, o objeto é apagado e o usuário recebe a mensagem do motivo.
- Os anexos antigos de `locacao_anexos` continuam funcionando. Na Fase 3, um script opcional copia esses anexos para `documentos` no bucket privado. A tabela antiga só é desativada depois que você validar a cópia.

### 2.4 Busca global com Postgres (`unaccent` e `pg_trgm`)
- Extensões `unaccent` e `pg_trgm`, mais uma função imutável `f_busca(text)` que tira acentos e converte para minúsculas.
- Índices GIN trigram em `f_busca(...)` para: nome dos clientes, código do contrato, código e endereço do imóvel, e os campos `*_legado` do contrato.
- A busca usa `ILIKE '%termo%'`, que aceita termo parcial e ignora acentos e maiúsculas. Os resultados vêm paginados (20 por página) e ordenados por relevância (`similarity`) e depois por data.
- A rota é `GET /api/admin/busca`. Ela aceita `q` (caixa simples) e os filtros avançados `inquilino`, `proprietario`, `codigo`, `endereco`, `status`, `reajuste_de` e `reajuste_ate`.
- **Plano B:** se o servidor do banco não permitir `CREATE EXTENSION`, o app normaliza o texto e grava em colunas `*_busca` com índice btree e trigram. Só vamos saber se é necessário na Fase 1.

### 2.5 Perfis e permissões
- A coluna `usuarios.role`, que já existe, passa a ser respeitada no login. Os perfis são:

| Permissão | admin | gerente | corretor |
|---|---|---|---|
| Listar e ver contratos | todos | todos | só os seus (onde é o corretor responsável) |
| Criar e editar contratos | sim | sim | não |
| Ver dados pessoais dos clientes (CPF, RG, documentos pessoais) | sim | sim | não (vê só nome e telefone) |
| Ver e baixar documentos do contrato | sim | sim | só dos seus contratos |
| Incluir documentos | sim | sim | só nos seus contratos |
| Excluir documentos | sim | sim | não |
| Importação em lote | sim | não | não |
| Administração (perfis e acessos) | sim | não | não |

- Tudo isso fica concentrado em `lib/permissoes.ts` (`pode(usuario, acao, recurso)`) e é usado nas rotas de API e no menu.
- **Mudança de comportamento:** as rotas atuais de `/api/admin/locacoes` passam a seguir essa regra. Hoje qualquer corretor logado vê todos os contratos.
- A tela Administração → Perfis e acessos reaproveita `/admin/corretores` e ganha a escolha do perfil.

### 2.6 Migrações
- Pasta `db/migrations/NNN_nome.sql` e o script `npm run db:migrar` ([scripts/migrar.ts](../scripts/migrar.ts), executado com `tsx`), com controle na tabela `schema_migrations`. As migrações usam `IF NOT EXISTS` e podem ser executadas mais de uma vez.
- O `garantirTabelasLocacao()` que já existe continua como está, para não quebrar nada.

### 2.7 Testes
- `vitest` como dependência de desenvolvimento.
- **Testes unitários** (rodam sempre): validação de PDF por assinatura e tamanho, sanitização de nome, normalização da busca, matriz de permissões e montagem do SQL da busca.
- **Testes de integração** (rodam só com `RODAR_TESTES_BANCO=1`, no banco de produção): chamam as rotas de busca, de permissão (401 e 403 por perfil) e de upload com uma sessão simulada. Os dados fictícios são criados dentro de uma transação desfeita no fim, ou com o prefixo `TESTE-` e removidos ao final.

### 2.8 Menu e navegação
Barra lateral do admin:
- Cadastros: Imóveis, Clientes
- Contratos
- Documentos
- Busca global
- Administração (só para admin)
- Mensagens, CRM e Corretores continuam como estão

Uma caixa de busca no topo do layout do admin leva para `/admin/busca?q=...` e fica disponível em todas as telas do painel. O CRM (`/crm`) usa um layout próprio e vai ganhar um atalho para a busca. Qualquer contrato fica a no máximo dois cliques: Busca ou Contratos → Detalhes → aba Documentos.

### 2.9 Importação em lote
- Script `npm run importar:documentos -- --pasta "C:\...\Documento" [--simular]`, executado **no notebook da imobiliária**. Ele roda local para não esbarrar no limite da Vercel e conecta direto no banco e no R2.
- Para cada PDF, o script procura o código do contrato no nome do arquivo e no nome das pastas.
  - Se achar o código, vincula o PDF ao contrato.
  - Se não achar, registra o arquivo como "pendente de vínculo" na tabela `importacao_pendencias`, sem enviar ao R2 ainda. A tela Documentos → "Usar Pasta" lista essas pendências para vínculo manual.
- Arquivo cujo SHA-256 já foi importado é ignorado, então dá para rodar a importação de novo sem duplicar.
- Ao final, o script gera um relatório CSV com as colunas importado, ignorado (duplicado), pendente e erro.
- Contratos antigos podem ser cadastrados pelo formulário com `origem = legado`, sem exigir os campos obrigatórios do contrato novo, ou em lote por CSV (`npm run importar:contratos-legados -- arquivo.csv`) a partir da lista impressa digitada. As colunas são código, inquilino, proprietário, código do imóvel, endereço, valor e número da pasta.

## 3. Fases

| # | Fase | Entregas | Commit |
|---|---|---|---|
| 0 ✅ | Descoberta e plano | este documento | `docs: plano do modulo de contratos` |
| 1 ✅ | Modelo de dados | executor de migrações, `001_contratos.sql` (clientes, colunas novas em locacoes e imoveis, documentos, log, pendências, extensões e índices), vitest instalado | `feat(db): ...` |
| 2 ✅ | Contratos (F1, F3, F4, F6) | APIs ampliadas, listagem com filtros (status, reajuste entre datas), detalhes com as abas "Dados do Contrato" e "Documentos" (menu adiado) | `feat(contratos): ...` |
| 3 | Documentos (F2) | upload em três passos, validação, ver e baixar autenticados, exclusão lógica, log, tela "Gestão de Documentos", cópia dos anexos antigos | `feat(documentos): ...` |
| 4 | Busca global (F5) | API e tela, caixa de busca no layout | `feat(busca): ...` |
| 5 | Clientes (F7) | painel único de inquilinos e proprietários, seletor no formulário do contrato | `feat(clientes): ...` |
| 6 | Permissões (F9) | `lib/permissoes.ts`, login respeitando o `role`, aplicação nas rotas e no menu, tela de perfis | `feat(permissoes): ...` |
| 7 | Importação e contratos antigos (F8) | scripts de PDF e CSV, tela de pendências | `feat(importacao): ...` |
| 8 | Fechamento | seed fictício, testes, `COMO_USAR_MODULO_CONTRATOS.md`, guia de backup e restauração (`pg_dump` + `rclone` do bucket) | `docs: ...` |

Ao fim de cada fase, os testes rodam junto com `tsc --noEmit` e `next lint`, este plano é atualizado e o trabalho para até você validar.

## 4. Registro da Fase 1

- `db/migrations/001_modulo_contratos.sql` cria as extensões `unaccent` e `pg_trgm`, a função `f_busca`, as tabelas `clientes`, `documentos`, `documentos_log` e `importacao_pendencias`, as colunas novas em `locacoes` e `imoveis.proprietario_id`, e os índices trigram e btree. Não apaga nada, e o teste `tests/migracoes.test.ts` garante isso.
- A coluna `locatario_cpf` deixou de ser `NOT NULL`.
- Um documento ligado a um contrato tem a regra `ON DELETE RESTRICT`. Por isso, um contrato com documentos não pode ser excluído, e a tela vai avisar isso na Fase 2.
- `importacao_pendencias.locacao_id` guarda o contrato escolhido manualmente. A próxima execução da importação envia e vincula esses arquivos.
- Comandos:
  - `npm run db:migrar` aplica as migrações pendentes. Com `-- --status`, só mostra a situação.
  - `npm test` roda os testes. Com `RODAR_TESTES_BANCO=1`, roda também os testes que leem o banco.
- Foi usado `vitest@3`, porque a versão 5 pede `@types/node` 22 ou mais novo e o projeto está na 20.
- Verificado:
  - A migração foi reexecutada dentro de uma transação com `ROLLBACK` e não deu erro.
  - A locação que já existia continua legível.
  - O índice `clientes_nome_trgm` é usado pela busca (conferido com `EXPLAIN`).
  - 9 de 9 testes passam.

## 4.1 Registro da Fase 2

**Telas** (acessíveis só pela URL, ainda fora do menu):

| Tela | Endereço |
|---|---|
| Listagem | `/admin/locacoes` |
| Novo contrato | `/admin/locacoes/novo` |
| Contrato antigo | `/admin/locacoes/novo?legado=1` |
| Detalhes | `/admin/locacoes/[id]` |
| Edição | `/admin/locacoes/editar/[id]` |

**Listagem.** É paginada no servidor, com 20 contratos por página. A busca geral cobre inquilino, proprietário, endereço, código e pasta. Há filtro por código, status (ativo, encerrado ou rescindido), finalidade e intervalo do próximo reajuste. Os cards mostram total de contratos, ativos, soma dos aluguéis ativos e reajustes nos próximos 30 dias. O card de reajustes também funciona como atalho de filtro.

**Detalhes.** O topo mostra código, status, inquilino, imóvel e endereço completo. A aba "Dados do Contrato" traz:
- prazos: tempo total, início, término, entrega das chaves, período e próximo reajuste;
- valor e vencimento;
- corretor e finalidade;
- partes do contrato e observações.

A aba "Documentos" mostra um estado vazio. O botão "Anexar PDF" fica desabilitado até a Fase 3.

**Formulário.** É o mesmo para criar e editar.
- O imóvel é buscado por código, título ou endereço. Há a opção "imóvel não cadastrado no site", para contratos antigos.
- Inquilino e proprietário são buscados no cadastro de clientes ou criados na hora. Se o CPF/CNPJ informado já existir, o cadastro existente é reaproveitado.
- A finalidade é sugerida pelo tipo do imóvel. Se o imóvel já tem proprietário cadastrado, ele também é sugerido.
- Os erros aparecem no topo do formulário, em vez de alertas.

**Regras no servidor.** Ficam em `lib/contratos.ts`, `lib/busca-contratos.ts` e `lib/contratos-db.ts`.
- **Código do contrato:** quando não é informado, é gerado automaticamente (`CT-00001`). Código repetido devolve o erro 409.
- **Contrato antigo:** precisa só do código, do inquilino e de alguma identificação do imóvel.
- **Exclusão:** é bloqueada se houver documento vinculado. A orientação é mudar o status para "Encerrado".
- **Compatibilidade:** os campos `locatario_*` continuam preenchidos a partir do inquilino, porque a Área do Cliente ainda lê deles.
- **Proprietário do imóvel:** `imoveis.proprietario_id` só é preenchido quando está vazio. Nunca é sobrescrito.

**Próximo reajuste.** É calculado pela função `f_proximo_reajuste` (migração `002`), sempre somando o período a partir da data de início. A coluna `proximo_reajuste` fica reservada para os futuros alertas.

**Boletos.** Saíram das telas de contrato. As rotas de boletos e os componentes `BoletoView` e `GerarBoletosPreviewModal` continuam no código, sem uso nessas telas. A Área do Cliente segue igual.

**Anexos antigos.** A rota de anexos e a tabela `locacao_anexos` (que não tem nenhum registro) continuam no código, mas a tela de detalhes não as usa mais. Os documentos novos chegam na Fase 3.

**Rotas novas:**
- `GET /api/admin/locacoes/opcoes`: lista de corretores.
- `GET /api/admin/clientes?q=` (seletor de clientes, com CPF mascarado) e `GET /api/admin/clientes?id=`.

**Mudança na API.** `GET /api/admin/locacoes` agora devolve `{ itens, total, pagina, paginas, resumo }`, e não mais uma lista simples. A única tela que usava essa rota foi atualizada junto.

**Verificação:**
- 34 testes passam: unitários de validação e de busca, mais os de banco com `RODAR_TESTES_BANCO=1`.
- `tsc` sem erros, e o lint dos arquivos novos também.
- Rodei um teste ponta a ponta no servidor local, usando o banco de produção, que passou em 25 de 25 verificações:
  - acesso sem login devolve 401;
  - validação de campos e código repetido;
  - filtros de busca sem acento e com termo parcial;
  - criação, edição e detalhes de contrato;
  - bloqueio de exclusão quando há documento;
  - carregamento das 5 telas.
- Os dados `TESTE-` criados nesse teste foram removidos ao final, e o imóvel usado voltou ao estado original.

## 5. O que preciso de você antes de fases específicas

1. ~~Antes da Fase 1: extensões e banco de teste~~ (resolvido: produção liberada).
2. **Antes da Fase 3:** criar um bucket R2 **privado** e informar `R2_DOCUMENTOS_BUCKET`, com uma chave de API que tenha acesso a ele. As variáveis `R2_*` não estão no `.env` local, então suponho que estejam configuradas só na Vercel. Também é preciso liberar CORS do bucket para o domínio do site, porque o upload vai direto do navegador.
3. **Antes da Fase 6:** dizer quem deve ser `gerente`. Até lá, todo usuário da tabela continua como `corretor`.

## 6. Riscos já identificados (fora do escopo e não alterados)

- **As senhas da tabela `usuarios` estão em texto puro**, e no primeiro acesso qualquer senha digitada vira a senha oficial. Isso é grave para a LGPD agora que o sistema vai guardar documentos pessoais. Recomendo corrigir com hash `bcrypt` antes de colocar o módulo em produção. É uma tarefa separada.
- **A Área do Cliente pública** devolve contratos e boletos para quem digitar qualquer CPF, sem nenhuma outra verificação. Isso também é risco de LGPD. Não vou alterar sem combinar com você.
- **Os anexos atuais de locação estão com URL pública** no R2. A cópia da Fase 3 resolve isso para os arquivos novos, e os objetos antigos podem ser apagados depois da validação.
- **O app conecta ao banco com um usuário superusuário.** Recomendo criar um usuário com permissões restritas para o app.
- **Ganchos deixados sem implementação:** `proximo_reajuste` e `data_fim` vão permitir alertas de reajuste e vencimento no futuro. Financeiro e OCR ficam fora deste trabalho.
