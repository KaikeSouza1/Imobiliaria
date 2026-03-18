"use client";

// ================================================================
// CAPTACAO_VIEW.TSX
// Cole este componente dentro do seu CRM principal.
// Adicione a importação e o botão de navegação conforme instruções
// no final deste arquivo.
// ================================================================

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, Search, X, Phone, Globe, Tag, Edit2,
  Trash2, ExternalLink, User, MapPin, DollarSign,
  CheckCircle, Clock, AlertCircle, XCircle, AlignLeft,
  ChevronDown, Key, Building, RefreshCcw, Target,
  Home, Calendar
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────
interface Proprietario {
  id: number;
  nome_proprietario: string;
  telefone?: string;
  titulo_imovel?: string;
  preco_anuncio?: string;
  localizacao?: string;
  descricao?: string;
  link_anuncio?: string;
  tipo_anuncio: string;
  origem: string;
  estagio: string;
  corretor: string;
  observacoes?: string;
  criado_em: string;
}

// ── Constantes ─────────────────────────────────────────────────
const ESTAGIOS = [
  {
    id: "NOVO",
    nome: "Novos Anúncios",
    cor: "from-sky-500 to-sky-600",
    bg: "bg-sky-50",
    text: "text-sky-700",
    badge: "bg-sky-100 text-sky-700",
    border: "border-sky-200",
    icon: <AlertCircle className="w-4 h-4 text-sky-500" />,
    desc: "Capturados, aguardando contato"
  },
  {
    id: "CONTATADO",
    nome: "Em Negociação",
    cor: "from-amber-400 to-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
    icon: <Clock className="w-4 h-4 text-amber-500" />,
    desc: "Proposta de captação em andamento"
  },
  {
    id: "PROPOSTA",
    nome: "Proposta Enviada",
    cor: "from-violet-500 to-violet-600",
    bg: "bg-violet-50",
    text: "text-violet-700",
    badge: "bg-violet-100 text-violet-700",
    border: "border-violet-200",
    icon: <Target className="w-4 h-4 text-violet-500" />,
    desc: "Aguardando assinatura do contrato"
  },
  {
    id: "CAPTADO",
    nome: "Imóvel Captado ✓",
    cor: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    desc: "Contrato assinado, imóvel na carteira"
  },
  {
    id: "PERDIDO",
    nome: "Perdido",
    cor: "from-red-400 to-red-500",
    bg: "bg-red-50",
    text: "text-red-600",
    badge: "bg-red-100 text-red-600",
    border: "border-red-200",
    icon: <XCircle className="w-4 h-4 text-red-400" />,
    desc: "Proprietário recusou ou foi para outra"
  },
] as const;

const CORRETORES = ["André", "Anna", "Claudinei", "Jessica", "Luane", "Não Atribuído"];

const FORM_VAZIO: Partial<Proprietario> = {
  estagio: "NOVO",
  tipo_anuncio: "Venda",
  corretor: "André",
  origem: "Facebook Marketplace",
};

// ── Helpers ────────────────────────────────────────────────────
const getIniciais = (nome: string) => {
  if (!nome) return "PR";
  const p = nome.split(" ");
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nome.substring(0, 2).toUpperCase();
};

const formatarData = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================
export default function CaptacaoView() {
  const [lista, setLista] = useState<Proprietario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Partial<Proprietario>>(FORM_VAZIO);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroCorretor, setFiltroCorretor] = useState("TODOS");

  // Drag & drop
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // ── Carregar dados ──
  const carregar = async () => {
    const res = await fetch("/api/admin/proprietarios");
    setLista(await res.json());
    setLoading(false);
  };
  useEffect(() => { carregar(); }, []);

  // ── Filtrar lista ──
  const listaFiltrada = useMemo(() => lista.filter(p => {
    const matchBusca = !busca ||
      (p.nome_proprietario || "").toLowerCase().includes(busca.toLowerCase()) ||
      (p.titulo_imovel || "").toLowerCase().includes(busca.toLowerCase()) ||
      (p.localizacao || "").toLowerCase().includes(busca.toLowerCase()) ||
      (p.telefone || "").includes(busca);
    const matchTipo = filtroTipo === "TODOS" || p.tipo_anuncio === filtroTipo;
    const matchCor = filtroCorretor === "TODOS" || p.corretor === filtroCorretor;
    return matchBusca && matchTipo && matchCor;
  }), [lista, busca, filtroTipo, filtroCorretor]);

  // ── KPIs rápidos ──
  const kpis = useMemo(() => ({
    total: lista.length,
    novos: lista.filter(p => p.estagio === "NOVO").length,
    captados: lista.filter(p => p.estagio === "CAPTADO").length,
    venda: lista.filter(p => p.tipo_anuncio === "Venda").length,
    aluguel: lista.filter(p => p.tipo_anuncio === "Aluguel").length,
  }), [lista]);

  // ── Modal ──
  const abrirNovo = () => { setEditando(false); setForm(FORM_VAZIO); setModal(true); };
  const abrirEditar = (p: Proprietario) => { setEditando(true); setForm(p); setModal(true); };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/proprietarios", {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModal(false);
    carregar();
  };

  const excluir = async (id: number) => {
    if (!confirm("Excluir este proprietário?")) return;
    await fetch(`/api/admin/proprietarios?id=${id}`, { method: "DELETE" });
    carregar();
  };

  const moverEstagio = async (id: number, novoEstagio: string) => {
    setLista(prev => prev.map(p => p.id === id ? { ...p, estagio: novoEstagio } : p));
    await fetch("/api/admin/proprietarios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estagio: novoEstagio }),
    });
  };

  // ── Drag & Drop ──
  const onDragStart = (e: React.DragEvent, id: number) => {
    setDragId(id);
    e.dataTransfer.setData("text/plain", id.toString());
    setTimeout(() => {
      const el = document.getElementById(`prop-${id}`);
      if (el) el.style.opacity = "0.4";
    }, 0);
  };
  const onDragEnd = (e: React.DragEvent, id: number) => {
    setDragId(null); setDragOverCol(null);
    const el = document.getElementById(`prop-${id}`);
    if (el) el.style.opacity = "1";
  };
  const onDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); setDragOverCol(colId);
  };
  const onDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); setDragOverCol(null);
    if (dragId) {
      const p = lista.find(x => x.id === dragId);
      if (p && p.estagio !== colId) moverEstagio(dragId, colId);
    }
    setDragId(null);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {/* ── BARRA DE KPIs ── */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-6 overflow-x-auto z-30">
        <KpiChip label="Total Capturados" value={kpis.total} color="slate" />
        <KpiChip label="Novos (sem contato)" value={kpis.novos} color="sky" />
        <KpiChip label="Imóveis Captados" value={kpis.captados} color="emerald" />
        <div className="h-8 w-px bg-slate-200 mx-1 shrink-0" />
        <KpiChip label="Para Venda" value={kpis.venda} color="emerald" icon="🏡" />
        <KpiChip label="Para Aluguel" value={kpis.aluguel} color="violet" icon="🔑" />
      </div>

      {/* ── TOOLBAR ── */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 flex-wrap z-20">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Buscar por nome, imóvel, bairro..."
            value={busca} onChange={e => setBusca(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-400 transition-all"
          />
          {busca && <button onClick={() => setBusca('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
        </div>

        <div className="flex items-center gap-3 overflow-x-auto">
          <FilterSelect icon={<Tag className="w-3.5 h-3.5 text-emerald-500" />} value={filtroTipo} onChange={setFiltroTipo}>
            <option value="TODOS">Venda & Aluguel</option>
            <option value="Venda">Apenas Venda</option>
            <option value="Aluguel">Apenas Aluguel</option>
          </FilterSelect>
          <FilterSelect icon={<Key className="w-3.5 h-3.5 text-violet-500" />} value={filtroCorretor} onChange={setFiltroCorretor}>
            <option value="TODOS">Todos Corretores</option>
            {CORRETORES.filter(c => c !== "Não Atribuído").map(c => <option key={c}>{c}</option>)}
          </FilterSelect>
          <button
            onClick={abrirNovo}
            className="flex items-center gap-2 bg-[#0f2e20] hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" strokeWidth={3} /> Adicionar
          </button>
        </div>
      </div>

      {/* ── KANBAN ── */}
      <main className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden p-5 bg-slate-50">
        <div className="flex gap-4 h-full min-w-max pb-4">
          {ESTAGIOS.map(col => {
            const cards = listaFiltrada.filter(p => p.estagio === col.id);
            const isHover = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                className={`w-[290px] shrink-0 flex flex-col rounded-2xl border p-3 transition-all duration-200 ${isHover ? `${col.bg} ${col.border} scale-[1.01] shadow-lg` : "bg-slate-100/80 border-slate-200"}`}
                onDragOver={e => onDragOver(e, col.id)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={e => onDrop(e, col.id)}
              >
                {/* Cabeçalho da coluna */}
                <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${col.cor} mb-3`} />
                <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-200/60 mb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${col.bg} shadow-sm`}>{col.icon}</div>
                    <div>
                      <p className={`font-black text-[11px] uppercase tracking-wider ${col.text}`}>{col.nome}</p>
                      <p className="text-[9px] text-slate-400 font-medium">{col.desc}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${col.badge}`}>{cards.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-0.5 pb-2" style={{ scrollbarWidth: "thin" }}>
                  {cards.length === 0 && (
                    <div className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl gap-1 transition-colors ${isHover ? `${col.border} ${col.bg}` : "border-slate-200 bg-white/40"}`}>
                      <Home className={`w-4 h-4 ${isHover ? col.text : "text-slate-300"}`} />
                      <p className={`text-[9px] font-black uppercase tracking-widest ${isHover ? col.text : "text-slate-400"}`}>{isHover ? "Solte aqui!" : "Nenhum imóvel"}</p>
                    </div>
                  )}

                  {cards.map(prop => (
                    <PropCard
                      key={prop.id}
                      prop={prop}
                      coluna={col}
                      onEdit={() => abrirEditar(prop)}
                      onDelete={() => excluir(prop.id)}
                      onMove={moverEstagio}
                      onDragStart={e => onDragStart(e, prop.id)}
                      onDragEnd={e => onDragEnd(e, prop.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── MODAL ── */}
      {modal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <form onSubmit={salvar}
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            style={{ animation: "modalIn .25s cubic-bezier(.34,1.56,.64,1)" }}>

            <div className="bg-[#0f2e20] px-7 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white/10 rounded-xl"><Building className="w-5 h-5 text-emerald-400" /></div>
                <div>
                  <h3 className="text-lg font-black text-white">{editando ? "Editar Proprietário" : "Cadastrar Proprietário"}</h3>
                  <p className="text-[9px] text-emerald-300/50 font-semibold uppercase tracking-widest mt-0.5">Captação de Carteira</p>
                </div>
              </div>
              <button type="button" onClick={() => setModal(false)} className="p-2 bg-white/10 hover:bg-red-500 rounded-full text-white transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4" style={{ scrollbarWidth: "thin" }}>
              {/* Nome */}
              <FormField label="Nome do Proprietário *">
                <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 rounded-2xl px-4 transition-all">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input required type="text" placeholder="Nome completo" value={form.nome_proprietario || ""}
                    onChange={e => setForm({ ...form, nome_proprietario: e.target.value })}
                    className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700" />
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                {/* Telefone */}
                <FormField label="Telefone / WhatsApp">
                  <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 rounded-2xl px-4 transition-all">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <input type="text" placeholder="(42) 99999-9999" value={form.telefone || ""}
                      onChange={e => setForm({ ...form, telefone: e.target.value })}
                      className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700" />
                  </div>
                </FormField>

                {/* Tipo */}
                <FormField label="Tipo de Anúncio">
                  <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 rounded-2xl px-4 transition-all">
                    <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                    <select value={form.tipo_anuncio || "Venda"}
                      onChange={e => setForm({ ...form, tipo_anuncio: e.target.value })}
                      className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700 cursor-pointer">
                      <option value="Venda">🏡 Venda</option>
                      <option value="Aluguel">🔑 Aluguel</option>
                      <option value="Indefinido">❓ Indefinido</option>
                    </select>
                  </div>
                </FormField>
              </div>

              {/* Título */}
              <FormField label="Título do Imóvel">
                <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 rounded-2xl px-4 transition-all">
                  <Home className="w-4 h-4 text-slate-400 shrink-0" />
                  <input type="text" placeholder="Ex: Casa 3 quartos no Centro" value={form.titulo_imovel || ""}
                    onChange={e => setForm({ ...form, titulo_imovel: e.target.value })}
                    className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700" />
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                {/* Preço */}
                <FormField label="Preço Anunciado">
                  <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 rounded-2xl px-4 transition-all">
                    <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                    <input type="text" placeholder="R$ 0,00" value={form.preco_anuncio || ""}
                      onChange={e => setForm({ ...form, preco_anuncio: e.target.value })}
                      className="w-full py-3 bg-transparent outline-none text-sm font-black text-emerald-600" />
                  </div>
                </FormField>

                {/* Localização */}
                <FormField label="Localização">
                  <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 rounded-2xl px-4 transition-all">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <input type="text" placeholder="Bairro, Cidade" value={form.localizacao || ""}
                      onChange={e => setForm({ ...form, localizacao: e.target.value })}
                      className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700" />
                  </div>
                </FormField>
              </div>

              {/* Descrição */}
              <FormField label="Descrição do Imóvel">
                <div className="flex gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 rounded-2xl px-4 py-3 transition-all">
                  <AlignLeft className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <textarea rows={3} placeholder="Características, cômodos, diferenciais..." value={form.descricao || ""}
                    onChange={e => setForm({ ...form, descricao: e.target.value })}
                    className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700 resize-none" />
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                {/* Corretor */}
                <FormField label="Corretor Responsável">
                  <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 rounded-2xl px-4 transition-all">
                    <Key className="w-4 h-4 text-emerald-500 shrink-0" />
                    <select value={form.corretor || "Não Atribuído"}
                      onChange={e => setForm({ ...form, corretor: e.target.value })}
                      className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700 cursor-pointer">
                      {CORRETORES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </FormField>

                {/* Estágio */}
                <FormField label="Estágio">
                  <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 rounded-2xl px-4 transition-all">
                    <Target className="w-4 h-4 text-slate-400 shrink-0" />
                    <select value={form.estagio || "NOVO"}
                      onChange={e => setForm({ ...form, estagio: e.target.value })}
                      className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700 cursor-pointer">
                      {ESTAGIOS.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                    </select>
                  </div>
                </FormField>
              </div>

              {/* Link */}
              <FormField label="Link do Anúncio (Facebook)">
                <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 rounded-2xl px-4 transition-all">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <input type="url" placeholder="https://facebook.com/marketplace/item/..." value={form.link_anuncio || ""}
                    onChange={e => setForm({ ...form, link_anuncio: e.target.value })}
                    className="w-full py-3 bg-transparent outline-none text-sm font-mono text-slate-600 text-xs" />
                </div>
              </FormField>

              {/* Observações */}
              <FormField label="Observações Internas">
                <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 rounded-2xl px-4 transition-all">
                  <AlignLeft className="w-4 h-4 text-slate-400 shrink-0" />
                  <input type="text" placeholder="Notas para a equipe..." value={form.observacoes || ""}
                    onChange={e => setForm({ ...form, observacoes: e.target.value })}
                    className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700" />
                </div>
              </FormField>
            </div>

            <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button type="button" onClick={() => setModal(false)}
                className="flex-1 border-2 border-slate-200 hover:bg-slate-100 text-slate-500 font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all">
                Cancelar
              </button>
              <button type="submit"
                className="flex-[2] bg-[#0f2e20] hover:bg-emerald-900 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">
                {editando ? "Salvar Alterações" : "Adicionar à Carteira"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

// ================================================================
// CARD DO PROPRIETÁRIO
// ================================================================
function PropCard({ prop, coluna, onEdit, onDelete, onMove, onDragStart, onDragEnd }: {
  prop: Proprietario;
  coluna: typeof ESTAGIOS[number];
  onEdit: () => void;
  onDelete: () => void;
  onMove: (id: number, estagio: string) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}) {
  return (
    <div
      id={`prop-${prop.id}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all group relative flex flex-col gap-2.5 cursor-grab active:cursor-grabbing shrink-0"
    >
      {/* Ações hover */}
      <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm">
        {prop.link_anuncio && (
          <a href={prop.link_anuncio} target="_blank" rel="noreferrer"
            title="Ver anúncio original"
            className="p-1.5 rounded-lg bg-blue-50 text-blue-400 hover:text-blue-700 hover:bg-blue-100 transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <button onClick={onEdit} title="Editar"
          className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} title="Excluir"
          className="p-1.5 rounded-lg bg-red-50 text-red-300 hover:text-red-600 hover:bg-red-100 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Nome + data */}
      <div className="flex items-center gap-2.5 pr-20 pointer-events-none">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 border-2 border-white shadow-sm ${coluna.bg} ${coluna.text}`}>
          {getIniciais(prop.nome_proprietario)}
        </div>
        <div className="overflow-hidden">
          <p className="font-bold text-slate-800 text-sm leading-tight truncate">{prop.nome_proprietario}</p>
          <p className="text-[9px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
            <Calendar className="w-2.5 h-2.5" /> {formatarData(prop.criado_em)}
            {prop.corretor && prop.corretor !== "Não Atribuído" && <><span>·</span><span className="font-black text-slate-500">{prop.corretor}</span></>}
          </p>
        </div>
      </div>

      {/* Badges tipo + origem */}
      <div className="flex items-center gap-1.5 pointer-events-none flex-wrap">
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${prop.tipo_anuncio === "Venda" ? "bg-emerald-50 text-emerald-600" : prop.tipo_anuncio === "Aluguel" ? "bg-violet-50 text-violet-600" : "bg-slate-100 text-slate-500"}`}>
          {prop.tipo_anuncio === "Venda" ? "🏡" : prop.tipo_anuncio === "Aluguel" ? "🔑" : "❓"} {prop.tipo_anuncio}
        </span>
        <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md uppercase tracking-widest">
          {prop.origem}
        </span>
      </div>

      {/* Título do imóvel */}
      {prop.titulo_imovel && (
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg pointer-events-none">
          <Home className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-600 truncate">{prop.titulo_imovel}</span>
        </div>
      )}

      {/* Preço + Localização */}
      {(prop.preco_anuncio || prop.localizacao) && (
        <div className="flex items-center gap-2 pointer-events-none flex-wrap">
          {prop.preco_anuncio && (
            <span className="font-black text-emerald-600 text-sm tracking-tight">{prop.preco_anuncio}</span>
          )}
          {prop.localizacao && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
              <MapPin className="w-2.5 h-2.5" /> {prop.localizacao}
            </span>
          )}
        </div>
      )}

      {/* Telefone */}
      {prop.telefone && (
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 pointer-events-none">
          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{prop.telefone}</span>
        </div>
      )}

      {/* Mover estágio — mini buttons */}
      <div className="flex gap-1.5 pt-1 border-t border-slate-100">
        {ESTAGIOS.filter(e => e.id !== prop.estagio).slice(0, 2).map(e => (
          <button key={e.id} onClick={() => onMove(prop.id, e.id)}
            className={`flex-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all hover:scale-105 ${e.badge}`}>
            {e.nome.replace(" ✓", "")}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Sub-componentes utilitários ─────────────────────────────────
function KpiChip({ label, value, color, icon }: { label: string; value: number; color: string; icon?: string }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <span className={`text-xl font-black ${color === "emerald" ? "text-emerald-600" : color === "sky" ? "text-sky-600" : color === "violet" ? "text-violet-600" : "text-slate-700"}`}>
        {icon} {value}
      </span>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight max-w-[70px]">{label}</span>
    </div>
  );
}

function FilterSelect({ icon, value, onChange, children }: {
  icon: React.ReactNode; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 shrink-0">
      {icon}
      <select value={value} onChange={e => onChange(e.target.value)}
        className="py-2.5 bg-transparent outline-none text-xs font-bold text-slate-600 cursor-pointer min-w-[130px]">
        {children}
      </select>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

// ================================================================
// INSTRUÇÕES DE INTEGRAÇÃO NO CRM PRINCIPAL
// ================================================================
//
// 1. Salve este arquivo em: src/components/CaptacaoView.tsx
//
// 2. No seu arquivo CRM principal, adicione o import:
//    import CaptacaoView from "@/components/CaptacaoView";
//
// 3. Nos estados de view, adicione:
//    const [activeView, setActiveView] = useState<'KANBAN'|'ANALYTICS'|'ARQUIVADOS'|'CAPTACAO'>('KANBAN');
//
// 4. No header, adicione o botão de navegação ao lado dos outros:
//    <button onClick={() => setActiveView('CAPTACAO')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'CAPTACAO' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
//      <Home className="w-3.5 h-3.5" /> Captação
//    </button>
//
// 5. No corpo do CRM, após o bloco ARQUIVADOS, adicione:
//    {activeView === 'CAPTACAO' && (
//      <div className="flex-1 min-h-0 flex flex-col w-full">
//        <CaptacaoView />
//      </div>
//    )}
//
// 6. Crie a rota da API em: src/app/api/admin/proprietarios/route.ts
//    (use o arquivo route.ts gerado junto com este)
//
// ================================================================