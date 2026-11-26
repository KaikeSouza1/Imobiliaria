"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, UserPlus, Loader2, User } from "lucide-react";

export type ValorCliente =
  | { modo: "existente"; id: number; nome: string; documento?: string; codigo?: string }
  | { modo: "novo"; nome: string; cpf_cnpj: string; telefone: string; email: string }
  | null;

interface ClienteOpcao {
  eh_inquilino?: boolean;
  eh_proprietario?: boolean;
  total_contratos?: number;
  id: number;
  codigo: string | null;
  nome: string;
  documento: string;
  telefone: string | null;
}

const CLASSE_INPUT = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-green-500 focus:bg-white transition-all";
const CLASSE_LABEL = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block";

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
  const ultimaBusca = useRef(0);
  const [ativoIdx, setAtivoIdx] = useState(0);
  const [pesquisou, setPesquisou] = useState(false);

  // Ao abrir (foco) mostra os cadastros mais recentes; ao digitar filtra a cada letra.
  useEffect(() => {
    if (!aberto) return;
    if (temporizador.current) clearTimeout(temporizador.current);
    const id = ++ultimaBusca.current;
    temporizador.current = setTimeout(async () => {
      setBuscando(true);
      try {
        // Busca em todos os clientes: quem é proprietário também pode ser inquilino.
        const res = await fetch(`/api/admin/clientes/sugestoes?q=${encodeURIComponent(termo.trim())}`);
        const data = await res.json();
        if (id === ultimaBusca.current) { setOpcoes(Array.isArray(data) ? data : []); setPesquisou(true); setAtivoIdx(0); }
      } finally {
        if (id === ultimaBusca.current) setBuscando(false);
      }
    }, termo ? 120 : 0);
    return () => { if (temporizador.current) clearTimeout(temporizador.current); };
  }, [termo, aberto]);

  const escolherCliente = (c: ClienteOpcao) => {
    onChange({ modo: "existente", id: c.id, nome: c.nome, documento: c.documento, codigo: c.codigo || undefined });
    setTermo("");
    setAberto(false);
  };
  const cadastrarNovo = () => {
    onChange({ modo: "novo", nome: termo.trim(), cpf_cnpj: "", telefone: "", email: "" });
    setTermo("");
    setAberto(false);
  };
  const teclado = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAberto(true); setAtivoIdx((i) => Math.min(i + 1, opcoes.length)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAtivoIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && aberto) {
      e.preventDefault();
      if (opcoes[ativoIdx]) escolherCliente(opcoes[ativoIdx]);
      else if (termo.trim()) cadastrarNovo();
    } else if (e.key === "Escape") setAberto(false);
  };

  if (valor?.modo === "existente") {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
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
      <div className="space-y-3 bg-gray-50/60 border border-dashed border-gray-200 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <UserPlus size={14} className="text-green-600" /> Novo {rotulo}
          </p>
          <button type="button" onClick={() => onChange(null)}
            className="text-xs font-bold text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
            Buscar cadastrado
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
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
          <div className="sm:col-span-2">
            <label className={CLASSE_LABEL}>E-mail</label>
            <input type="email" value={valor.email} onChange={(e) => set("email", e.target.value)} className={CLASSE_INPUT} placeholder="email@exemplo.com" />
          </div>
        </div>
        <p className="text-[11px] text-gray-400 ml-2">Se o CPF/CNPJ já estiver cadastrado, o contrato usa o cadastro existente.</p>
      </div>
    );
  }

  const iniciais = (nome: string) => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={termo}
          onChange={(e) => { setTermo(e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          onKeyDown={teclado}
          role="combobox"
          aria-expanded={aberto}
          aria-controls="lista-clientes"
          aria-autocomplete="list"
          aria-label={`Buscar ${rotulo}`}
          className={`${CLASSE_INPUT} pl-9`}
          placeholder="Clique ou digite nome, código ou CPF..."
        />
        {buscando && <Loader2 size={15} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
        {!buscando && termo && (
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setTermo("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {aberto && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden" onMouseDown={(e) => e.preventDefault()}>
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/70 text-[11px] text-gray-400 font-bold flex items-center justify-between">
            <span>{termo.trim() ? "Resultados" : "Cadastrados mais recentemente"}</span>
            {pesquisou && <span>{opcoes.length}{opcoes.length >= 10 ? "+" : ""}</span>}
          </div>
          <div className="max-h-80 overflow-y-auto" id="lista-clientes" role="listbox">
            {opcoes.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={i === ativoIdx}
                onClick={() => escolherCliente(c)}
                onMouseEnter={() => setAtivoIdx(i)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 transition-colors ${i === ativoIdx ? "bg-green-50" : "hover:bg-green-50/60"}`}
              >
                <div className="w-9 h-9 rounded-full bg-green-100 text-green-800 text-xs font-black flex items-center justify-center flex-shrink-0">{iniciais(c.nome)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{c.nome}</p>
                  <p className="text-xs text-gray-500 truncate">{[c.codigo, c.documento, c.telefone].filter(Boolean).join(" · ") || "Sem documento ou telefone"}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex gap-1">
                    {c.eh_inquilino && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-green-100 text-green-800">Inq.</span>}
                    {c.eh_proprietario && <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-orange-100 text-orange-800">Prop.</span>}
                  </div>
                  {typeof c.total_contratos === "number" && <span className="text-[10px] text-gray-400 font-bold">{c.total_contratos} contrato{c.total_contratos !== 1 ? "s" : ""}</span>}
                </div>
              </button>
            ))}
            {!buscando && pesquisou && opcoes.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400">{termo.trim() ? "Nenhum cliente encontrado com esse nome." : "Nenhum cliente cadastrado ainda."}</p>
            )}
          </div>
          <button
            type="button"
            onClick={cadastrarNovo}
            className={`w-full text-left px-4 py-3 transition-colors text-sm font-bold text-green-700 flex items-center gap-2 ${ativoIdx === opcoes.length ? "bg-green-50" : "bg-gray-50 hover:bg-green-50"}`}
          >
            <UserPlus size={14} /> {termo.trim() ? `Cadastrar novo ${rotulo}: “${termo.trim()}”` : `Cadastrar novo ${rotulo}`}
          </button>
        </div>
      )}
    </div>
  );
}
