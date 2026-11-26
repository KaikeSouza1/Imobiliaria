"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2, FileText } from "lucide-react";
import { rotuloStatus } from "@/lib/contratos";

export interface ContratoOpcao {
  id: number;
  codigo: string | null;
  tipo?: "locacao" | "venda";
  status?: string;
  inquilino_nome: string | null;
  proprietario_nome?: string | null;
  imovel_titulo: string | null;
  imovel_codigo_legado: string | null;
}

// Busca de contrato: mostra os mais recentes ao clicar e filtra a cada letra.
export default function SeletorContrato({ onEscolher, autoFoco }: { onEscolher: (c: ContratoOpcao) => void; autoFoco?: boolean }) {
  const [termo, setTermo] = useState("");
  const [opcoes, setOpcoes] = useState<ContratoOpcao[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aberto, setAberto] = useState(!!autoFoco);
  const [ativoIdx, setAtivoIdx] = useState(0);
  const ultima = useRef(0);

  useEffect(() => {
    if (!aberto) return;
    const id = ++ultima.current;
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(`/api/admin/locacoes?por_pagina=8&q=${encodeURIComponent(termo.trim())}`);
        const d = await r.json();
        if (id === ultima.current) { setOpcoes(d.itens || []); setAtivoIdx(0); }
      } finally {
        if (id === ultima.current) setBuscando(false);
      }
    }, termo ? 120 : 0);
    return () => clearTimeout(t);
  }, [termo, aberto]);

  const escolher = (c: ContratoOpcao) => { setAberto(false); setTermo(""); onEscolher(c); };
  const teclado = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAtivoIdx((i) => Math.min(i + 1, opcoes.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAtivoIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && opcoes[ativoIdx]) { e.preventDefault(); escolher(opcoes[ativoIdx]); }
    else if (e.key === "Escape") setAberto(false);
  };

  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input value={termo} onChange={(e) => { setTermo(e.target.value); setAberto(true); }} onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)} onKeyDown={teclado} autoFocus={autoFoco}
        className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-green-500 focus:bg-white transition-all"
        placeholder="Clique para ver os contratos ou digite código, inquilino, proprietário ou endereço..." />
      {buscando ? <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
        : termo && <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setTermo("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
      {aberto && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden" onMouseDown={(e) => e.preventDefault()}>
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/70 text-[11px] text-gray-400 font-bold">{termo.trim() ? "Resultados" : "Contratos mais recentes"}</div>
          <div className="max-h-80 overflow-y-auto">
            {!buscando && opcoes.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">Nenhum contrato encontrado.</p>}
            {opcoes.map((c, i) => (
              <button key={c.id} type="button" onClick={() => escolher(c)} onMouseEnter={() => setAtivoIdx(i)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 ${i === ativoIdx ? "bg-green-50" : "hover:bg-green-50/60"}`}>
                <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0"><FileText size={16} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">
                    {c.codigo || `#${c.id}`} — {c.inquilino_nome}
                    {c.tipo === "venda" && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-blue-100 text-blue-800">Venda</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{c.imovel_titulo || (c.imovel_codigo_legado ? `Imóvel #${c.imovel_codigo_legado}` : "Imóvel não informado")}</p>
                </div>
                {c.status && <span className="text-[10px] font-black uppercase text-gray-500">{rotuloStatus(c.status, c.tipo)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
