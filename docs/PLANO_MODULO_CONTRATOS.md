# Plano: módulo de contratos e documentos com busca global

Status: **Fase 5 concluída em 25/11/2026. Aguardando validação para a Fase 6.**

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
| 3 ✅ | Documentos (F2) | upload em três passos, validação, ver e baixar autenticados, exclusão lógica, log, tela "Gestão de Documentos", cópia dos anexos antigos | `feat(documentos): ...` |
| 4 ✅ | Busca global (F5) | API e tela, caixa de busca no layout | `feat(busca): ...` |
| 5 ✅ | Clientes (F7) | painel único de inquilinos e proprietários, seletor no formulário do contrato | `feat(clientes): ...` |
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

## 4.2 Registro da Fase 3

**Bucket.** `imobiliaria-documentos` no R2, privado, região ENAM, classe Standard. Ele usa um token próprio do tipo *Object Read & Write*, que só acessa esse bucket. Testamos que esse token não acessa o bucket das fotos. O CORS libera `PUT` para o domínio do site e para `localhost:3000`.
- Variáveis: `R2_DOCUMENTOS_BUCKET`, `R2_DOCUMENTOS_ACCESS_KEY_ID` e `R2_DOCUMENTOS_SECRET_ACCESS_KEY`. Elas precisam estar no `.env` local e também na Vercel.

**Envio em 3 passos.** O arquivo vai do navegador direto para o R2, sem passar pela Vercel, que limita cada requisição a 4,5 MB.
1. `POST /api/admin/documentos/envio` valida o pedido: o vínculo existe, o tipo é conhecido, a extensão é `.pdf` e o tamanho é de até 20 MB. A resposta traz:
   - uma URL de envio assinada, válida por 5 minutos, com o tamanho e o `Content-Type` incluídos na assinatura. Se o arquivo enviado tiver outro tamanho, o R2 recusa com 403.
   - um comprovante assinado com HMAC (`lib/token-envio.ts`), válido por 15 minutos e ligado ao usuário que pediu o envio.
2. O navegador envia o arquivo com `PUT` direto para o R2.
3. `POST /api/admin/documentos/confirmar` confere o comprovante e lê o arquivo que está no R2. Ele confere o tamanho, a assinatura `%PDF-` (o tipo real do arquivo, não só a extensão) e o SHA-256, e verifica se o mesmo arquivo já está anexado ao mesmo registro.
   - Se algo falhar, o arquivo é apagado do R2 na hora e o usuário recebe uma mensagem clara.
   - Se der certo, cria o registro em `documentos` e grava o log de inclusão.
   - Confirmar o mesmo envio de novo devolve 409 e não apaga o arquivo.

**Nome do arquivo.** O arquivo é guardado como `documentos/<uuid>.pdf`, nunca com o nome enviado pelo usuário. O nome original passa por limpeza (tira caminho, caracteres de controle e símbolos perigosos) e é usado só para exibição.

**Ver e baixar.** A rota `GET /api/admin/documentos/[id]/arquivo?modo=ver|baixar` confere o login, grava o log e redireciona para uma URL assinada que expira em **60 segundos**. O endereço do arquivo sem assinatura é bloqueado (400).
- Decisão: usar redirecionamento em vez de repassar o arquivo pelo servidor, porque a Vercel limita a resposta a 4,5 MB e repassar custaria tempo de execução.

**Exclusão lógica.** A rota `DELETE /api/admin/documentos/[id]` preenche `removido_em` e `removido_por`. O arquivo continua no bucket e a trilha fica no log. Um documento excluído não abre mais.
- Depois de excluído, o mesmo arquivo pode ser anexado de novo, porque o índice de duplicidade ignora documentos removidos.

**Log.** Registra incluir, visualizar, baixar e excluir. Guarda só o id do documento, a ação, o usuário e o IP.

**Telas:**
- Aba "Documentos" do contrato: escolha do tipo, envio de um ou vários PDFs (o resultado de cada arquivo aparece na hora), lista com ver, baixar e excluir (com confirmação) e estado vazio com orientação. Abre direto com `?aba=documentos`.
- `/admin/documentos` ("Gestão de Documentos"):
  - "Adicionar Arquivo": escolhe o contrato pela busca e envia o arquivo.
  - "Documentos Recentes": busca sem acento por nome do arquivo, código do contrato ou imóvel, inquilino ou proprietário; filtro por tipo; 25 documentos por página.
  - "Pastas por contrato": cada contrato com documentos aparece como uma pasta e abre direto na aba Documentos.
  - O botão "Usar Pasta" fica desativado até a Fase 7.

**Anexos antigos.** A tabela `locacao_anexos` tem 0 registros em produção, então a cópia planejada para o bucket privado não é necessária. A rota antiga de anexos continua no código, sem uso nas telas.

**Verificação:**
- 41 testes unitários passam, cobrindo:
  - assinatura de PDF;
  - limpeza do nome do arquivo;
  - validação do pedido de envio;
  - `Content-Disposition` (cabeçalho com o nome do arquivo no download);
  - comprovante HMAC (expirado, adulterado ou de outro usuário).
- O teste ponta a ponta com banco de produção e bucket real passou em 35 de 35 checagens. Os dados e arquivos de teste foram apagados no final.
- `next build` compila sem erros.
- Com o servidor de produção local e login de administrador, 9 páginas responderam como esperado: 8 com 200 (`/admin/documentos`, a aba de documentos, contratos, imóveis, mensagens, CRM e área do cliente) e `/admin/documentos` sem login redirecionou para o login (307).

**Riscos e pendências:**
- **Envios abandonados:** se o navegador fechar entre o envio e a confirmação, o arquivo fica no bucket sem registro. É raro e ocupa pouco espaço. Fica para a Fase 8 um script de limpeza de objetos sem registro com mais de 1 dia.
- **Arquivos excluídos continuam ocupando espaço,** porque a exclusão é lógica. É intencional, por causa da trilha.
- **As chaves do bucket apareceram no chat.** O desenvolvedor decidiu não trocar a chave (risco aceito em 25/11/2026). O token só tem acesso ao bucket de documentos.

## 4.3 Registro da Fase 4

**Tela `/admin/busca`.** Tem uma caixa principal e filtros avançados que podem ser abertos: inquilino, proprietário, código, endereço, status e intervalo do próximo reajuste. Os critérios ficam sempre visíveis e também vão para a URL, então dá para mandar o link de uma busca para outra pessoa.

**Como a busca funciona:**
- Cada palavra digitada é procurada separadamente, em qualquer ordem e em qualquer campo. Por exemplo, "maria flores" encontra a inquilina Maria do imóvel da Rua das Flores.
- Ignora acentos e diferença entre maiúsculas e minúsculas, e aceita parte da palavra.
- Também encontra pelo número da pasta física, digitando "pasta 12".

**Resultados:**
- Até 6 pessoas e 6 imóveis encontrados, cada um com o número de contratos.
- Clicar numa pessoa ou num imóvel "foca" a busca nele. Para uma pessoa, aparecem todos os contratos em que ela é inquilina **ou** proprietária. Para um imóvel, aparece o histórico de contratos dele. É isso que junta os dados de uma mesma pessoa ou imóvel.
- Os contratos vêm paginados e cada um tem atalho para "Detalhes" e para "Documentos (n)".
- O CPF aparece sempre mascarado.

**Caixa de busca no topo do painel.** (Liberada no menu em 25/11/2026 **só para `andre` e `portoadmin`**, lista definida em `lib/permissoes.ts`. O `middleware.ts` bloqueia as telas e as APIs do módulo para os outros usuários: as telas redirecionam e as APIs respondem 403. É uma regra provisória até os perfis da Fase 6.) Ficava escondida enquanto a constante `MODULO_CONTRATOS_VISIVEL`, em `lib/modulo-contratos.ts`, estiver `false` (definido pelo desenvolvedor em 25/11/2026: a liberação é feita pelo código, não por variável de ambiente). Para ligar, troque para `true` e faça o deploy. A mesma chave vai controlar o menu quando o módulo for liberado.
- Ainda falta: o CRM (`/crm`) tem layout próprio e vai ganhar a caixa na liberação.

**Desempenho:**
- As migrações `003` e `004` criaram o campo `locacoes.texto_busca`, com índice trigram. Ele reúne código, pasta, inquilino, proprietário, código, título e endereço do imóvel, e os dados de contratos antigos.
- Esse campo é mantido por gatilhos no banco. Ele é recalculado quando o contrato é gravado, quando o nome de um cliente muda e quando o código, o título ou o endereço de um imóvel mudam.
- Nos filtros específicos, esse campo serve de pré-filtro indexado, e o campo exato confirma o resultado.
- Medição com 20 mil contratos fictícios dentro de uma transação desfeita depois (`npx tsx scripts/medir-busca.ts 20000`):

  | Busca | Antes | Depois |
  |---|---|---|
  | Busca geral | 0,8 a 1,8 s | 16 a 65 ms |
  | Filtros específicos | 0,2 a 0,7 s | 36 a 75 ms |
  | Status + intervalo de reajuste | — | 180 ms |

**Migração `004`.** Agora, quando o cadastro de um cliente muda, as cópias `locatario_*` do contrato acompanham a mudança (a Área do Cliente lê esses campos). O texto de busca passa a usar o nome do cadastro de clientes, e `locatario_nome` só entra em contrato antigo que não tem inquilino vinculado.
- Ponto de atenção: há um gatilho novo na tabela `imoveis`. Ele só age quando mudam o código, o título ou o endereço do imóvel, e só atualiza os contratos daquele imóvel.

**Verificação:**
- 50 testes passam (unitários e de banco).
- `tsc` e lint sem erros nos arquivos novos.
- `next build` compila sem erros.
- O teste ponta a ponta passou em 21 de 21 checagens, rodando duas vezes: com a chave desligada e com a chave ligada. Ele cobriu palavras em qualquer ordem, filtros avançados, inquilino e proprietário sem confusão, pessoa com 2 contratos, foco em pessoa e em imóvel, renomear um cliente e o CPF mascarado.
- Os dados `TESTE-` foram apagados ao final.

## 4.4 Registro da Fase 5

**Telas** (ainda fora do menu):
- `/admin/clientes`: lista com busca por nome, código, CPF/CNPJ ou cidade (cada palavra procurada separadamente, sem acento). Tem filtro Todos / Inquilinos / Proprietários, cards de resumo e paginação de 25 por página. O CPF aparece **mascarado** na lista.
- `/admin/clientes/novo` (aceita `?papel=proprietario`) e `/admin/clientes/[id]/editar`. O formulário é o mesmo nos dois casos e tem estas seções:
  - tipo: inquilino, proprietário ou os dois;
  - dados pessoais: nome, CPF/CNPJ, RG, nascimento, estado civil e profissão;
  - contato;
  - endereço: CEP, rua, número, complemento, bairro, cidade e UF;
  - observações.
- `/admin/clientes/[id]` é o **painel único** da pessoa. Ele reúne:
  - dados pessoais, contato e endereço;
  - os contratos em que a pessoa é inquilina **e** os contratos em que é proprietária, com o papel de cada um;
  - os imóveis em que ela aparece como proprietária;
  - os documentos pessoais, com envio de PDF (tipo "Documento pessoal"), ver, baixar e excluir;
  - atalho para a busca global já filtrada pela pessoa.

**Validação** (`lib/clientes.ts`):
- CPF e CNPJ têm os **dígitos verificadores** conferidos. A mesma regra vale para inquilino e proprietário cadastrados direto no formulário do contrato.
- E-mail, CEP com 8 dígitos, UF, estado civil a partir de uma lista e data de nascimento entre 1900 e hoje.
- Exige o nome e pelo menos um tipo (inquilino ou proprietário).
- CPF/CNPJ repetido é recusado com o erro 409 e a orientação de usar a busca.

**Exclusão.** Só é permitida quando a pessoa não tem contrato, imóvel nem documento vinculado. Nesse caso os dados pessoais são apagados de verdade do banco, o que atende ao pedido de eliminação previsto na LGPD. Se houver vínculo, a mensagem informa quantos contratos, imóveis e documentos existem.

**Sincronização.** Quando o cadastro da pessoa é editado, o contrato e a Área do Cliente passam a mostrar os dados novos. Isso usa os gatilhos da migração 004.

**Rotas:**
- `GET /api/admin/clientes` (lista) e `POST /api/admin/clientes` (cadastro).
- `GET`, `PUT` e `DELETE /api/admin/clientes/[id]`.
- O seletor do formulário de contrato passou a usar `GET /api/admin/clientes/sugestoes?q=|id=`, que reaproveita a busca por palavras da busca global e sempre devolve o CPF mascarado.

**Correção nesta fase.** O script de medição da Fase 4 inseria 20 mil registros dentro de uma transação desfeita depois. O ROLLBACK não devolve os números das sequências do banco, então os códigos automáticos pularam para CL-6xxxx e CT-6xxxx. As sequências foram reposicionadas, e o script agora guarda e restaura a numeração no fim.

**LGPD.** Hoje qualquer usuário logado vê o CPF completo no painel do cliente. Isso será restringido por perfil na Fase 6.

**Verificação:**
- 52 testes unitários passam, cobrindo CPF/CNPJ válidos e inválidos, as mensagens de erro, a validação do cadastro e o endereço.
- `tsc` e lint sem erros.
- `next build` compila sem erros.
- O teste ponta a ponta passou em 29 de 29 checagens, cobrindo:
  - acesso sem login devolve 401;
  - CPF inválido é recusado e CPF repetido devolve 409;
  - busca por nome sem acento, por parte do CPF, por cidade e por código;
  - CPF mascarado na lista e no seletor;
  - edição refletida no contrato e na busca;
  - documento pessoal anexado;
  - exclusão bloqueada quando há vínculo e liberada quando não há;
  - todas as telas abrem.
- Os dados de teste foram apagados do banco e do bucket.

## 4.5 Registro: geração de documentos a partir dos modelos da imobiliária

Pedido do desenvolvedor em 25/11/2026: os modelos que a equipe usa em Word (pasta `docs imo`) viraram formulários fáceis de preencher, e o PDF gerado fica guardado no sistema.

**Modelos** (os textos das cláusulas foram transcritos dos arquivos originais; só os dados variáveis viraram campos):

| Modelo | Gerado a partir de | Observações |
|---|---|---|
| Contrato de Locação | contrato | residencial ou comercial, fiador opcional, Fundo de Conservação opcional (a cláusula 4 é renumerada) |
| Termo de Entrega de Chaves | contrato | |
| Notificação por Falta de Pagamento | contrato | lista de débitos, prazo de 5 dias úteis |
| Notificação Extrajudicial | contrato | lista de débitos com total, prazo em dias corridos |
| Contrato de Administração (Locação) | proprietário | |
| Contrato de Intermediação (Venda) | proprietário | com ou sem exclusividade |

**Como a equipe usa:**
- **Onde começar:** em Documentos → "Gerar Documento", ou pelo botão "Gerar documento" na aba Documentos do contrato. No cadastro do proprietário há atalhos para administração e venda.
- **Preenchimento automático:** o formulário já vem com os dados do contrato, do inquilino, do proprietário e do imóvel. Só é preciso conferir e completar o que faltar.
- **Extenso automático:** valores e prazos saem por extenso ("R$ 1.200,00 (mil e duzentos reais)"). Datas são escritas por extenso e a rescisão aparece como `18.11.27`. A concordância de gênero (Portador/Portadora, Inscrito/Inscrita) segue a escolha feita no formulário.
- **Conferência:** o botão "Ver prévia" abre o PDF antes de salvar. "Gerar PDF e salvar" guarda o arquivo.

**Onde o PDF fica guardado:**
- No mesmo bucket privado e com as mesmas regras dos outros documentos: ver e baixar só com login, com histórico e exclusão lógica.
- O PDF é vinculado ao contrato ou ao cadastro do proprietário.
- Tipos novos de documento: "Contrato gerado", "Termo" e "Notificação".
- Cada documento guarda de qual modelo saiu e com quais dados, então dá para gerar de novo corrigindo um campo.
- Gerar duas vezes com os mesmos dados é recusado. Essa verificação é feita pelos dados, porque o PDF leva a hora de criação e nunca é idêntico byte a byte.

**Dados da imobiliária e do procurador** (CNPJ, CRECI, RG e CPF do procurador, PIX, sede, foro) ficam na tabela `parametros` do banco, e não no código. Para trocar o procurador ou o endereço, basta alterar essa tabela. A migração `005` criou essa tabela e os tipos novos de documento.

**Privacidade:** a pasta `docs imo` contém dados pessoais reais (nomes e CPFs de clientes dos contratos usados como modelo). Ela foi incluída no `.gitignore` e **não vai para o git**. Nenhum dado real foi copiado para o código ou para os testes, e uma busca nos arquivos versionados não encontrou nenhum CPF nem nome de cliente dos modelos. Os exemplos de teste usam só dados fictícios.

**Verificação:**
- 90 testes passam, incluindo 14 que geram os 6 PDFs e conferem validações, concordância de gênero e a renumeração da cláusula.
- O teste ponta a ponta passou em 23 de 23 checagens, com banco e bucket reais. Ele cobriu preencher a partir do contrato, validar, prévia, salvar, recusar duplicidade, abrir o PDF guardado pelo link temporário, listar no contrato e no repositório, e gerar de novo a partir do documento. Os dados de teste foram apagados.
- Conferi o visual dos PDFs e dos formulários (logo no topo, páginas numeradas, texto justificado).

**Pendente:** o texto dos modelos foi transcrito fielmente, inclusive pequenos erros de digitação do original, como "Oprimeiro" (corrigido para "O primeiro"), a numeração repetida da "CLAUSULA 2ª" e o "16.1" dentro da cláusula 13 da administração. Recomendo que a equipe revise o texto dos modelos e me diga o que ajustar.

## 4.6 Registro: contratos de venda e buscas mais rápidas

**Contratos de venda** (pedido do desenvolvedor em 26/11/2026). Usam o mesmo cadastro de contratos e a mesma tela da locação, marcados por um novo campo `tipo` (`locacao` ou `venda`). A migração `006` acrescentou `tipo`, `valor_venda`, `forma_pagamento` e `honorarios_percentual` em `locacoes`, sem alterar nenhum contrato existente (todos continuam `locacao`).

- **Cadastro:** botão "Novo Contrato de Venda" na lista, ou a chave Locação/Venda no formulário. Na venda o formulário mostra Comprador e Vendedor (proprietário), valor da venda, data do contrato, prazo final, honorários (%), entrega das chaves e forma de pagamento. Os campos de aluguel, vencimento e reajuste não aparecem. Também dá para cadastrar venda antiga (da lista impressa).
- **Código:** `VD-00001` para venda e `CT-00001` para locação.
- **Status:** os mesmos três valores, com outro significado na venda. Ativo = Em andamento, Encerrado = Concluída, Rescindido = Cancelada.
- **Imóvel do site:** venda concluída marca o imóvel como "vendido". Venda em andamento ou cancelada não mexe no imóvel. A locação continua marcando "alugado".
- **Filtro:** a lista tem as abas Todos / Locação / Venda. A venda tem cards próprios (vendas, em andamento, concluídas e volume vendido das concluídas). A busca global também filtra por tipo. Cada contrato mostra a etiqueta Locação ou Venda.
- **Separação dos números:** os cards de locação (contratos, ativos, receita mensal prevista e reajustes) não contam vendas. O filtro de reajuste deixa as vendas de fora.
- **Área do Cliente (pública):** passou a mostrar só locações. Sem isso, o comprador de um imóvel veria a venda como se fosse aluguel quando consultasse o próprio CPF.
- **Painel do cliente:** mostra "Venda · comprador" ou "Venda · vendedor" e o valor da venda.
- **Documentos:** na venda, o botão gera o contrato de intermediação de venda a partir do vendedor.

**Buscas que sugerem sem precisar digitar:**
- **Cliente:** clicar no campo já mostra os 8 cadastros mais recentes, e a lista filtra a cada letra, sem mínimo de caracteres e sem espera longa. Mostra iniciais, código, CPF mascarado, telefone, se é inquilino ou proprietário e o número de contratos. Funciona com setas e Enter, e o "Cadastrar novo" fica sempre no final.
- **Imóvel:** clicar no campo já lista imóveis com a **foto de capa**, código, título, endereço, status (Disponível, Alugado, Vendido), finalidade e preço. A lista abre em "Para alugar" no contrato de locação e em "À venda" no de venda, com atalho para "Todos". Filtra a cada letra por código, título, rua, bairro ou cidade, em qualquer ordem. Código exato aparece primeiro e os disponíveis vêm antes. Funciona com setas e Enter. O imóvel escolhido aparece com a foto.
- **Contrato** (telas de gerar documento e Gestão de Documentos): o mesmo comportamento, com os contratos mais recentes ao clicar.

**Verificação:** 98 testes passam. O teste ponta a ponta de venda passou em 29 de 29 checagens, cobrindo:
- validação específica da venda;
- código automático;
- filtros por tipo e status;
- resumo separado;
- imóvel marcado como vendido ao concluir;
- locação seguindo igual;
- Área do Cliente sem vazar a venda;
- todas as telas abertas.

Os dados de teste foram apagados. Conferi o visual das buscas em tela, com e sem clientes cadastrados.

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
