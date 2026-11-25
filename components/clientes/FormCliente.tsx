"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import { ESTADOS_CIVIS, UFS, erroCpfCnpj } from "@/lib/clientes";

export interface ClienteCarregado {
  id: number;
  codigo: string | null;
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

const CLASSE_CARD = "bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4";
const CLASSE_TITULO = "text-xs font-black text-gray-500 uppercase tracking-widest";
const CLASSE_INPUT = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-green-500 focus:bg-white transition-all";
const CLASSE_LABEL = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block";

type Campos = Omit<ClienteCarregado, "id" | "codigo" | "eh_proprietario" | "eh_inquilino">;
const CAMPOS_TEXTO: (keyof Campos)[] = [
  "nome", "cpf_cnpj", "rg", "data_nascimento", "estado_civil", "profissao", "email", "telefone",
  "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf", "observacoes",
];

export default function FormCliente({ cliente, papelInicial }: { cliente?: ClienteCarregado; papelInicial?: "inquilino" | "proprietario" }) {
  const router = useRouter();
  const editando = !!cliente;
  const [form, setForm] = useState<Record<keyof Campos, string>>(() =>
    Object.fromEntries(
      CAMPOS_TEXTO.map((k) => [k, k === "data_nascimento" ? String(cliente?.[k] ?? "").slice(0, 10) : String(cliente?.[k] ?? "")])
    ) as Record<keyof Campos, string>
  );
  const [ehInquilino, setEhInquilino] = useState(cliente?.eh_inquilino ?? papelInicial !== "proprietario");
  const [ehProprietario, setEhProprietario] = useState(cliente?.eh_proprietario ?? papelInicial === "proprietario");
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const voltar = editando ? `/admin/clientes/${cliente!.id}` : "/admin/clientes";
  const erroDoc = form.cpf_cnpj.replace(/\D/g, "").length >= 11 ? erroCpfCnpj(form.cpf_cnpj) : null;

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErros([]);
    setSalvando(true);
    try {
      const res = await fetch(editando ? `/api/admin/clientes/${cliente!.id}` : "/api/admin/clientes", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, eh_inquilino: ehInquilino, eh_proprietario: ehProprietario }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErros(d.erros || [d.error || "Não foi possível salvar."]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      router.push(`/admin/clientes/${editando ? cliente!.id : d.id}?salvo=1`);
    } catch {
      setErros(["Erro de conexão com o servidor."]);
    } finally {
      setSalvando(false);
    }
  };

  const campo = (nome: keyof Campos, rotulo: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, col = "") => (
    <div className={col}>
      <label className={CLASSE_LABEL}>{rotulo}</label>
      <input name={nome} value={form[nome]} onChange={handle} className={CLASSE_INPUT} {...extra} />
    </div>
  );

  return (
    <form onSubmit={salvar} noValidate className="max-w-6xl mx-auto pb-28 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={voltar} className="p-2.5 bg-white hover:bg-gray-100 rounded-xl shadow-sm text-gray-500 transition-all border border-gray-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">{editando ? `Editar cliente ${cliente!.codigo ?? ""}` : "Novo cliente"}</h1>
          <p className="text-gray-500 text-sm">Campos com * são obrigatórios.</p>
        </div>
      </div>
      {erros.length > 0 && (
        <div className="flex gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-medium" role="alert">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <ul className="space-y-1">{erros.map((er) => <li key={er}>{er}</li>)}</ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* COLUNA ESQUERDA: quem é */}
        <div className="space-y-6">
          <div className={CLASSE_CARD}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className={CLASSE_TITULO}>Tipo de cliente *</h2>
              <div className="inline-flex gap-2">
                {([["Inquilino", ehInquilino, setEhInquilino], ["Proprietário", ehProprietario, setEhProprietario]] as const).map(([r, v, s]) => (
                  <label key={r} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-xs font-bold transition-all
                    ${v ? "bg-[#0f2e20] text-white border-[#0f2e20]" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                    <input type="checkbox" checked={v} onChange={(e) => s(e.target.checked)} className="rounded" /> {r}
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400">A mesma pessoa pode ser inquilina e proprietária.</p>
          </div>

          <div className={CLASSE_CARD}>
            <h2 className={CLASSE_TITULO}>Dados pessoais</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campo("nome", "Nome completo / Razão social *", { placeholder: "Ex: Maria Exemplo" }, "sm:col-span-2")}
              <div>
                <label className={CLASSE_LABEL}>CPF ou CNPJ</label>
                <input name="cpf_cnpj" value={form.cpf_cnpj} onChange={handle} inputMode="numeric"
                  className={`${CLASSE_INPUT} ${erroDoc ? "border-red-300 bg-red-50" : ""}`} placeholder="Somente números" />
                {erroDoc && <p className="text-xs text-red-600 font-bold mt-1">{erroDoc}</p>}
              </div>
              {campo("rg", "RG")}
              {campo("data_nascimento", "Data de nascimento", { type: "date" })}
              <div>
                <label className={CLASSE_LABEL}>Estado civil</label>
                <select name="estado_civil" value={form.estado_civil} onChange={handle} className={CLASSE_INPUT}>
                  <option value="">Não informado</option>
                  {ESTADOS_CIVIS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              {campo("profissao", "Profissão", {}, "sm:col-span-2")}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: onde encontrar */}
        <div className="space-y-6">
          <div className={CLASSE_CARD}>
            <h2 className={CLASSE_TITULO}>Contato</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campo("telefone", "Telefone", { placeholder: "(42) 99999-9999", inputMode: "tel" })}
              {campo("email", "E-mail", { type: "email", placeholder: "email@exemplo.com" })}
            </div>
          </div>

          <div className={CLASSE_CARD}>
            <h2 className={CLASSE_TITULO}>Endereço</h2>
            <div className="grid grid-cols-6 gap-3">
              {campo("cep", "CEP", { inputMode: "numeric", placeholder: "00000-000" }, "col-span-2")}
              {campo("logradouro", "Rua / Avenida", {}, "col-span-4")}
              {campo("numero", "Número", {}, "col-span-2")}
              {campo("complemento", "Complemento", {}, "col-span-4")}
              {campo("bairro", "Bairro", {}, "col-span-2")}
              {campo("cidade", "Cidade", {}, "col-span-3")}
              <div className="col-span-1">
                <label className={CLASSE_LABEL}>UF</label>
                <select name="uf" value={form.uf} onChange={handle} className={`${CLASSE_INPUT} px-2`}>
                  <option value="">—</option>
                  {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={CLASSE_CARD}>
            <h2 className={CLASSE_TITULO}>Observações</h2>
            <textarea name="observacoes" rows={3} value={form.observacoes} onChange={handle} className={`${CLASSE_INPUT} font-medium`} />
          </div>
        </div>
      </div>

      {/* BARRA DE AÇÕES FIXA NO RODAPÉ */}
      <div className="fixed bottom-0 left-72 right-0 z-10 bg-white/90 backdrop-blur border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-10 py-3 flex items-center justify-end gap-3">
          <Link href={voltar} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-all">Cancelar</Link>
          <button type="submit" disabled={salvando}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all disabled:opacity-60">
            {salvando ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} {editando ? "Salvar alterações" : "Cadastrar cliente"}
          </button>
        </div>
      </div>
    </form>
  );
}
