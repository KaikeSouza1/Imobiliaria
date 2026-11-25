"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderOpen, FilePlus2, FolderInput, Search, X, Loader2, Folder, Files, ChevronLeft, ChevronRight, FileText,
} from "lucide-react";
import EnvioDocumentos from "@/components/documentos/EnvioDocumentos";
import ItemDocumento, { type DocumentoResumo } from "@/components/documentos/ItemDocumento";
import { TIPOS_DOCUMENTO, ROTULO_TIPO_DOCUMENTO } from "@/lib/documentos";

interface ContratoOpcao {
  id: number;
  codigo: string | null;
  inquilino_nome: string | null;
  imovel_titulo: string | null;
  imovel_codigo_legado: string | null;
}

interface Pasta {
  id: number;
  codigo: string | null;
  numero_pasta: string | null;
  inquilino_nome: string | null;
  total: number;
}

const CLASSE_INPUT = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all";

function chip(ativo: boolean) {
  return `px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${ativo
    ? "bg-[#0f2e20] text-white border-[#0f2e20] shadow-sm"
    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`;
}

// Escolha do contrato para anexar um arquivo pela tela de documentos.
function SeletorContrato({ onEscolher }: { onEscolher: (c: ContratoOpcao) => void }) {
  const [termo, setTermo] = useState("");
  const [opcoes, setOpcoes] = useState<ContratoOpcao[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (termo.trim().length < 2) return;
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(`/api/admin/locacoes?por_pagina=8&q=${encodeURIComponent(termo.trim())}`);
        const d = await r.json();
        setOpcoes(d.itens || []);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [termo]);

  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input value={termo} onChange={(e) => setTermo(e.target.value)} className={`${CLASSE_INPUT} pl-9`}
        placeholder="Buscar contrato por código, inquilino, proprietário ou endereço..." autoFocus />
      {buscando && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
      {termo.trim().length >= 2 && !buscando && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          {opcoes.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">Nenhum contrato encontrado.</p>}
          {opcoes.map((c) => (
            <button key={c.id} type="button" onClick={() => { onEscolher(c); setTermo(""); setOpcoes([]); }}
              className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-50">
              <p className="font-bold text-sm text-gray-900">{c.codigo || `#${c.id}`} — {c.inquilino_nome}</p>
              <p className="text-xs text-gray-500">{c.imovel_titulo || (c.imovel_codigo_legado ? `Imóvel #${c.imovel_codigo_legado}` : "")}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GestaoDocumentosPage() {
  const [modo, setModo] = useState<"recentes" | "pastas">("recentes");
  const [adicionando, setAdicionando] = useState(false);
  const [contratoEscolhido, setContratoEscolhido] = useState<ContratoOpcao | null>(null);

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [versao, setVersao] = useState(0);

  const [docs, setDocs] = useState<{ itens: DocumentoResumo[]; total: number; paginas: number } | null>(null);
  const [pastas, setPastas] = useState<Pasta[] | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    const t = setTimeout(async () => {
      setCarregando(true);
      try {
        const p = new URLSearchParams();
        if (busca.trim()) p.set("q", busca.trim());
        if (modo === "pastas") {
          p.set("pastas", "1");
          const r = await fetch(`/api/admin/documentos?${p}`);
          const d = await r.json();
          if (ativo) setPastas(Array.isArray(d) ? d : []);
        } else {
          if (tipo) p.set("tipo", tipo);
          p.set("pagina", String(pagina));
          const r = await fetch(`/api/admin/documentos?${p}`);
          const d = await r.json();
          if (ativo) setDocs(r.ok ? d : { itens: [], total: 0, paginas: 1 });
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }, 300);
    return () => { ativo = false; clearTimeout(t); };
  }, [modo, busca, tipo, pagina, versao]);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-1 h-8 bg-green-600 rounded-full"></div>
            Gestão de Documentos
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-7">Contratos assinados, vistorias e comprovantes em PDF</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button disabled title="Importação de pastas: disponível na etapa de importação em lote"
            className="bg-white border border-gray-200 text-gray-400 px-5 py-3 rounded-xl font-bold flex items-center gap-2 cursor-not-allowed">
            <FolderInput size={18} /> Usar Pasta
          </button>
          <button onClick={() => { setAdicionando((v) => !v); setContratoEscolhido(null); }}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95">
            <FilePlus2 size={20} /> Adicionar Arquivo
          </button>
        </div>
      </div>

      {/* ADICIONAR ARQUIVO */}
      {adicionando && (
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider">Adicionar arquivo a um contrato</h2>
            <button onClick={() => setAdicionando(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          {contratoEscolhido ? (
            <>
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <FileText size={18} className="text-green-700" />
                <p className="flex-1 font-bold text-gray-900 text-sm">
                  {contratoEscolhido.codigo || `#${contratoEscolhido.id}`} — {contratoEscolhido.inquilino_nome}
                </p>
                <button onClick={() => setContratoEscolhido(null)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg">Trocar</button>
              </div>
              <EnvioDocumentos vinculo={{ locacao_id: contratoEscolhido.id }} onConcluido={() => setVersao((v) => v + 1)} />
            </>
          ) : (
            <SeletorContrato onEscolher={setContratoEscolhido} />
          )}
        </div>
      )}

      {/* BUSCA E MODO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setModo("recentes")} className={chip(modo === "recentes")}><Files size={14} /> Documentos Recentes</button>
          <button onClick={() => setModo("pastas")} className={chip(modo === "pastas")}><Folder size={14} /> Pastas por contrato</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`relative ${modo === "recentes" ? "md:col-span-2" : "md:col-span-3"}`}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} className={`${CLASSE_INPUT} pl-9`}
              placeholder={modo === "recentes" ? "Nome do arquivo, código do contrato, inquilino ou proprietário..." : "Código do contrato ou inquilino..."} />
            {busca && (
              <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
            )}
          </div>
          {modo === "recentes" && (
            <select value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1); }} className={CLASSE_INPUT}>
              <option value="">Todos os tipos</option>
              {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{ROTULO_TIPO_DOCUMENTO[t]}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* RESULTADOS */}
      {carregando && !docs && !pastas ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-green-700" size={40} />
          <p className="text-gray-500 font-bold">Carregando documentos...</p>
        </div>
      ) : modo === "pastas" ? (
        !pastas || pastas.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
            <FolderOpen className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-600">Nenhuma pasta encontrada</h3>
            <p className="text-gray-400 mt-2 text-sm">Cada contrato com documentos aparece aqui como uma pasta.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-opacity ${carregando ? "opacity-60" : ""}`}>
            {pastas.map((p) => (
              <Link key={p.id} href={`/admin/locacoes/${p.id}?aba=documentos`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:border-green-200 transition-all">
                <Folder className="text-amber-500 mb-2" size={28} />
                <p className="font-black text-gray-900 text-sm">{p.codigo || `#${p.id}`}</p>
                <p className="text-xs text-gray-500 truncate">{p.inquilino_nome}</p>
                <p className="text-[11px] text-gray-400 mt-2 font-bold">
                  {p.total} documento{p.total !== 1 ? "s" : ""}{p.numero_pasta ? ` · Pasta física ${p.numero_pasta}` : ""}
                </p>
              </Link>
            ))}
          </div>
        )
      ) : !docs || docs.itens.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-600">{busca || tipo ? "Nenhum documento encontrado" : "Nenhum documento ainda"}</h3>
          <p className="text-gray-400 mt-2 text-sm">{busca || tipo ? "Tente outros critérios." : 'Clique em "Adicionar Arquivo" para anexar o primeiro PDF.'}</p>
        </div>
      ) : (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-2 transition-opacity ${carregando ? "opacity-60" : ""}`}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            {docs.total} documento{docs.total !== 1 ? "s" : ""}
          </p>
          {docs.itens.map((d) => (
            <ItemDocumento key={d.id} doc={d} mostrarContrato onExcluido={() => setVersao((v) => v + 1)} />
          ))}
          {docs.paginas > 1 && (
            <div className="flex items-center justify-between pt-3 text-sm">
              <span className="text-gray-500 font-medium">Página {pagina} de {docs.paginas}</span>
              <div className="flex gap-2">
                <button disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronLeft size={16} /></button>
                <button disabled={pagina >= docs.paginas} onClick={() => setPagina((p) => p + 1)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
