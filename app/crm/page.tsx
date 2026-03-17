"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Plus, DollarSign, User, Phone,
  MapPin, X, Trash2, CheckCircle, Clock, FileText,
  Calendar, Building, Mail, AlignLeft, CalendarDays, 
  TrendingUp, Sparkles, LayoutDashboard, BarChart4, Filter, Users, Tag, Target, Key, Edit2, PieChart, Search
} from "lucide-react";
import Link from "next/link";

export default function CRMImobiliaria() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<any>({ estagio: "LEAD", tipo_negocio: "Venda", corretor: "André" });
  
  const [activeView, setActiveView] = useState<'KANBAN' | 'ANALYTICS'>('KANBAN');

  const [buscaKanban, setBuscaKanban] = useState("");
  const [filtroCorretorKanban, setFiltroCorretorKanban] = useState("TODOS");
  const [filtroTipoKanban, setFiltroTipoKanban] = useState("TODOS");

  const [filtroMes, setFiltroMes] = useState("TODOS");
  const [filtroCorretor, setFiltroCorretor] = useState("TODOS");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  const corretores = ["André", "Anna", "Claudinei", "Jessica", "Luane"];

  const estagios = [
    { id: "LEAD", nome: "Novos Contatos", cor: "from-blue-500 to-blue-600", border: "border-blue-200", text: "text-blue-700", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700", icone: <User className="w-4 h-4 text-blue-500" /> },
    { id: "CONTATO", nome: "Em Atendimento", cor: "from-amber-400 to-amber-500", border: "border-amber-200", text: "text-amber-700", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700", icone: <Clock className="w-4 h-4 text-amber-500" /> },
    { id: "VISITA", nome: "Visita Agendada", cor: "from-violet-500 to-violet-600", border: "border-violet-200", text: "text-violet-700", bg: "bg-violet-50", badge: "bg-violet-100 text-violet-700", icone: <Calendar className="w-4 h-4 text-violet-500" /> },
    { id: "PROPOSTA", nome: "Proposta / Doc.", cor: "from-orange-500 to-orange-600", border: "border-orange-200", text: "text-orange-700", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700", icone: <FileText className="w-4 h-4 text-orange-500" /> },
    { id: "FECHADO", nome: "Negócio Fechado", cor: "from-emerald-500 to-emerald-600", border: "border-emerald-200", text: "text-emerald-700", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", icone: <CheckCircle className="w-4 h-4 text-emerald-600" /> },
  ];

  const carregarLeads = async () => {
    const res = await fetch("/api/admin/crm");
    const data = await res.json();
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => { carregarLeads(); }, []);

  const abrirModalNovo = () => {
    setIsEditing(false);
    setForm({ estagio: "LEAD", tipo_negocio: "Venda", corretor: "André" });
    setModal(true);
  };

  const abrirModalEditar = (lead: any) => {
    setIsEditing(true);
    setForm(lead);
    setModal(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/crm", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModal(false);
    setIsEditing(false);
    carregarLeads();
  };

  const moverLead = async (id: number, novoEstagio: string) => {
    setLeads(leads.map((l) => (l.id === id ? { ...l, estagio: novoEstagio } : l)));
    await fetch("/api/admin/crm", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estagio: novoEstagio }),
    });
  };

  const excluirLead = async (id: number) => {
    if (!confirm("Excluir esta negociação permanentemente?")) return;
    await fetch(`/api/admin/crm?id=${id}`, { method: "DELETE" });
    carregarLeads();
  };

  const leadsKanban = useMemo(() => {
    return leads.filter(l => {
      const matchBusca = buscaKanban === "" || 
        l.cliente_nome?.toLowerCase().includes(buscaKanban.toLowerCase()) || 
        l.telefone?.includes(buscaKanban) ||
        l.interesse?.toLowerCase().includes(buscaKanban.toLowerCase());
      const matchCorretor = filtroCorretorKanban === "TODOS" || l.corretor === filtroCorretorKanban;
      const matchTipo = filtroTipoKanban === "TODOS" || l.tipo_negocio === filtroTipoKanban;
      return matchBusca && matchCorretor && matchTipo;
    });
  }, [leads, buscaKanban, filtroCorretorKanban, filtroTipoKanban]);

  const valorPipeline = leadsKanban.filter((l) => l.estagio !== "FECHADO").reduce((acc, l) => acc + Number(l.valor_estimado), 0);

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set(leads.map(l => new Date(l.criado_em).toISOString().slice(0, 7)));
    return Array.from(meses).sort().reverse();
  }, [leads]);

  const leadsFiltrados = useMemo(() => {
    return leads.filter(l => {
      const dataStr = new Date(l.criado_em).toISOString().slice(0, 7);
      if (filtroMes !== "TODOS" && dataStr !== filtroMes) return false;
      if (filtroCorretor !== "TODOS" && l.corretor !== filtroCorretor) return false;
      if (filtroTipo !== "TODOS" && l.tipo_negocio !== filtroTipo) return false;
      return true;
    });
  }, [leads, filtroMes, filtroCorretor, filtroTipo]);

  const kpis = useMemo(() => {
    const total = leadsFiltrados.length;
    const fechados = leadsFiltrados.filter(l => l.estagio === "FECHADO");
    const abertos = leadsFiltrados.filter(l => l.estagio !== "FECHADO");
    const receitaTotal = fechados.reduce((acc, l) => acc + Number(l.valor_estimado), 0);
    const pipelineAberto = abertos.reduce((acc, l) => acc + Number(l.valor_estimado), 0);
    const conversao = total > 0 ? ((fechados.length / total) * 100).toFixed(1) : "0";
    const leadsVenda = leadsFiltrados.filter(l => l.tipo_negocio === 'Venda').length;
    const leadsAluguel = leadsFiltrados.filter(l => l.tipo_negocio === 'Aluguel').length;
    const percVenda = total > 0 ? Math.round((leadsVenda / total) * 100) : 0;
    const percAluguel = total > 0 ? Math.round((leadsAluguel / total) * 100) : 0;
    return { total, fechados: fechados.length, abertos: abertos.length, receitaTotal, pipelineAberto, conversao, percVenda, percAluguel };
  }, [leadsFiltrados]);

  const getIniciais = (nome: string) => {
    if (!nome) return "CL";
    const partes = nome.split(" ");
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return nome.substring(0, 2).toUpperCase();
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "";
    return new Date(dataStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  };

  const formatarMesAno = (dataStr: string) => {
    const [ano, mes] = dataStr.split("-");
    const mesesStr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${mesesStr[parseInt(mes)-1]} ${ano}`;
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mb-4" />
      <p className="font-black text-green-700 uppercase tracking-widest text-xs">Carregando Master CRM...</p>
    </div>
  );

  return (
    <>
      <style>{`
        /* ─── RESET TELA CHEIA ─── */
        body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }

        /* ─── SCROLLBARS ─── */
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .crm-kanban-wrapper {
          flex: 1;
          min-height: 0;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 20px 24px;
          background: #f8fafc;
        }
        .crm-kanban-wrapper::-webkit-scrollbar { height: 6px; }
        .crm-kanban-wrapper::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .crm-kanban-wrapper::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        .crm-board {
          display: flex;
          gap: 18px;
          width: max-content;
          height: 100%;
          align-items: flex-start;
          padding-right: 24px;
          padding-bottom: 4px;
        }

        .crm-col {
          width: 310px;
          min-width: 310px;
          max-width: 310px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          height: 100%;
          background: rgba(241, 245, 249, 0.85);
          border: 1px solid #e2e8f0;
          border-radius: 1.5rem;
          padding: 12px;
          overflow: hidden;
        }

        .crm-col-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 4px;
          padding-bottom: 16px;
        }
        .crm-col-body::-webkit-scrollbar { width: 4px; }
        .crm-col-body::-webkit-scrollbar-track { background: transparent; }
        .crm-col-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

        /* ─── MODAL ─── */
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ── CONTAINER PRINCIPAL — TELA CHEIA ── */}
      <div
        style={{ margin: 0, padding: 0 }}
        className="h-screen w-screen overflow-hidden bg-[#f8fafc] flex flex-col font-sans text-slate-800 fixed top-0 left-0 right-0 bottom-0 z-[9999]"
      >

        {/* ── HEADER ── */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 shadow-sm z-40 flex-wrap w-full">
          <div className="flex items-center gap-6">
            <Link href="/admin/imoveis" className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-500 hover:text-green-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-black text-2xl tracking-tight text-slate-900 leading-none flex items-center gap-2">
                Pipeline <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">CRM</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Gestão & Relatórios</p>
            </div>

            {/* Toggle de view */}
            <div className="hidden md:flex ml-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveView('KANBAN')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'KANBAN' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Kanban
              </button>
              <button
                onClick={() => setActiveView('ANALYTICS')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'ANALYTICS' ? 'bg-[#0f2e20] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <BarChart4 className="w-3.5 h-3.5" /> Analytics
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="hidden lg:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
              <div className="p-1.5 bg-blue-100 rounded-lg"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none mb-0.5">Em Negociação</p>
                <p className="font-black text-sm text-slate-800 leading-none">R$ {valorPipeline.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</p>
              </div>
            </div>
            <button onClick={abrirModalNovo} className="flex items-center gap-2 bg-[#0f2e20] hover:bg-green-800 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-900/20 transition-all active:scale-95 whitespace-nowrap">
              <Plus className="w-4 h-4" strokeWidth={3} /> Novo Lead
            </button>
          </div>
        </header>

        {/* ── KANBAN VIEW ── */}
        {activeView === 'KANBAN' && (
          <div className="flex-1 min-h-0 flex flex-col w-full">

            {/* Barra de filtros */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 z-30 w-full">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar lead por nome, fone, imóvel..."
                  value={buscaKanban}
                  onChange={e => setBuscaKanban(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
                {buscaKanban && (
                  <button onClick={() => setBuscaKanban('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 flex-shrink-0">
                  <Key className="w-3.5 h-3.5 text-emerald-500" />
                  <select value={filtroCorretorKanban} onChange={e => setFiltroCorretorKanban(e.target.value)} className="py-2.5 bg-transparent outline-none text-xs font-bold text-slate-600 cursor-pointer min-w-[140px]">
                    <option value="TODOS">Todos Corretores</option>
                    {corretores.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 flex-shrink-0">
                  <Tag className="w-3.5 h-3.5 text-blue-500" />
                  <select value={filtroTipoKanban} onChange={e => setFiltroTipoKanban(e.target.value)} className="py-2.5 bg-transparent outline-none text-xs font-bold text-slate-600 cursor-pointer min-w-[130px]">
                    <option value="TODOS">Venda & Aluguel</option>
                    <option value="Venda">Apenas Venda</option>
                    <option value="Aluguel">Apenas Aluguel</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── KANBAN BOARD ── */}
            <main className="crm-kanban-wrapper custom-scrollbar w-full">
              <div className="crm-board">
                {estagios.map((coluna) => {
                  const leadsDaColuna = leadsKanban.filter((l) => l.estagio === coluna.id);
                  const valorFase = leadsDaColuna.reduce((acc, l) => acc + Number(l.valor_estimado), 0);

                  return (
                    <div className="crm-col" key={coluna.id}>

                      {/* Faixa colorida topo */}
                      <div className={`h-1.5 w-full flex-shrink-0 rounded-full bg-gradient-to-r ${coluna.cor} mb-3 opacity-80`} />

                      {/* Cabeçalho da coluna */}
                      <div className="px-2 pb-3 flex-shrink-0 flex items-center justify-between border-b border-slate-200/60 mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${coluna.bg} shadow-sm`}>{coluna.icone}</div>
                          <div>
                            <span className={`font-black text-[11px] uppercase tracking-wider ${coluna.text} block leading-tight`}>{coluna.nome}</span>
                            <span className="text-[10px] font-bold text-slate-400">R$ {valorFase.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${coluna.badge}`}>{leadsDaColuna.length}</span>
                      </div>

                      {/* Cards — scroll interno */}
                      <div className="crm-col-body custom-scrollbar">
                        {leadsDaColuna.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 bg-white/60 rounded-xl gap-2 mt-1">
                            <AlignLeft className="w-4 h-4 text-slate-300" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum Lead aqui</p>
                          </div>
                        )}

                        {leadsDaColuna.map((lead) => (
                          <div
                            key={lead.id}
                            className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group relative flex flex-col gap-3 flex-shrink-0"
                          >
                            {/* Ações hover */}
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => abrirModalEditar(lead)} className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:text-blue-700 hover:bg-blue-100 transition-all" title="Editar">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => excluirLead(lead.id)} className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition-all" title="Excluir">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Avatar + nome */}
                            <div className="flex items-center gap-3 pr-14">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 border-2 border-white shadow-sm ${coluna.bg} ${coluna.text}`}>
                                {getIniciais(lead.cliente_nome)}
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-bold text-slate-800 text-sm leading-tight truncate">{lead.cliente_nome}</p>
                                <div className="flex items-center gap-1.5 mt-1 text-[9px] font-semibold text-slate-400">
                                  <span className="font-black uppercase tracking-widest text-slate-500">{lead.corretor}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5" />{formatarData(lead.criado_em)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Telefone */}
                            {(lead.telefone || lead.email) && (
                              <div className="flex flex-col gap-1.5">
                                {lead.telefone && (
                                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                                    <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{lead.telefone}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tipo + interesse */}
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex-shrink-0 ${lead.tipo_negocio === 'Venda' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'}`}>
                                {lead.tipo_negocio}
                              </span>
                              {lead.interesse && (
                                <span className="text-[10px] font-semibold text-slate-500 truncate">{lead.interesse}</span>
                              )}
                            </div>

                            {/* Valor */}
                            {Number(lead.valor_estimado) > 0 && (
                              <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Potencial</span>
                                <span className="font-black text-emerald-600 text-sm tracking-tight">R$ {Number(lead.valor_estimado).toLocaleString("pt-BR")}</span>
                              </div>
                            )}

                            {/* Mover estágio */}
                            <div className="border-t border-slate-100 pt-2">
                              <select
                                value={lead.estagio}
                                onChange={(e) => moverLead(lead.id, e.target.value)}
                                className={`w-full px-2 py-1.5 rounded-lg border-2 text-[10px] uppercase tracking-widest font-black outline-none cursor-pointer transition-colors ${coluna.bg} ${coluna.text} ${coluna.border}`}
                              >
                                {estagios.map((est) => (
                                  <option key={est.id} value={est.id} className="bg-white text-slate-800">
                                    Mover: {est.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>
          </div>
        )}

        {/* ── ANALYTICS VIEW ── */}
        {activeView === 'ANALYTICS' && (
          <main className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar bg-slate-50/50 w-full">
            <div className="max-w-7xl mx-auto space-y-8">

              {/* Filtros */}
              <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 text-slate-700 font-black uppercase tracking-widest text-xs">
                  <Filter className="w-5 h-5 text-emerald-600" /> Filtros do Relatório
                </div>
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                  <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 min-w-[140px] cursor-pointer">
                    <option value="TODOS">Todo o Período</option>
                    {mesesDisponiveis.map(m => <option key={m} value={m}>{formatarMesAno(m)}</option>)}
                  </select>
                  <select value={filtroCorretor} onChange={e => setFiltroCorretor(e.target.value)} className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 min-w-[140px] cursor-pointer">
                    <option value="TODOS">Todos os Corretores</option>
                    {corretores.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 min-w-[140px] cursor-pointer">
                    <option value="TODOS">Venda & Aluguel</option>
                    <option value="Venda">Apenas Vendas</option>
                    <option value="Aluguel">Apenas Aluguéis</option>
                  </select>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#0f2e20] p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-white">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-3 bg-white/10 text-emerald-400 rounded-xl"><CheckCircle className="w-5 h-5" /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Receita Fechada</p>
                  </div>
                  <p className="text-3xl font-black relative z-10">R$ {kpis.receitaTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-2">{kpis.fechados} Negócios Concluídos</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full blur-2xl" />
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pipeline Aberto</p>
                  </div>
                  <p className="text-2xl font-black text-slate-800 relative z-10">R$ {kpis.pipelineAberto.toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-2">{kpis.abertos} Em negociação</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full blur-2xl" />
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Target className="w-5 h-5" /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taxa de Conversão</p>
                  </div>
                  <p className="text-2xl font-black text-slate-800 relative z-10">{kpis.conversao}%</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{kpis.total} Leads Recebidos</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-xl"><PieChart className="w-5 h-5" /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Origem dos Negócios</p>
                  </div>
                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex mb-2">
                    <div className="bg-blue-500 h-full transition-all" style={{ width: `${kpis.percVenda}%` }} />
                    <div className="bg-violet-500 h-full transition-all" style={{ width: `${kpis.percAluguel}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-blue-600">{kpis.percVenda}% Venda</span>
                    <span className="text-violet-600">{kpis.percAluguel}% Aluguel</span>
                  </div>
                </div>
              </div>

              {/* Funil + Ranking */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 mb-6">Funil de Leads</h3>
                  <div className="space-y-5">
                    {estagios.map((est) => {
                      const leadsNaFase = leadsFiltrados.filter(l => l.estagio === est.id).length;
                      const maxLeads = Math.max(...estagios.map(e => leadsFiltrados.filter(l => l.estagio === e.id).length), 1);
                      const percent = (leadsNaFase / maxLeads) * 100;
                      return (
                        <div key={est.id}>
                          <div className="flex justify-between items-end mb-1.5">
                            <span className={`font-black text-[10px] uppercase tracking-widest ${est.text}`}>{est.nome}</span>
                            <span className="font-bold text-slate-500 text-xs">{leadsNaFase}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full bg-gradient-to-r ${est.cor} transition-all duration-1000`} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-1 lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Ranking por Corretor</h3>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                        <tr>
                          <th className="px-6 py-4">Corretor</th>
                          <th className="px-6 py-4">Total Leads</th>
                          <th className="px-6 py-4">Fechados</th>
                          <th className="px-6 py-4">Conversão</th>
                          <th className="px-6 py-4 text-right">Receita Gerada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {corretores.map(corretor => {
                          const leadsCorretor = leadsFiltrados.filter(l => l.corretor === corretor);
                          if (leadsCorretor.length === 0) return null;
                          const fechados = leadsCorretor.filter(l => l.estagio === 'FECHADO');
                          const receita = fechados.reduce((acc, l) => acc + Number(l.valor_estimado), 0);
                          const conversao = Math.round((fechados.length / leadsCorretor.length) * 100);
                          return (
                            <tr key={corretor} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-black text-slate-800">{corretor}</td>
                              <td className="px-6 py-4 font-bold text-slate-500">{leadsCorretor.length}</td>
                              <td className="px-6 py-4 font-bold text-emerald-600">{fechados.length}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-full bg-slate-100 rounded-full h-2 max-w-[60px]">
                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${conversao}%` }} />
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-500">{conversao}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-black text-slate-800 text-right">R$ {receita.toLocaleString('pt-BR')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ── MODAL NOVO / EDITAR LEAD ── */}
        {modal && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setModal(false)}
          >
            <form
              onSubmit={handleSalvar}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
              style={{ animation: "modalIn .25s cubic-bezier(.34,1.56,.64,1)" }}
            >
              {/* Header modal */}
              <div className="bg-[#0f2e20] px-8 py-6 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Building className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">
                      {isEditing ? "Editar Lead" : "Cadastrar Novo Lead"}
                    </h3>
                    <p className="text-[10px] text-green-300/60 font-semibold uppercase tracking-widest mt-0.5">
                      {isEditing ? "Atualize os dados" : "Adicione ao Pipeline"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="p-2 bg-white/10 hover:bg-red-500 rounded-full text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-8 overflow-y-auto flex-1 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome do Cliente *</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-green-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input type="text" placeholder="Nome Completo" required
                        value={form.cliente_nome || ""}
                        className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700"
                        onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telefone / WhatsApp</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-green-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input type="text" placeholder="(42) 99999-9999"
                        value={form.telefone || ""}
                        className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700"
                        onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">E-mail</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-green-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input type="email" placeholder="cliente@email.com"
                        value={form.email || ""}
                        className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700"
                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Imóvel de Interesse</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-green-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input type="text" placeholder="Cód REF-1234 ou descrição do imóvel"
                        value={form.interesse || ""}
                        className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700"
                        onChange={(e) => setForm({ ...form, interesse: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo de Negócio</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-green-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <select
                        value={form.tipo_negocio || "Venda"}
                        className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700 cursor-pointer"
                        onChange={(e) => setForm({ ...form, tipo_negocio: e.target.value })}
                      >
                        <option value="Venda">Venda</option>
                        <option value="Aluguel">Aluguel</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Corretor Responsável</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-green-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Key className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <select
                        value={form.corretor || "André"}
                        className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700 cursor-pointer"
                        onChange={(e) => setForm({ ...form, corretor: e.target.value })}
                      >
                        {corretores.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Orçamento Estimado (R$)</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-green-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <input type="number" step="0.01" placeholder="0,00"
                        value={form.valor_estimado || ""}
                        className="w-full py-3 bg-transparent outline-none font-black text-emerald-600 text-lg"
                        onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observações</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-green-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <AlignLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input type="text" placeholder="Detalhes rápidos..."
                        value={form.observacoes || ""}
                        className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700"
                        onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 bg-white border-2 border-slate-200 hover:bg-slate-100 text-slate-500 font-black py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-all">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-[2] bg-[#0f2e20] hover:bg-green-800 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">
                  {isEditing ? "Salvar Alterações" : "Salvar Lead no Pipeline"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}