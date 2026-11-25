// Regras do cadastro de clientes (inquilinos e proprietários). Funções puras.
import { apenasDigitos } from "./texto";

export const ESTADOS_CIVIS = ["solteiro(a)", "casado(a)", "união estável", "divorciado(a)", "viúvo(a)", "separado(a)"] as const;
export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR",
  "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export function cpfValido(valor: string): boolean {
  const d = apenasDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

export function cnpjValido(valor: string): boolean {
  const d = apenasDigitos(valor);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const digito = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((acc, p, i) => acc + p * Number(d[i]), 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return digito(12) === Number(d[12]) && digito(13) === Number(d[13]);
}

// Devolve a mensagem de erro, ou null se estiver vazio/válido.
export function erroCpfCnpj(valor: string | null | undefined, quem = ""): string | null {
  const d = apenasDigitos(valor);
  if (!d) return null;
  const sufixo = quem ? ` do ${quem}` : "";
  if (d.length === 11) return cpfValido(d) ? null : `CPF${sufixo} inválido. Confira os números.`;
  if (d.length === 14) return cnpjValido(d) ? null : `CNPJ${sufixo} inválido. Confira os números.`;
  return `CPF/CNPJ${sufixo} deve ter 11 (CPF) ou 14 (CNPJ) dígitos.`;
}

export interface DadosCliente {
  nome: string;
  cpf_cnpj: string | null;
  rg: string | null;
  data_nascimento: string | null;
  estado_civil: string | null;
  profissao: string | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  eh_proprietario: boolean;
  eh_inquilino: boolean;
  observacoes: string | null;
}

export type ResultadoCliente = { ok: true; dados: DadosCliente } | { ok: false; erros: string[] };

function texto(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().replace(/\s+/g, " ");
  return s ? s.slice(0, max) : null;
}

export function validarCliente(body: unknown): ResultadoCliente {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const erros: string[] = [];

  const nome = texto(b.nome, 255);
  if (!nome || nome.length < 3) erros.push("Informe o nome completo.");

  const doc = apenasDigitos(String(b.cpf_cnpj ?? ""));
  const erroDoc = erroCpfCnpj(doc);
  if (erroDoc) erros.push(erroDoc);

  const email = texto(b.email, 255);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push("E-mail inválido.");

  const cep = apenasDigitos(String(b.cep ?? ""));
  if (cep && cep.length !== 8) erros.push("CEP deve ter 8 dígitos.");

  const ufTxt = texto(b.uf, 2)?.toUpperCase() ?? null;
  if (ufTxt && !(UFS as readonly string[]).includes(ufTxt)) erros.push("UF inválida.");

  const estadoCivil = texto(b.estado_civil, 30);
  if (estadoCivil && !(ESTADOS_CIVIS as readonly string[]).includes(estadoCivil)) erros.push("Estado civil inválido.");

  let nascimento: string | null = texto(b.data_nascimento, 10);
  if (nascimento) {
    const d = new Date(`${nascimento}T00:00:00Z`);
    const hoje = new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento) || isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== nascimento) {
      erros.push("Data de nascimento inválida.");
      nascimento = null;
    } else if (nascimento > hoje || nascimento < "1900-01-01") {
      erros.push("Data de nascimento fora do intervalo aceito.");
    }
  }

  const ehProprietario = b.eh_proprietario === true || b.eh_proprietario === "true";
  const ehInquilino = b.eh_inquilino === true || b.eh_inquilino === "true";
  if (!ehProprietario && !ehInquilino) erros.push("Marque se a pessoa é inquilina, proprietária ou as duas coisas.");

  if (erros.length) return { ok: false, erros };
  return {
    ok: true,
    dados: {
      nome: nome!,
      cpf_cnpj: doc || null,
      rg: texto(b.rg, 30),
      data_nascimento: nascimento,
      estado_civil: estadoCivil,
      profissao: texto(b.profissao, 100),
      email: email?.toLowerCase() ?? null,
      telefone: texto(b.telefone, 50),
      cep: cep || null,
      logradouro: texto(b.logradouro, 255),
      numero: texto(b.numero, 20),
      complemento: texto(b.complemento, 100),
      bairro: texto(b.bairro, 100),
      cidade: texto(b.cidade, 100),
      uf: ufTxt,
      eh_proprietario: ehProprietario,
      eh_inquilino: ehInquilino,
      observacoes: texto(b.observacoes, 5000),
    },
  };
}

export function formatarCep(cep: string | null | undefined): string {
  const d = apenasDigitos(cep);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep || "";
}

export function enderecoCompleto(c: Partial<DadosCliente>): string {
  const linha1 = [c.logradouro, c.numero].filter(Boolean).join(", ");
  const partes = [linha1, c.complemento, c.bairro, [c.cidade, c.uf].filter(Boolean).join("/"), c.cep ? `CEP ${formatarCep(c.cep)}` : null];
  return partes.filter(Boolean).join(" · ");
}
