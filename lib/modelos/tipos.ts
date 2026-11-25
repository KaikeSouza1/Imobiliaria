// Estrutura dos modelos de documento: campos do formulário e blocos de texto do PDF.
// Funções puras (usadas no navegador para montar o formulário e no servidor para gerar o PDF).

export type TipoCampo = "texto" | "textarea" | "data" | "moeda" | "inteiro" | "percentual" | "select" | "booleano" | "debitos";

export interface Campo {
  id: string;
  rotulo: string;
  tipo: TipoCampo;
  grupo: string;
  obrigatorio?: boolean;
  opcoes?: { valor: string; rotulo: string }[];
  ajuda?: string;
  placeholder?: string;
  padrao?: string | number | boolean;
  /** Só aparece (e só é exigido) quando este campo booleano estiver marcado. */
  visivelSe?: string;
  largura?: "inteira" | "metade" | "terco";
}

export interface Debito {
  descricao: string;
  vencimento: string; // YYYY-MM-DD
  valor: number;
}

export type Valores = Record<string, string | number | boolean | Debito[] | undefined>;

export interface Empresa {
  razao_social: string;
  nome_curto: string;
  cnpj: string;
  creci_pj: string;
  sede: string;
  cidade_assinatura: string;
  foro: string;
  pix: string;
  representante_nome: string;
  representante_profissao: string;
  representante_rg: string;
  representante_cpf: string;
  representante_creci: string;
  representante_domicilio: string;
}

// Blocos que o gerador de PDF sabe desenhar. Texto aceita **negrito**.
export type Bloco =
  | { t: "titulo"; texto: string }
  | { t: "subtitulo"; texto: string }
  | { t: "clausula"; texto: string }
  | { t: "p"; texto: string; alinhamento?: "justify" | "left" | "center" | "right"; recuo?: boolean }
  | { t: "lista"; itens: string[] }
  | { t: "tabela"; linhas: [string, string][]; total?: [string, string] }
  | { t: "assinaturas"; pessoas: { nome: string; linhas?: string[] }[]; ladoALado?: boolean }
  | { t: "espaco"; altura?: number };

export type TipoDocumentoGerado = "contrato_gerado" | "termo" | "notificacao";
export type Vinculo = "locacao" | "proprietario";

export interface Modelo {
  id: string;
  titulo: string;
  descricao: string;
  tipoDocumento: TipoDocumentoGerado;
  /** locacao = gerado a partir de um contrato; proprietario = a partir do cadastro de um proprietário. */
  vinculo: Vinculo;
  /** Mostra o logo da imobiliária no topo das páginas. */
  logo: boolean;
  campos: Campo[];
  /** Nome do arquivo PDF salvo. */
  nomeArquivo: (v: Valores) => string;
  montar: (v: Valores, empresa: Empresa) => Bloco[];
}

// ---------------------------------------------------------------------------
// Ajudantes usados pelos modelos
// ---------------------------------------------------------------------------

// Texto digitado pelo usuário nunca pode abrir/fechar negrito por engano.
export function limpo(valor: unknown): string {
  return String(valor ?? "").replace(/\*+/g, "").replace(/\s+/g, " ").trim();
}

export function txt(v: Valores, id: string): string {
  return limpo(v[id]);
}

export function num(v: Valores, id: string): number {
  const n = Number(String(v[id] ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function sim(v: Valores, id: string): boolean {
  return v[id] === true || v[id] === "true";
}

export type Genero = "masculino" | "feminino";

// Concordância de gênero: g(v, "locatario_genero", "Portador", "Portadora")
export function g(v: Valores, campoGenero: string, masc: string, fem: string): string {
  return v[campoGenero] === "feminino" ? fem : masc;
}

// "solteiro(a)" -> "Solteiro" / "Solteira"; "união estável" -> "União estável"
export function flexionar(texto: string, genero: unknown): string {
  const f = genero === "feminino";
  const t = limpo(texto).replace(/o\(a\)/g, f ? "a" : "o").replace(/\(a\)/g, f ? "a" : "");
  return t ? t[0].toUpperCase() + t.slice(1) : "";
}

// Divide "texto **negrito** texto" em pedaços para o PDF.
export function partesMarcadas(texto: string): { texto: string; negrito: boolean }[] {
  const partes: { texto: string; negrito: boolean }[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    if (m.index > ultimo) partes.push({ texto: texto.slice(ultimo, m.index), negrito: false });
    partes.push({ texto: m[1], negrito: true });
    ultimo = re.lastIndex;
  }
  if (ultimo < texto.length) partes.push({ texto: texto.slice(ultimo), negrito: false });
  return partes.filter((p) => p.texto);
}

// Campos de qualificação de uma pessoa (locatário, fiador, proprietário), reaproveitados nos modelos.
export function camposPessoa(prefixo: string, grupo: string, opcoes: { visivelSe?: string; pix?: boolean; obrigatorio?: boolean } = {}): Campo[] {
  const obrig = opcoes.obrigatorio ?? true;
  const base: Campo[] = [
    { id: `${prefixo}_nome`, rotulo: "Nome completo", tipo: "texto", grupo, obrigatorio: obrig, largura: "inteira" },
    { id: `${prefixo}_genero`, rotulo: "Concordância", tipo: "select", grupo, padrao: "masculino", largura: "terco",
      opcoes: [{ valor: "masculino", rotulo: "Masculino (o)" }, { valor: "feminino", rotulo: "Feminino (a)" }],
      ajuda: "Usado em Portador/Portadora, Inscrito/Inscrita..." },
    { id: `${prefixo}_nacionalidade`, rotulo: "Nacionalidade", tipo: "texto", grupo, padrao: "Brasileiro(a)", largura: "terco" },
    { id: `${prefixo}_estado_civil`, rotulo: "Estado civil", tipo: "texto", grupo, largura: "terco", placeholder: "Solteiro(a)" },
    { id: `${prefixo}_profissao`, rotulo: "Profissão", tipo: "texto", grupo, largura: "metade" },
    { id: `${prefixo}_rg`, rotulo: "RG (número e órgão)", tipo: "texto", grupo, largura: "metade", placeholder: "Ex: 1.234.567 SESP PR" },
    { id: `${prefixo}_cpf`, rotulo: "CPF/CNPJ", tipo: "texto", grupo, obrigatorio: obrig, largura: "metade" },
    { id: `${prefixo}_celular`, rotulo: "Celular", tipo: "texto", grupo, largura: "metade" },
    { id: `${prefixo}_endereco`, rotulo: "Endereço completo", tipo: "texto", grupo, largura: "inteira",
      placeholder: "Rua, número, complemento, bairro, cidade UF" },
    { id: `${prefixo}_cep`, rotulo: "CEP", tipo: "texto", grupo, largura: "terco" },
  ];
  if (opcoes.pix) base.push({ id: `${prefixo}_pix`, rotulo: "Chave PIX", tipo: "texto", grupo, largura: "metade" });
  return base.map((c) => (opcoes.visivelSe ? { ...c, visivelSe: opcoes.visivelSe } : c));
}

// "FULANO, Brasileiro, Solteiro, Professor, Portador do RG sob N° X, e Inscrito no CPF sob N° Y. Residente e domiciliado na Z, CEP W. Celular: K."
export function qualificacao(v: Valores, prefixo: string, opcoes: { pix?: boolean } = {}): string {
  const gen = `${prefixo}_genero`;
  const partes: string[] = [`**${txt(v, `${prefixo}_nome`).toUpperCase()},**`];
  const extra = [flexionar(txt(v, `${prefixo}_nacionalidade`), v[gen]), flexionar(txt(v, `${prefixo}_estado_civil`), v[gen]), txt(v, `${prefixo}_profissao`)]
    .filter(Boolean)
    .join(", ");
  if (extra) partes.push(`${extra},`);
  const rg = txt(v, `${prefixo}_rg`);
  if (rg) partes.push(`${g(v, gen, "Portador", "Portadora")} do **RG sob N° ${rg},** e`);
  partes.push(`${g(v, gen, "Inscrito", "Inscrita")} no **CPF sob N° ${txt(v, `${prefixo}_cpf`)}.**`);
  const end = txt(v, `${prefixo}_endereco`);
  if (end) {
    const cep = txt(v, `${prefixo}_cep`);
    partes.push(`Residente e ${g(v, gen, "domiciliado", "domiciliada")} na ${end}${cep ? `, CEP ${cep}` : ""}.`);
  }
  const cel = txt(v, `${prefixo}_celular`);
  if (cel) partes.push(`Celular: ${cel}.`);
  if (opcoes.pix) {
    const pix = txt(v, `${prefixo}_pix`);
    if (pix) partes.push(`**Pix: ${pix}.**`);
  }
  return partes.join(" ");
}

// Qualificação da imobiliária representada pelo procurador (repetida em todos os modelos).
export function qualificacaoImobiliaria(e: Empresa, opcoes: { creciRepresentante?: boolean } = {}): string {
  return `**${e.razao_social},** CNPJ ${e.cnpj}, CRECI ${e.creci_pj}, com sede na ${e.sede}, representada por seu procurador, **${e.representante_nome}**, ${e.representante_profissao}, Identidade ${e.representante_rg} e portador do CPF nº ${e.representante_cpf}${opcoes.creciRepresentante ? `, CRECI ${e.representante_creci}` : ""}, ${e.representante_domicilio}.`;
}

// Campos visíveis conforme os booleanos marcados.
export function camposVisiveis(campos: Campo[], v: Valores): Campo[] {
  return campos.filter((c) => !c.visivelSe || sim(v, c.visivelSe));
}

// Confere obrigatórios e formatos. Devolve as mensagens de erro.
export function validarValores(modelo: Modelo, v: Valores): string[] {
  const erros: string[] = [];
  for (const c of camposVisiveis(modelo.campos, v)) {
    const valor = v[c.id];
    if (c.tipo === "debitos") {
      const lista = Array.isArray(valor) ? (valor as Debito[]) : [];
      if (c.obrigatorio && lista.filter((d) => d && d.vencimento && Number(d.valor) > 0).length === 0) {
        erros.push(`Informe pelo menos um débito em "${c.rotulo}".`);
      }
      continue;
    }
    if (c.tipo === "booleano") continue;
    const s = String(valor ?? "").trim();
    if (c.obrigatorio && !s) {
      erros.push(`Preencha "${c.rotulo}" (${c.grupo}).`);
      continue;
    }
    if (!s) continue;
    if (c.tipo === "data" && !/^\d{4}-\d{2}-\d{2}$/.test(s)) erros.push(`Data inválida em "${c.rotulo}".`);
    if ((c.tipo === "moeda" || c.tipo === "percentual") && !(Number(s.replace(",", ".")) >= 0)) erros.push(`Valor inválido em "${c.rotulo}".`);
    if (c.tipo === "inteiro" && !/^\d+$/.test(s)) erros.push(`Use só números inteiros em "${c.rotulo}".`);
  }
  return erros;
}
