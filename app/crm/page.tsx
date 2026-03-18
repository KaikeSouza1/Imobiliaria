"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft, Plus, DollarSign, User, Phone,
  X, Trash2, CheckCircle, Clock, FileText,
  Calendar, Building, AlignLeft, CalendarDays, 
  TrendingUp, LayoutDashboard, Filter, Users,
  Tag, Target, Key, Edit2, Search, Globe, ChevronDown, Award, Activity, Archive, RefreshCcw, Home
} from "lucide-react";
import Link from "next/link";

interface Estagio {
  id: string;
  nome: string;
  cor: string;
  border: string;
  text: string;
  bg: string;
  badge: string;
  icone: React.ReactNode;
}

interface KPIGroup {
  total: number;
  fechados: number;
  abertos: number;
  receita: number;
  pipeline: number;
  ticket: number;
  conversao: string;
  origensRanking: { nome: string; count: number; perc: number }[];
  leadsList: any[];
}

interface DashboardKPIs {
  geral: KPIGroup;
  venda: KPIGroup;
  aluguel: KPIGroup;
}

const fotosCorretores: Record<string, string> = {
  "André": "/foto andre.jpeg",
  "Anna": "/foto anna.jpeg",
  "Claudinei": "/foto claudinei.jpg",
  "Jessica": "/foto jessica.jpeg",
  "Luane": "/foto luane.jpeg"
};

const categoriasDeImoveis = [
  "Indefinido",
  "Apartamento",
  "Casa",
  "Kitnet",
  "Terreno",
  "Comercial",
  "Sítio / Chácara",
  "Galpão",
  "Sobrado"
];

export default function CRMImobiliaria() {
  const [leads, setLeads] = useState<any[]>([]);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [form, setForm] = useState<any>({ estagio: "LEAD", tipo_negocio: "Venda", corretor: "André", origem: "WhatsApp", categoria_imovel: "Indefinido" });
  
  const [showImoveisList, setShowImoveisList] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'KANBAN' | 'ANALYTICS' | 'ARQUIVADOS'>('KANBAN');
  
  const [analyticsTab, setAnalyticsTab] = useState<'GERAL' | 'Venda' | 'Aluguel'>('GERAL');

  const [buscaKanban, setBuscaKanban] = useState<string>("");
  const [filtroCorretorKanban, setFiltroCorretorKanban] = useState<string>("TODOS");
  const [filtroTipoKanban, setFiltroTipoKanban] = useState<string>("TODOS");

  const [filtroMes, setFiltroMes] = useState<string>("TODOS");
  const [filtroCorretor, setFiltroCorretor] = useState<string>("TODOS");
  
  const [filtroCategoriaArquivado, setFiltroCategoriaArquivado] = useState<string>("TODOS");
  const [buscaArquivados, setBuscaArquivados] = useState<string>("");

  // ESTADOS DO DRAG AND DROP
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  const corretores: string[] = ["André", "Anna", "Claudinei", "Jessica", "Luane"];

  const estagios: Estagio[] = [
    { id: "LEAD", nome: "Novos Contatos", cor: "from-blue-500 to-blue-600", border: "border-blue-200", text: "text-blue-700", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700", icone: <User className="w-4 h-4 text-blue-500" /> },
    { id: "CONTATO", nome: "Em Atendimento", cor: "from-amber-400 to-amber-500", border: "border-amber-200", text: "text-amber-700", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700", icone: <Clock className="w-4 h-4 text-amber-500" /> },
    { id: "VISITA", nome: "Visita Agendada", cor: "from-violet-500 to-violet-600", border: "border-violet-200", text: "text-violet-700", bg: "bg-violet-50", badge: "bg-violet-100 text-violet-700", icone: <Calendar className="w-4 h-4 text-violet-500" /> },
    { id: "PROPOSTA", nome: "Proposta / Doc.", cor: "from-orange-500 to-orange-600", border: "border-orange-200", text: "text-orange-700", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700", icone: <FileText className="w-4 h-4 text-orange-500" /> },
    { id: "FECHADO", nome: "Negócio Fechado", cor: "from-emerald-500 to-emerald-600", border: "border-emerald-200", text: "text-emerald-700", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", icone: <CheckCircle className="w-4 h-4 text-emerald-600" /> },
  ];

  const carregarDados = async () => {
    try {
      const [resLeads, resImoveis] = await Promise.all([ fetch("/api/admin/crm"), fetch("/api/imoveis") ]);
      setLeads((await resLeads.json()) as any[]);
      setImoveis((await resImoveis.json()) as any[]);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const carregarLeads = async () => {
    const res = await fetch("/api/admin/crm");
    setLeads((await res.json()) as any[]);
  };

  useEffect(() => { carregarDados(); }, []);

  const abrirModalNovo = () => { setIsEditing(false); setForm({ estagio: "LEAD", tipo_negocio: "Venda", corretor: "André", origem: "WhatsApp", interesse: "", categoria_imovel: "Indefinido" }); setModal(true); setShowImoveisList(false); };
  const abrirModalEditar = (lead: any) => { setIsEditing(true); setForm(lead); setModal(true); setShowImoveisList(false); };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/crm", { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setModal(false); setIsEditing(false); carregarLeads();
  };

  const moverLead = async (id: number, novoEstagio: string) => {
    setLeads(leads.map((l) => (l.id === id ? { ...l, estagio: novoEstagio } : l)));
    await fetch("/api/admin/crm", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, estagio: novoEstagio }) });
  };

  const excluirLead = async (id: number) => {
    if (!confirm("Excluir esta negociação permanentemente?")) return;
    await fetch(`/api/admin/crm?id=${id}`, { method: "DELETE" });
    carregarLeads();
  };

  // ----- FUNÇÕES DO DRAG AND DROP -----
  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = "move";
    // É necessário settar dataTransfer para o Firefox funcionar o drag and drop
    e.dataTransfer.setData("text/plain", leadId.toString()); 
    
    // Pequeno truque para o card ficar semi-transparente enquanto arrasta
    setTimeout(() => {
      const element = document.getElementById(`lead-${leadId}`);
      if (element) element.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, leadId: number) => {
    setDraggedLeadId(null);
    setDraggedOverCol(null);
    const element = document.getElementById(`lead-${leadId}`);
    if (element) element.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); // Necessário para permitir o drop
    e.dataTransfer.dropEffect = "move";
    if (draggedOverCol !== colId) {
      setDraggedOverCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const leadId = draggedLeadId;
    
    if (leadId) {
      // Pega o lead atual para ver se realmente mudou de coluna
      const leadAnterior = leads.find(l => l.id === leadId);
      if (leadAnterior && leadAnterior.estagio !== colId) {
        moverLead(leadId, colId);
      }
    }
    
    setDraggedLeadId(null);
  };
  // ------------------------------------

  const leadsKanban = useMemo(() => {
    return leads.filter((l: any) => {
      if (l.estagio === 'ARQUIVADO') return false;
      const matchBusca = buscaKanban === "" || (l.cliente_nome || "").toLowerCase().includes(buscaKanban.toLowerCase()) || (l.telefone || "").includes(buscaKanban) || (l.interesse || "").toLowerCase().includes(buscaKanban.toLowerCase());
      const matchCorretor = filtroCorretorKanban === "TODOS" || l.corretor === filtroCorretorKanban;
      const matchTipo = filtroTipoKanban === "TODOS" || l.tipo_negocio === filtroTipoKanban;
      return matchBusca && matchCorretor && matchTipo;
    });
  }, [leads, buscaKanban, filtroCorretorKanban, filtroTipoKanban]);

  const leadsArquivadosList = useMemo(() => {
    return leads.filter((l: any) => {
      if (l.estagio !== 'ARQUIVADO') return false;
      const matchBusca = buscaArquivados === "" || (l.cliente_nome || "").toLowerCase().includes(buscaArquivados.toLowerCase()) || (l.interesse || "").toLowerCase().includes(buscaArquivados.toLowerCase());
      const matchCategoria = filtroCategoriaArquivado === "TODOS" || l.categoria_imovel === filtroCategoriaArquivado;
      return matchBusca && matchCategoria;
    });
  }, [leads, buscaArquivados, filtroCategoriaArquivado]);

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set(leads.map((l: any) => new Date(l.criado_em).toISOString().slice(0, 7)));
    return Array.from(meses).sort().reverse();
  }, [leads]);

  const kpis: DashboardKPIs = useMemo(() => {
    const baseLeads = leads.filter((l: any) => {
      if (l.estagio === 'ARQUIVADO') return false;
      const dataStr = new Date(l.criado_em).toISOString().slice(0, 7);
      if (filtroMes !== "TODOS" && dataStr !== filtroMes) return false;
      if (filtroCorretor !== "TODOS" && l.corretor !== filtroCorretor) return false;
      return true;
    });

    const calcGroup = (list: any[]): KPIGroup => {
      const fechados = list.filter((l: any) => l.estagio === "FECHADO");
      const abertos = list.filter((l: any) => l.estagio !== "FECHADO");
      
      const receita = fechados.reduce((acc: number, l: any) => acc + Number(l.valor_estimado || 0), 0);
      const pipeline = abertos.reduce((acc: number, l: any) => acc + Number(l.valor_estimado || 0), 0);
      const ticket = fechados.length > 0 ? (receita / fechados.length) : 0;
      const conversao = list.length > 0 ? ((fechados.length / list.length) * 100).toFixed(1) : "0";

      const origensMap = list.reduce((acc: Record<string, number>, l: any) => {
        const o = l.origem || 'Outros';
        acc[o] = (acc[o] || 0) + 1;
        return acc;
      }, {});
      const origensRanking = Object.entries(origensMap)
        .map(([nome, count]) => ({ nome, count, perc: Math.round((Number(count) / list.length) * 100) }))
        .sort((a, b) => Number(b.count) - Number(a.count));

      return { total: list.length, fechados: fechados.length, abertos: abertos.length, receita, pipeline, ticket, conversao, origensRanking, leadsList: list };
    };

    return {
      geral: calcGroup(baseLeads),
      venda: calcGroup(baseLeads.filter(l => l.tipo_negocio === 'Venda')),
      aluguel: calcGroup(baseLeads.filter(l => l.tipo_negocio === 'Aluguel'))
    };
  }, [leads, filtroMes, filtroCorretor]);

  const activeGroup = analyticsTab === 'GERAL' ? kpis.geral : (analyticsTab === 'Venda' ? kpis.venda : kpis.aluguel);
  const theme = analyticsTab === 'Venda' ? 'emerald' : (analyticsTab === 'Aluguel' ? 'violet' : 'blue');

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
    if (!dataStr) return "";
    const partes = dataStr.split("-");
    if(partes.length < 2) return dataStr;
    const [ano, mes] = partes;
    const mesesStr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${mesesStr[parseInt(mes)-1]} ${ano}`;
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
      <p className="font-black text-emerald-700 uppercase tracking-widest text-xs">Carregando Master CRM...</p>
    </div>
  );

  return (
    <>
      <style>{`
        body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .crm-kanban-wrapper { flex: 1; min-height: 0; overflow-x: auto; overflow-y: hidden; padding: 20px 24px; background: #f8fafc; }
        .crm-board { display: flex; gap: 18px; width: max-content; height: 100%; align-items: flex-start; padding-right: 24px; padding-bottom: 4px; }
        .crm-col { width: 310px; min-width: 310px; max-width: 310px; flex-shrink: 0; display: flex; flex-direction: column; height: 100%; border: 1px solid #e2e8f0; border-radius: 1.5rem; padding: 12px; overflow: hidden; transition: all 0.2s ease; }
        .crm-col-body { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px; padding-bottom: 16px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-100 { animation-delay: 100ms; } .delay-200 { animation-delay: 200ms; } .delay-300 { animation-delay: 300ms; }
        @keyframes modalIn { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div style={{ margin: 0, padding: 0 }} className="h-screen w-screen overflow-hidden bg-[#f8fafc] flex flex-col font-sans text-slate-800 fixed top-0 left-0 right-0 bottom-0 z-[9999]">
        
        {/* HEADER GERAL */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 shadow-sm z-40 flex-wrap w-full">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/admin/imoveis" className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-500 hover:text-emerald-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            {/* --- COMEÇO DA LOGO DA IMOBILIÁRIA --- */}
            <div className="hidden sm:flex items-center gap-3 pr-4 md:pr-6 border-r border-slate-200">
              <img src="/logo_nova.png" alt="Porto Iguaçu" className="h-10 w-auto object-contain drop-shadow-sm" />
              <div className="flex flex-col">
                <span className="font-black text-[12px] uppercase tracking-widest text-slate-800 leading-none mb-0.5">Porto Iguaçu</span>
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Imobiliária</span>
              </div>
            </div>
            {/* --- FIM DA LOGO --- */}

            <div>
              <h1 className="font-black text-xl md:text-2xl tracking-tight text-slate-900 leading-none flex items-center gap-2">
                Pipeline <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">CRM</span>
              </h1>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Inteligência Comercial</p>
            </div>

            <div className="hidden lg:flex ml-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner overflow-x-auto">
              <button onClick={() => setActiveView('KANBAN')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'KANBAN' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <LayoutDashboard className="w-3.5 h-3.5" /> Kanban
              </button>
              <button onClick={() => setActiveView('ANALYTICS')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'ANALYTICS' ? 'bg-[#0f2e20] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                <Activity className="w-3.5 h-3.5" /> Analytics
              </button>
              <button onClick={() => setActiveView('ARQUIVADOS')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'ARQUIVADOS' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                <Archive className="w-3.5 h-3.5" /> Arquivados
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={abrirModalNovo} className="flex items-center gap-2 bg-[#0f2e20] hover:bg-emerald-900 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-95 whitespace-nowrap">
              <Plus className="w-4 h-4" strokeWidth={3} /> <span className="hidden sm:inline">Novo Lead</span>
            </button>
          </div>
        </header>

        {/* ── VISÃO KANBAN ── */}
        {activeView === 'KANBAN' && (
          <div className="flex-1 min-h-0 flex flex-col w-full">
            <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 z-30 w-full">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Buscar lead por nome, fone, imóvel..." value={buscaKanban} onChange={e => setBuscaKanban(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all" />
                {buscaKanban && <button onClick={() => setBuscaKanban('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>}
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 flex-shrink-0">
                  <Key className="w-3.5 h-3.5 text-emerald-500" />
                  <select value={filtroCorretorKanban} onChange={e => setFiltroCorretorKanban(e.target.value)} className="py-2.5 bg-transparent outline-none text-xs font-bold text-slate-600 cursor-pointer min-w-[140px]">
                    <option value="TODOS">Todos Corretores</option>
                    {corretores.map((c: string) => <option key={c} value={c}>{c}</option>)}
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

            <main className="crm-kanban-wrapper custom-scrollbar w-full">
              <div className="crm-board">
                {estagios.map((coluna: Estagio) => {
                  const leadsDaColuna = leadsKanban.filter((l: any) => l.estagio === coluna.id);
                  const valorFase = leadsDaColuna.reduce((acc: number, l: any) => acc + Number(l.valor_estimado || 0), 0);
                  
                  const isHovered = draggedOverCol === coluna.id;

                  return (
                    <div 
                      className={`crm-col ${isHovered ? 'bg-emerald-50/70 border-emerald-400 scale-[1.01] shadow-xl' : 'bg-[rgba(241,245,249,0.85)]'}`} 
                      key={coluna.id}
                      onDragOver={(e) => handleDragOver(e, coluna.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, coluna.id)}
                    >
                      <div className={`h-1.5 w-full flex-shrink-0 rounded-full bg-gradient-to-r ${coluna.cor} mb-3 ${isHovered ? 'opacity-100' : 'opacity-80'}`} />
                      <div className="px-2 pb-3 flex-shrink-0 flex items-center justify-between border-b border-slate-200/60 mb-1 pointer-events-none">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${coluna.bg} shadow-sm`}>{coluna.icone}</div>
                          <div>
                            <span className={`font-black text-[11px] uppercase tracking-wider ${coluna.text} block leading-tight`}>{coluna.nome}</span>
                            <span className="text-[10px] font-bold text-slate-400">R$ {valorFase.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${coluna.badge}`}>{leadsDaColuna.length}</span>
                      </div>

                      <div className="crm-col-body custom-scrollbar">
                        {leadsDaColuna.length === 0 && (
                          <div className={`flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-xl gap-2 mt-1 pointer-events-none transition-colors ${isHovered ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white/60'}`}>
                            <AlignLeft className={`w-4 h-4 ${isHovered ? 'text-emerald-400' : 'text-slate-300'}`} />
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isHovered ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {isHovered ? 'Solte aqui!' : 'Nenhum Lead'}
                            </p>
                          </div>
                        )}

                        {leadsDaColuna.map((lead: any) => (
                          <div 
                            key={lead.id} 
                            id={`lead-${lead.id}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            onDragEnd={(e) => handleDragEnd(e, lead.id)}
                            className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group relative flex flex-col gap-3 flex-shrink-0 cursor-grab active:cursor-grabbing"
                          >
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/80 p-1 rounded-lg backdrop-blur-sm">
                              <button onClick={() => moverLead(lead.id, 'ARQUIVADO')} title="Arquivar Lead" className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all"><Archive className="w-3.5 h-3.5" /></button>
                              <button onClick={() => abrirModalEditar(lead)} title="Editar" className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:text-blue-700 hover:bg-blue-100 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => excluirLead(lead.id)} title="Excluir" className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>

                            <div className="flex items-center gap-3 pr-20 pointer-events-none">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 border-2 border-white shadow-sm ${coluna.bg} ${coluna.text}`}>
                                {getIniciais(lead.cliente_nome)}
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-bold text-slate-800 text-sm leading-tight truncate">{lead.cliente_nome}</p>
                                <div className="flex items-center gap-1.5 mt-1 text-[9px] font-semibold text-slate-400">
                                  {fotosCorretores[lead.corretor] && (
                                    <img src={fotosCorretores[lead.corretor]} alt={lead.corretor} className="w-3.5 h-3.5 rounded-full object-cover border border-slate-200" />
                                  )}
                                  <span className="font-black uppercase tracking-widest text-slate-500">{lead.corretor}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5" />{formatarData(lead.criado_em)}</span>
                                </div>
                              </div>
                            </div>

                            {(lead.telefone || lead.email) && (
                              <div className="flex flex-col gap-1.5 pointer-events-none">
                                {lead.telefone && (
                                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                                    <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{lead.telefone}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex flex-col gap-2 pointer-events-none">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex-shrink-0 ${lead.tipo_negocio === 'Venda' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'}`}>
                                  {lead.tipo_negocio}
                                </span>
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex-shrink-0 bg-slate-100 text-slate-500 border border-slate-200/60">
                                  <Home className="w-3 h-3 text-slate-400" /> {lead.categoria_imovel || 'Indefinido'}
                                </span>
                              </div>
                              {lead.interesse && (
                                <div className="text-[10px] font-semibold text-slate-600 truncate flex items-center gap-1.5 bg-slate-50/50 border border-slate-100 px-2.5 py-1.5 rounded-lg w-full">
                                  <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"/> 
                                  <span className="truncate block w-full">{lead.interesse}</span>
                                </div>
                              )}
                            </div>

                            {Number(lead.valor_estimado || 0) > 0 && (
                              <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1 pointer-events-none">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Potencial</span>
                                <span className="font-black text-emerald-600 text-sm tracking-tight">R$ {Number(lead.valor_estimado).toLocaleString("pt-BR")}</span>
                              </div>
                            )}
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

        {/* ── VISÃO ARQUIVADOS ── */}
        {activeView === 'ARQUIVADOS' && (
          <div className="flex-1 min-h-0 flex flex-col w-full bg-slate-50/50">
            <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-30 w-full shadow-sm">
              <div className="relative w-full md:w-1/3">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Buscar arquivados por nome, imóvel..." value={buscaArquivados} onChange={e => setBuscaArquivados(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-slate-400 focus:bg-white transition-all" />
                {buscaArquivados && <button onClick={() => setBuscaArquivados('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>}
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 flex-shrink-0">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoria:</span>
                  <select value={filtroCategoriaArquivado} onChange={e => setFiltroCategoriaArquivado(e.target.value)} className="py-2.5 bg-transparent outline-none text-xs font-bold text-slate-600 cursor-pointer min-w-[140px]">
                    <option value="TODOS">Todas</option>
                    {categoriasDeImoveis.map((c: string) => c !== 'Indefinido' && <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
               {leadsArquivadosList.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Archive className="w-8 h-8 text-slate-300" /></div>
                   <h2 className="text-xl font-black text-slate-700">Nenhum Lead Arquivado</h2>
                   <p className="text-sm text-slate-400 mt-2 max-w-md">Os leads que você arquivar no Kanban aparecerão aqui. Você pode resgatá-los no futuro quando surgir uma oportunidade.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   {leadsArquivadosList.map((lead: any) => (
                      <div key={lead.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 opacity-90 hover:opacity-100">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 bg-slate-100 text-slate-500 border-2 border-slate-200">
                              {getIniciais(lead.cliente_nome)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{lead.cliente_nome}</p>
                              <p className="text-[10px] font-semibold text-slate-400">{formatarData(lead.criado_em)}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            {lead.categoria_imovel}
                          </span>
                        </div>

                        {lead.telefone && (
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-2 mt-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {lead.telefone}
                          </div>
                        )}

                        {lead.interesse && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-2 mt-1">
                            <Building className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{lead.interesse}</span>
                          </div>
                        )}

                        <div className="mt-auto pt-4 flex gap-2">
                          <button onClick={() => moverLead(lead.id, 'LEAD')} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                            <RefreshCcw className="w-3.5 h-3.5" /> Restaurar
                          </button>
                          <button onClick={() => excluirLead(lead.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                   ))}
                 </div>
               )}
            </main>
          </div>
        )}

        {/* ── VISÃO ANALYTICS ── */}
        {activeView === 'ANALYTICS' && (
           <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-slate-50 w-full relative">
            <div className={`absolute top-0 left-0 w-full h-80 bg-gradient-to-b pointer-events-none transition-colors duration-700 ${
              analyticsTab === 'Venda' ? 'from-emerald-200/40' : (analyticsTab === 'Aluguel' ? 'from-violet-200/40' : 'from-blue-200/40')
            } to-transparent`} />
            
            <div className="max-w-7xl mx-auto space-y-8 relative z-10" key={analyticsTab}>

             <div className="animate-fade-up bg-white p-3 lg:p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between">
               <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto custom-scrollbar">
                  <button onClick={() => setAnalyticsTab('GERAL')} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${analyticsTab === 'GERAL' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Globe className="w-4 h-4" /> Visão Global
                  </button>
                  <button onClick={() => setAnalyticsTab('Venda')} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${analyticsTab === 'Venda' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-slate-500 hover:text-slate-700'}`}>
                    <DollarSign className="w-4 h-4" /> Performance Vendas
                  </button>
                  <button onClick={() => setAnalyticsTab('Aluguel')} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${analyticsTab === 'Aluguel' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Key className="w-4 h-4" /> Performance Locação
                  </button>
               </div>
               
               <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                 <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-1.5 w-full md:w-auto">
                   <Calendar className="w-4 h-4 text-slate-400" />
                   <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="bg-transparent py-2 w-full text-xs font-bold text-slate-700 outline-none cursor-pointer">
                     <option value="TODOS">Todo o Período</option>
                     {mesesDisponiveis.map((m: string) => <option key={m} value={m}>{formatarMesAno(m)}</option>)}
                   </select>
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-1.5 w-full md:w-auto">
                   <Users className="w-4 h-4 text-slate-400" />
                   <select value={filtroCorretor} onChange={e => setFiltroCorretor(e.target.value)} className="bg-transparent py-2 w-full text-xs font-bold text-slate-700 outline-none cursor-pointer">
                     <option value="TODOS">Todos os Corretores</option>
                     {corretores.map((c: string) => <option key={c} value={c}>{c}</option>)}
                   </select>
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
               <div className={`animate-fade-up p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-white border transition-transform hover:-translate-y-1 ${analyticsTab === 'Venda' ? 'bg-emerald-800 border-emerald-700/50' : (analyticsTab === 'Aluguel' ? 'bg-violet-900 border-violet-800/50' : 'bg-[#0f2e20] border-green-900/50')}`}>
                 <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl pointer-events-none ${analyticsTab === 'Venda' ? 'bg-emerald-500/30' : (analyticsTab === 'Aluguel' ? 'bg-violet-500/30' : 'bg-blue-500/20')}`} />
                 <div className="flex justify-between items-start mb-4 relative z-10">
                   <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5"><CheckCircle className="w-6 h-6" /></div>
                   <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/80"><TrendingUp className="w-3 h-3" /> Concluído</span>
                 </div>
                 <p className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-1">
                   {analyticsTab === 'GERAL' ? 'VGV Total (Vendas)' : (analyticsTab === 'Venda' ? 'VGV (Volume de Vendas)' : 'VGL (Locação Mensal)')}
                 </p>
                 <p className="text-3xl font-black tracking-tighter relative z-10">R$ {analyticsTab === 'GERAL' ? kpis.venda.receita.toLocaleString('pt-BR') : activeGroup.receita.toLocaleString('pt-BR')}</p>
                 <p className="text-[11px] text-white/80 font-bold mt-2">{analyticsTab === 'GERAL' ? kpis.venda.fechados : activeGroup.fechados} Negócios Ganhos</p>
               </div>

               <div className="animate-fade-up delay-100 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden hover:-translate-y-1 transition-transform">
                 <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-2xl border ${analyticsTab === 'GERAL' ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}><Activity className="w-6 h-6" /></div>
                 </div>
                 <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
                   {analyticsTab === 'GERAL' ? 'VGL Total (Locações)' : 'Pipeline em Andamento'}
                 </p>
                 <p className="text-3xl font-black text-slate-800 tracking-tighter">
                   {analyticsTab === 'GERAL' ? `R$ ${kpis.aluguel.receita.toLocaleString('pt-BR')}` : `R$ ${activeGroup.pipeline.toLocaleString('pt-BR')}`}
                 </p>
                 <p className={`text-[11px] font-bold mt-2 ${analyticsTab === 'GERAL' ? 'text-violet-600' : 'text-slate-500'}`}>
                   {analyticsTab === 'GERAL' ? `${kpis.aluguel.fechados} Contratos Ativos` : `${activeGroup.abertos} Leads no funil`}
                 </p>
               </div>

               <div className="animate-fade-up delay-200 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden hover:-translate-y-1 transition-transform">
                 <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-2xl border ${analyticsTab === 'GERAL' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                     {analyticsTab === 'GERAL' ? <Users className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                   </div>
                 </div>
                 <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
                   {analyticsTab === 'GERAL' ? 'Total de Leads' : 'Ticket Médio por Contrato'}
                 </p>
                 <p className="text-3xl font-black text-slate-800 tracking-tighter">
                   {analyticsTab === 'GERAL' ? activeGroup.total : `R$ ${activeGroup.ticket.toLocaleString('pt-BR', {maximumFractionDigits:0})}`}
                 </p>
                 {analyticsTab !== 'GERAL' && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                       <div className="bg-amber-400 h-full rounded-full w-full" />
                    </div>
                 )}
               </div>

               <div className="animate-fade-up delay-300 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden hover:-translate-y-1 transition-transform flex flex-col">
                 <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-2xl border ${theme === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : (theme === 'violet' ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-blue-50 text-blue-600 border-blue-100')}`}><Target className="w-6 h-6" /></div>
                 </div>
                 <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Taxa de Conversão</p>
                 <div className="flex items-end gap-2">
                   <p className="text-3xl font-black text-slate-800 tracking-tighter">{activeGroup.conversao}%</p>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${theme === 'emerald' ? 'bg-emerald-500' : (theme === 'violet' ? 'bg-violet-500' : 'bg-blue-500')}`} style={{ width: `${activeGroup.conversao}%` }} />
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="animate-fade-up delay-100 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex items-center justify-between mb-8">
                   <div>
                     <h3 className="font-black text-lg text-slate-800 tracking-tight">Funil de Vendas</h3>
                     <p className={`text-[10px] uppercase tracking-widest font-bold mt-0.5 ${theme === 'emerald' ? 'text-emerald-500' : (theme === 'violet' ? 'text-violet-500' : 'text-blue-500')}`}>
                       Jornada do Cliente ({analyticsTab})
                     </p>
                   </div>
                   <div className={`p-2.5 rounded-xl border ${theme === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : (theme === 'violet' ? 'bg-violet-50 border-violet-100 text-violet-500' : 'bg-blue-50 border-blue-100 text-blue-500')}`}>
                     <Filter className="w-5 h-5" />
                   </div>
                 </div>
                 
                 <div className="space-y-4 flex-1 flex flex-col justify-center">
                   {estagios.map((est: Estagio, index: number) => {
                     const leadsNaFase = activeGroup.leadsList.filter((l: any) => l.estagio === est.id).length;
                     const maxLeads = Math.max(...estagios.map((e: Estagio) => activeGroup.leadsList.filter((l: any) => l.estagio === e.id).length), 1);
                     const percentWidth = Math.max((leadsNaFase / maxLeads) * 100, 5);
                     const isFechado = est.id === 'FECHADO';

                     return (
                       <div key={est.id} className="relative group">
                         <div className="w-full bg-slate-50 rounded-2xl h-14 relative flex items-center px-4 overflow-hidden border border-slate-100">
                           <div 
                             className={`absolute top-0 left-0 h-full rounded-2xl bg-gradient-to-r ${est.cor} transition-all duration-1000 ease-out opacity-90`} 
                             style={{ width: `${percentWidth}%`, animation: `expandWidth 1s ease-out forwards ${index * 0.1}s` }} 
                           />
                           <div className="relative z-10 flex items-center justify-between w-full">
                             <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/30 backdrop-blur-sm border border-white/40 ${isFechado ? 'text-white' : 'text-slate-700'}`}>
                                 {isFechado ? <CheckCircle className="w-4 h-4" /> : <span className="font-black text-[10px]">{index + 1}</span>}
                               </div>
                               <span className={`font-black text-xs uppercase tracking-widest ${isFechado || percentWidth > 30 ? 'text-white drop-shadow-md' : 'text-slate-700'}`}>
                                 {est.nome}
                               </span>
                             </div>
                             <div className={`font-black text-lg ${isFechado || percentWidth > 80 ? 'text-white drop-shadow-md' : 'text-slate-700'}`}>
                               {leadsNaFase}
                             </div>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>

               <div className="animate-fade-up delay-200 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex items-center justify-between mb-8">
                   <div>
                     <h3 className="font-black text-lg text-slate-800 tracking-tight">Canais de Aquisição</h3>
                     <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Origem dos Clientes</p>
                   </div>
                   <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100"><Globe className="w-5 h-5 text-slate-500" /></div>
                 </div>

                 {activeGroup.origensRanking.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl p-6">
                      <Globe className="w-8 h-8 text-slate-200 mb-2" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sem dados de origem</p>
                    </div>
                 ) : (
                    <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                      {activeGroup.origensRanking.map((origem, idx) => (
                        <div key={origem.nome}>
                          <div className="flex justify-between items-end mb-1.5">
                            <span className="font-black text-[11px] uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                              {origem.nome === 'WhatsApp' && <span className="w-2 h-2 rounded-full bg-green-500" />}
                              {origem.nome === 'Instagram' && <span className="w-2 h-2 rounded-full bg-pink-500" />}
                              {origem.nome === 'Site' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                              {origem.nome}
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">{origem.count} Leads</span>
                              <span className="font-black text-slate-800 text-sm">{origem.perc}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${theme === 'emerald' ? 'bg-emerald-500' : (theme === 'violet' ? 'bg-violet-500' : 'bg-slate-800')}`}
                              style={{ width: `${origem.perc}%`, animation: `expandWidth 1.5s ease-out forwards ${idx * 0.1}s` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                 )}
               </div>
             </div>

             <div className="animate-fade-up delay-300 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col pb-2">
               <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100"><Award className="w-6 h-6 text-amber-500" /></div>
                   <div>
                    <h3 className="font-black text-lg text-slate-800 tracking-tight">
                      {analyticsTab === 'Venda' ? 'Campeões de Vendas' : (analyticsTab === 'Aluguel' ? 'Campeões de Locação' : 'Ranking Global da Equipe')}
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Performance Individual</p>
                   </div>
                 </div>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead className="bg-white text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100">
                     <tr>
                       <th className="px-8 py-5">Corretor</th>
                       <th className="px-6 py-5">Leads Recebidos</th>
                       <th className="px-6 py-5">Negócios Ganhos</th>
                       <th className="px-6 py-5">Conversão</th>
                       <th className="px-8 py-5 text-right">Receita Gerada</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 text-sm">
                     {corretores
                        .map((corretor: string) => {
                          const leadsCorretor = activeGroup.leadsList.filter((l: any) => l.corretor === corretor);
                          const fechados = leadsCorretor.filter((l: any) => l.estagio === 'FECHADO');
                          const receita = fechados.reduce((acc: number, l: any) => acc + Number(l.valor_estimado || 0), 0);
                          const conversao = leadsCorretor.length > 0 ? Math.round((fechados.length / leadsCorretor.length) * 100) : 0;
                          return { corretor, leads: leadsCorretor.length, fechados: fechados.length, conversao, receita };
                        })
                        .sort((a, b) => b.receita - a.receita)
                        .map((dados, index) => {
                          if (dados.leads === 0) return null; 
                          const isTop1 = index === 0 && dados.receita > 0;

                          return (
                            <tr key={dados.corretor} className={`transition-colors hover:bg-slate-50/80 ${isTop1 ? 'bg-amber-50/20' : ''}`}>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="relative">
                                    {fotosCorretores[dados.corretor] ? (
                                      <img src={fotosCorretores[dados.corretor]} alt={dados.corretor} className={`w-11 h-11 rounded-2xl object-cover border-2 shadow-sm shrink-0 ${isTop1 ? 'border-amber-400 shadow-amber-400/30' : 'border-white'}`} />
                                    ) : (
                                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs border-2 shadow-sm shrink-0 ${isTop1 ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-white'}`}>
                                        {isTop1 ? <Award className="w-5 h-5" /> : getIniciais(dados.corretor)}
                                      </div>
                                    )}
                                    {isTop1 && (
                                      <div className="absolute -top-2.5 -right-2.5 bg-gradient-to-br from-amber-300 to-amber-500 text-white rounded-full p-1 shadow-md border-2 border-white">
                                         <Award className="w-3.5 h-3.5" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className={`font-black text-[15px] ${isTop1 ? 'text-amber-700' : 'text-slate-800'}`}>{dados.corretor}</p>
                                    {isTop1 && <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Top Performance</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5 font-bold text-slate-500">{dados.leads}</td>
                              <td className={`px-6 py-5 font-black ${theme === 'emerald' ? 'text-emerald-600' : (theme === 'violet' ? 'text-violet-600' : 'text-blue-600')}`}>{dados.fechados}</td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
                                  <span className="text-[11px] font-black text-slate-600">{dados.conversao}%</span>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${theme === 'emerald' ? 'bg-emerald-500' : (theme === 'violet' ? 'bg-violet-500' : 'bg-blue-500')}`} style={{ width: `${dados.conversao}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5 font-black text-slate-800 text-right text-base">
                                <span className="text-[10px] text-slate-400 mr-1 uppercase tracking-widest">R$</span>
                                {dados.receita.toLocaleString('pt-BR')}
                              </td>
                            </tr>
                          );
                     })}
                   </tbody>
                 </table>
               </div>
             </div>

           </div>
         </main>
        )}

        {/* ── MODAL ── */}
        {modal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}>
            <form onSubmit={handleSalvar} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" style={{ animation: "modalIn .25s cubic-bezier(.34,1.56,.64,1)" }}>
              <div className="bg-[#0f2e20] px-8 py-6 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Building className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">{isEditing ? "Editar Lead" : "Cadastrar Novo Lead"}</h3>
                    <p className="text-[10px] text-emerald-300/60 font-semibold uppercase tracking-widest mt-0.5">{isEditing ? "Atualize os dados" : "Adicione ao Pipeline"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setModal(false)} className="p-2 bg-white/10 hover:bg-red-500 rounded-full text-white transition-all"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-5 relative custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome do Cliente *</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input type="text" placeholder="Nome Completo" required value={form.cliente_nome || ""} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700" onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telefone / WhatsApp</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input type="text" placeholder="(42) 99999-9999" value={form.telefone || ""} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700" onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Origem do Lead</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <select value={form.origem || "WhatsApp"} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700 cursor-pointer" onChange={(e) => setForm({ ...form, origem: e.target.value })}>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Site">Site</option>
                        <option value="Indicação">Indicação</option>
                        <option value="Placa">Placa no Imóvel</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo de Negócio</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <select value={form.tipo_negocio || "Venda"} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700 cursor-pointer" onChange={(e) => setForm({ ...form, tipo_negocio: e.target.value })}>
                        <option value="Venda">Venda</option>
                        <option value="Aluguel">Aluguel</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoria do Imóvel</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Home className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <select value={form.categoria_imovel || "Indefinido"} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700 cursor-pointer" onChange={(e) => setForm({ ...form, categoria_imovel: e.target.value })}>
                        {categoriasDeImoveis.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5 relative z-50">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Imóvel de Interesse ou Preferência</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all relative">
                      <Building className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <input 
                        type="text" placeholder="Busque por Cód/Título ou digite a preferência..." value={form.interesse || ""}
                        className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700 cursor-text"
                        onChange={(e) => { setForm({ ...form, interesse: e.target.value }); setShowImoveisList(true); }} 
                        onFocus={() => setShowImoveisList(true)} onBlur={() => setTimeout(() => setShowImoveisList(false), 200)}
                      />
                      <button type="button" onClick={() => setShowImoveisList(!showImoveisList)}>
                         <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showImoveisList ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    {showImoveisList && (
                      <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar flex flex-col z-[999]">
                        {form.interesse && form.interesse.trim() !== "" && (
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); setShowImoveisList(false); }} className="w-full text-left px-5 py-4 border-b border-slate-100 hover:bg-slate-50 flex items-center gap-4 transition-colors shrink-0">
                            <div className="p-2.5 bg-slate-100 rounded-xl"><Search className="w-4 h-4 text-slate-500" /></div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pesquisa Livre</p>
                              <p className="text-sm font-bold text-slate-700 truncate">Salvar "{form.interesse}"</p>
                            </div>
                          </button>
                        )}
                        {imoveis.filter((imo: any) => (imo.titulo || "").toLowerCase().includes((form.interesse || "").toLowerCase()) || (imo.codigo || "").toLowerCase().includes((form.interesse || "").toLowerCase())).map((imovel: any) => (
                            <button key={imovel.id} type="button" onMouseDown={(e) => { e.preventDefault(); setForm({ ...form, interesse: `[${imovel.codigo}] ${imovel.titulo}` }); setShowImoveisList(false); }} className="w-full text-left px-5 py-3 border-b border-slate-100 hover:bg-emerald-50 flex items-center gap-4 transition-colors group">
                              {imovel.imagem_url ? <img src={imovel.imagem_url} alt="Capa" className="w-14 h-14 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0" /> : <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Building className="w-6 h-6 text-slate-300" /></div>}
                              <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="text-sm font-bold text-slate-800 truncate pr-2 group-hover:text-emerald-700 transition-colors">{imovel.titulo}</p>
                                  <span className="text-[10px] font-black bg-slate-100 group-hover:bg-white text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">{imovel.codigo}</span>
                                </div>
                                <p className="text-xs font-semibold text-emerald-600">R$ {Number(imovel.preco).toLocaleString("pt-BR")}</p>
                              </div>
                            </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Corretor Responsável</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Key className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <select value={form.corretor || "André"} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700 cursor-pointer" onChange={(e) => setForm({ ...form, corretor: e.target.value })}>
                        {corretores.map((c: string) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Orçamento Estimado (R$)</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <input type="number" step="0.01" placeholder="0,00" value={form.valor_estimado || ""} className="w-full py-3 bg-transparent outline-none font-black text-emerald-600 text-lg" onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })} />
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observações</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <AlignLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input type="text" placeholder="Detalhes rápidos..." value={form.observacoes || ""} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700" onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0 relative z-0">
                <button type="button" onClick={() => setModal(false)} className="flex-1 bg-white border-2 border-slate-200 hover:bg-slate-100 text-slate-500 font-black py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] bg-[#0f2e20] hover:bg-emerald-900 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
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