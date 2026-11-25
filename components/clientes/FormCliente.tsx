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

const CLASSE_CARD = "bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6";
const CLASSE_TITULO = "text-sm font-black text-gray-400 uppercase tracking-widest";
const CLASSE_INPUT = "w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]";
const CLASSE_LABEL = "text-[10px] font-black uppercase text-gray-400 ml-2";

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
    <div className="max-w-3xl mx-auto pb-20 px-4">
      <div className="flex items-center gap-4 mb-8 pt-10">
        <Link href={editando ? `/admin/clientes/${cliente!.id}` : "/admin/clientes"}
          className="p-3 bg-white hover:bg-gray-100 rounded-2xl shadow-sm text-gray-500 transition-all border border-gray-100">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
          {editando ? `Editar ${cliente!.codigo ?? "Cliente"}` : "Novo Cliente"}
        </h1>
      </div>

      <form onSubmit={salvar} className="space-y-8" noValidate>
        {erros.length > 0 && (
          <div className="flex gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-medium" role="alert">
            <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
            <ul className="space-y-1">{erros.map((er) => <li key={er}>{er}</li>)}</ul>
          </div>
        )}

        <div className={CLASSE_CARD}>
          <h2 className={CLASSE_TITULO}>Tipo de cliente</h2>
          <div className="flex gap-3 flex-wrap">
            {([["Inquilino", ehInquilino, setEhInquilino], ["Proprietário", ehProprietario, setEhProprietario]] as const).map(([r, v, s]) => (
              <label key={r} className={`flex items-center gap-2 px-5 py-3 rounded-xl border cursor-pointer text-sm font-bold transition-all
                ${v ? "bg-[#0f2e20] text-white border-[#0f2e20]" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                <input type="checkbox" checked={v} onChange={(e) => s(e.target.checked)} className="rounded" /> {r}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400 ml-1">A mesma pessoa pode ser inquilina e proprietária.</p>
        </div>

        <div className={CLASSE_CARD}>
          <h2 className={CLASSE_TITULO}>Dados pessoais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campo("nome", "Nome completo / Razão social *", { placeholder: "Ex: Maria Exemplo" }, "md:col-span-2")}
            <div>
              <label className={CLASSE_LABEL}>CPF ou CNPJ</label>
              <input name="cpf_cnpj" value={form.cpf_cnpj} onChange={handle} inputMode="numeric"
                className={`${CLASSE_INPUT} ${erroDoc ? "ring-2 ring-red-300" : ""}`} placeholder="Somente números" />
              {erroDoc && <p className="text-xs text-red-600 font-bold ml-2 mt-1">{erroDoc}</p>}
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
            {campo("profissao", "Profissão", {}, "md:col-span-2")}
          </div>
        </div>

        <div className={CLASSE_CARD}>
          <h2 className={CLASSE_TITULO}>Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campo("telefone", "Telefone", { placeholder: "(42) 99999-9999", inputMode: "tel" })}
            {campo("email", "E-mail", { type: "email", placeholder: "email@exemplo.com" })}
          </div>
        </div>

        <div className={CLASSE_CARD}>
          <h2 className={CLASSE_TITULO}>Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {campo("cep", "CEP", { inputMode: "numeric", placeholder: "00000-000" }, "md:col-span-2")}
            {campo("logradouro", "Rua / Avenida", {}, "md:col-span-4")}
            {campo("numero", "Número", {}, "md:col-span-2")}
            {campo("complemento", "Complemento", {}, "md:col-span-4")}
            {campo("bairro", "Bairro", {}, "md:col-span-2")}
            {campo("cidade", "Cidade", {}, "md:col-span-3")}
            <div className="md:col-span-1">
              <label className={CLASSE_LABEL}>UF</label>
              <select name="uf" value={form.uf} onChange={handle} className={CLASSE_INPUT}>
                <option value="">—</option>
                {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={CLASSE_CARD}>
          <h2 className={CLASSE_TITULO}>Observações</h2>
          <textarea name="observacoes" rows={4} value={form.observacoes} onChange={handle}
            className="w-full bg-gray-50 border-none p-4 rounded-xl font-medium focus:ring-2 focus:ring-[#0f2e20]" />
        </div>

        <button type="submit" disabled={salvando}
          className="w-full bg-[#0f2e20] text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all uppercase tracking-widest text-sm disabled:opacity-60">
          {salvando ? <Loader2 className="animate-spin" /> : <Save size={20} />} {editando ? "Salvar Alterações" : "Cadastrar Cliente"}
        </button>
      </form>
    </div>
  );
}
