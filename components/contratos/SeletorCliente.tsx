"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, UserPlus, Loader2, User } from "lucide-react";

export type ValorCliente =
  | { modo: "existente"; id: number; nome: string; documento?: string; codigo?: string }
  | { modo: "novo"; nome: string; cpf_cnpj: string; telefone: string; email: string }
  | null;

interface ClienteOpcao {
  id: number;
  codigo: string | null;
  nome: string;
  documento: string;
  telefone: string | null;
}

const CLASSE_INPUT = "w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]";
const CLASSE_LABEL = "text-[10px] font-black uppercase text-gray-400 ml-2";

export default function SeletorCliente({
  papel,
  valor,
  onChange,
  obrigatorio,
}: {
  papel: "inquilino" | "proprietario";
  valor: ValorCliente;
  onChange: (v: ValorCliente) => void;
  obrigatorio?: boolean;
}) {
  const rotulo = papel === "inquilino" ? "inquilino" : "proprietário";
  const [termo, setTermo] = useState("");
  const [opcoes, setOpcoes] = useState<ClienteOpcao[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aberto, setAberto] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    if (termo.trim().length < 2) {
      setOpcoes([]);
      return;
    }
    temporizador.current = setTimeout(async () => {
      setBuscando(true);
      try {
        // Busca em todos os clientes: quem é proprietário também pode ser inquilino.
        const res = await fetch(`/api/admin/clientes?q=${encodeURIComponent(termo.trim())}`);
        const data = await res.json();
        setOpcoes(Array.isArray(data) ? data : []);
      } finally {
        setBuscando(false);
      }
    }, 300);
  }, [termo]);

  if (valor?.modo === "existente") {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-green-700 border border-green-100">
          <User size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{valor.nome}</p>
          <p className="text-xs text-gray-500">
            {[valor.codigo, valor.documento].filter(Boolean).join(" · ") || "Cliente cadastrado"}
          </p>
        </div>
        <button type="button" onClick={() => onChange(null)}
          className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
          Trocar
        </button>
      </div>
    );
  }

  if (valor?.modo === "novo") {
    const set = (campo: "nome" | "cpf_cnpj" | "telefone" | "email", v: string) => onChange({ ...valor, [campo]: v });
    return (
      <div className="space-y-4 bg-gray-50/60 border border-dashed border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <UserPlus size={14} className="text-green-600" /> Novo {rotulo}
          </p>
          <button type="button" onClick={() => onChange(null)}
            className="text-xs font-bold text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
            Buscar cadastrado
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={CLASSE_LABEL}>Nome completo{obrigatorio ? " *" : ""}</label>
            <input value={valor.nome} onChange={(e) => set("nome", e.target.value)} className={CLASSE_INPUT} placeholder="Ex: Maria Exemplo" />
          </div>
          <div>
            <label className={CLASSE_LABEL}>CPF ou CNPJ</label>
            <input value={valor.cpf_cnpj} onChange={(e) => set("cpf_cnpj", e.target.value)} className={CLASSE_INPUT} placeholder="Somente números" />
          </div>
          <div>
            <label className={CLASSE_LABEL}>Telefone</label>
            <input value={valor.telefone} onChange={(e) => set("telefone", e.target.value)} className={CLASSE_INPUT} placeholder="(42) 99999-9999" />
          </div>
          <div className="md:col-span-2">
            <label className={CLASSE_LABEL}>E-mail</label>
            <input type="email" value={valor.email} onChange={(e) => set("email", e.target.value)} className={CLASSE_INPUT} placeholder="email@exemplo.com" />
          </div>
        </div>
        <p className="text-[11px] text-gray-400 ml-2">Se o CPF/CNPJ já estiver cadastrado, o contrato usa o cadastro existente.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={termo}
          onChange={(e) => { setTermo(e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          className={`${CLASSE_INPUT} pl-10`}
          placeholder={`Buscar ${rotulo} por nome, código ou CPF...`}
        />
        {buscando && <Loader2 size={15} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
        {!buscando && termo && (
          <button type="button" onClick={() => setTermo("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {aberto && termo.trim().length >= 2 && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          {opcoes.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange({ modo: "existente", id: c.id, nome: c.nome, documento: c.documento, codigo: c.codigo || undefined }); setTermo(""); }}
              className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-50"
            >
              <p className="font-bold text-sm text-gray-900">{c.nome}</p>
              <p className="text-xs text-gray-500">{[c.codigo, c.documento, c.telefone].filter(Boolean).join(" · ")}</p>
            </button>
          ))}
          {!buscando && opcoes.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">Nenhum cliente encontrado.</p>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onChange({ modo: "novo", nome: termo.trim(), cpf_cnpj: "", telefone: "", email: "" }); setTermo(""); }}
            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-green-50 transition-colors text-sm font-bold text-green-700 flex items-center gap-2"
          >
            <UserPlus size={14} /> Cadastrar novo {rotulo}: “{termo.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}
