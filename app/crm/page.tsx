"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, Plus, DollarSign, User, Phone,
  X, Trash2, CheckCircle, Clock, FileText,
  Calendar, Building, AlignLeft, CalendarDays,
  TrendingUp, LayoutDashboard, Filter, Users,
  Tag, Target, Key, Edit2, Search, Globe, ChevronDown, Award, Activity, Archive, RefreshCcw, Home,
  MapPin, ExternalLink, AlertCircle, XCircle, Bell, CalendarClock, PhoneCall, ListTodo
} from "lucide-react";
import Link from "next/link";

// ================================================================
// INTERFACES
// ================================================================
interface Estagio {
  id: string; nome: string; cor: string; border: string;
  text: string; bg: string; badge: string; icone: React.ReactNode;
}
interface KPIGroup {
  total: number; fechados: number; abertos: number; receita: number;
  pipeline: number; ticket: number; conversao: string;
  origensRanking: { nome: string; count: number; perc: number }[];
  leadsList: any[];
}
interface DashboardKPIs { geral: KPIGroup; venda: KPIGroup; aluguel: KPIGroup; }
interface Proprietario {
  id: number; nome_proprietario: string; telefone?: string;
  titulo_imovel?: string; preco_anuncio?: string; localizacao?: string;
  descricao?: string; link_anuncio?: string; tipo_anuncio: string;
  origem: string; estagio: string; corretor: string;
  observacoes?: string; criado_em: string;
}
interface AgendaItem {
  id: number; titulo: string; descricao: string; data_hora: string; 
  corretor: string; tipo: string; status: string; lead_id?: number; lead_nome?: string;
}

// ================================================================
// CONSTANTES GLOBAIS
// ================================================================
const fotosCorretores: Record<string, string> = {
  "André": "/foto andre.jpeg", "Anna": "/foto anna.jpeg",
  "Claudinei": "/foto claudinei.jpg", "Jessica": "/foto jessica.jpeg",
  "Luane": "/foto luane.jpeg"
};

const categoriasDeImoveis = [
  "Indefinido","Apartamento","Casa","Kitnet","Terreno",
  "Comercial","Sítio / Chácara","Galpão","Sobrado"
];

const CORRETORES_LIST = ["André","Anna","Claudinei","Jessica","Luane","Não Atribuído"];

const ESTAGIOS_CAPTACAO = [
  { id:"NOVO", nome:"Novos Anúncios", cor:"from-sky-500 to-sky-600", bg:"bg-sky-50", text:"text-sky-700", badge:"bg-sky-100 text-sky-700", border:"border-sky-200", icon:<AlertCircle className="w-4 h-4 text-sky-500"/>, desc:"Capturados, aguardando contato" },
  { id:"CONTATADO", nome:"Em Negociação", cor:"from-amber-400 to-amber-500", bg:"bg-amber-50", text:"text-amber-700", badge:"bg-amber-100 text-amber-700", border:"border-amber-200", icon:<Clock className="w-4 h-4 text-amber-500"/>, desc:"Proposta de captação em andamento" },
  { id:"PROPOSTA", nome:"Proposta Enviada", cor:"from-violet-500 to-violet-600", bg:"bg-violet-50", text:"text-violet-700", badge:"bg-violet-100 text-violet-700", border:"border-violet-200", icon:<Target className="w-4 h-4 text-violet-500"/>, desc:"Aguardando assinatura" },
  { id:"CAPTADO", nome:"Imóvel Captado ✓", cor:"from-emerald-500 to-emerald-600", bg:"bg-emerald-50", text:"text-emerald-700", badge:"bg-emerald-100 text-emerald-700", border:"border-emerald-200", icon:<CheckCircle className="w-4 h-4 text-emerald-500"/>, desc:"Contrato assinado" },
  { id:"PERDIDO", nome:"Perdido", cor:"from-red-400 to-red-500", bg:"bg-red-50", text:"text-red-600", badge:"bg-red-100 text-red-600", border:"border-red-200", icon:<XCircle className="w-4 h-4 text-red-400"/>, desc:"Proprietário recusou" },
] as const;

const FORM_PROP_VAZIO: Partial<Proprietario> = {
  estagio:"NOVO", tipo_anuncio:"Venda", corretor:"André", origem:"Facebook Marketplace"
};

// ================================================================
// HELPERS
// ================================================================
const getIniciais = (nome: string) => {
  if (!nome) return "CL";
  const p = nome.split(" ");
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nome.substring(0,2).toUpperCase();
};
const formatarData = (d: string) => new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}).replace(".","");
const formatarHora = (d: string) => new Date(d).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const formatarMesAno = (d: string) => {
  const p = d.split("-"); if(p.length<2) return d;
  const ms = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${ms[parseInt(p[1])-1]} ${p[0]}`;
};
const isToday = (d: string) => { const date = new Date(d); const today = new Date(); return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear(); };
const isPast = (d: string) => new Date(d).getTime() < new Date().getTime() && !isToday(d);

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================
export default function CRMImobiliaria() {
  const { data: session } = useSession();
  const isCorretor = (session?.user as any)?.role === "corretor";
  const userName = session?.user?.name || "TODOS";

  // ── Estado CRM leads ──
  const [leads, setLeads] = useState<any[]>([]);
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [form, setForm] = useState<any>({ estagio:"LEAD", tipo_negocio:"Venda", corretor:"André", origem:"WhatsApp", categoria_imovel:"Indefinido" });
  const [showImoveisList, setShowImoveisList] = useState<boolean>(false);

  // ── Views ──
  const [activeView, setActiveView] = useState<'KANBAN'|'ANALYTICS'|'ARQUIVADOS'|'CAPTACAO'|'AGENDA'>('KANBAN');

  // ── Analytics ──
  const [analyticsTab, setAnalyticsTab] = useState<'GERAL'|'Venda'|'Aluguel'>('GERAL');
  const [filtroMes, setFiltroMes] = useState<string>("TODOS");
  const [filtroCorretor, setFiltroCorretor] = useState<string>("TODOS");

  // ── Filtros Kanban ──
  const [buscaKanban, setBuscaKanban] = useState<string>("");
  const [filtroCorretorKanban, setFiltroCorretorKanban] = useState<string>("TODOS");
  const [filtroTipoKanban, setFiltroTipoKanban] = useState<string>("TODOS");

  // ── Filtros Arquivados ──
  const [filtroCategoriaArquivado, setFiltroCategoriaArquivado] = useState<string>("TODOS");
  const [buscaArquivados, setBuscaArquivados] = useState<string>("");

  // ── Drag & Drop CRM ──
  const [draggedLeadId, setDraggedLeadId] = useState<number|null>(null);
  const [draggedOverCol, setDraggedOverCol] = useState<string|null>(null);

  // ── Estado Captação ──
  const [proprietarios, setProprietarios] = useState<Proprietario[]>([]);
  const [modalProp, setModalProp] = useState<boolean>(false);
  const [editandoProp, setEditandoProp] = useState<boolean>(false);
  const [formProp, setFormProp] = useState<Partial<Proprietario>>(FORM_PROP_VAZIO);
  const [buscaProp, setBuscaProp] = useState<string>("");
  const [filtroTipoProp, setFiltroTipoProp] = useState<string>("TODOS");
  const [filtroCorretorProp, setFiltroCorretorProp] = useState<string>("TODOS");
  const [dragPropId, setDragPropId] = useState<number|null>(null);
  const [dragPropCol, setDragPropCol] = useState<string|null>(null);

  // ── Estado Agenda ──
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [modalAgenda, setModalAgenda] = useState<boolean>(false);
  const [formAgenda, setFormAgenda] = useState<Partial<AgendaItem>>({});
  const [showResumoDia, setShowResumoDia] = useState<boolean>(false);
  const [resumoJaVisto, setResumoJaVisto] = useState<boolean>(false);

  const corretores: string[] = ["André","Anna","Claudinei","Jessica","Luane"];

  const estagios: Estagio[] = [
    { id:"LEAD", nome:"Novos Contatos", cor:"from-blue-500 to-blue-600", border:"border-blue-200", text:"text-blue-700", bg:"bg-blue-50", badge:"bg-blue-100 text-blue-700", icone:<User className="w-4 h-4 text-blue-500"/> },
    { id:"CONTATO", nome:"Em Atendimento", cor:"from-amber-400 to-amber-500", border:"border-amber-200", text:"text-amber-700", bg:"bg-amber-50", badge:"bg-amber-100 text-amber-700", icone:<Clock className="w-4 h-4 text-amber-500"/> },
    { id:"VISITA", nome:"Visita Agendada", cor:"from-violet-500 to-violet-600", border:"border-violet-200", text:"text-violet-700", bg:"bg-violet-50", badge:"bg-violet-100 text-violet-700", icone:<Calendar className="w-4 h-4 text-violet-500"/> },
    { id:"PROPOSTA", nome:"Proposta / Doc.", cor:"from-orange-500 to-orange-600", border:"border-orange-200", text:"text-orange-700", bg:"bg-orange-50", badge:"bg-orange-100 text-orange-700", icone:<FileText className="w-4 h-4 text-orange-500"/> },
    { id:"FECHADO", nome:"Negócio Fechado", cor:"from-emerald-500 to-emerald-600", border:"border-emerald-200", text:"text-emerald-700", bg:"bg-emerald-50", badge:"bg-emerald-100 text-emerald-700", icone:<CheckCircle className="w-4 h-4 text-emerald-600"/> },
  ];

  // ── Bloqueio de Corretores na Inicialização ──
  useEffect(() => {
    if (isCorretor && userName !== "TODOS") {
      setFiltroCorretorKanban(userName);
      setFiltroCorretorProp(userName);
      setFiltroCorretor(userName);
    }
  }, [isCorretor, userName]);

  // ── Carregar dados ──
  const carregarDados = async () => {
    try {
      const [resLeads, resImoveis, resProps, resAgenda] = await Promise.all([
        fetch("/api/admin/crm"), fetch("/api/imoveis"), fetch("/api/admin/proprietarios"), fetch("/api/admin/agenda")
      ]);
      const leadsData = await resLeads.json();
      const imoveisData = await resImoveis.json();
      const propsData = await resProps.json();
      const agendaData = await resAgenda.json();

      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setImoveis(Array.isArray(imoveisData) ? imoveisData : []);
      setProprietarios(Array.isArray(propsData) ? propsData : []);
      setAgenda(Array.isArray(agendaData) ? agendaData : []);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };
  
  const carregarLeads = async () => { 
    const r = await fetch("/api/admin/crm"); 
    const data = await r.json();
    setLeads(Array.isArray(data) ? data : []); 
  };
  
  const carregarProprietarios = async () => { 
    const r = await fetch("/api/admin/proprietarios"); 
    const data = await r.json();
    setProprietarios(Array.isArray(data) ? data : []); 
  };

  const carregarAgenda = async () => {
    const r = await fetch("/api/admin/agenda");
    const data = await r.json();
    setAgenda(Array.isArray(data) ? data : []);
  }
  
  useEffect(() => { carregarDados(); }, []);

  // Mostra o resumo do dia logo após carregar os dados (uma vez por acesso)
  useEffect(() => {
    if (!loading && agenda.length > 0 && !resumoJaVisto) {
      const compromissosHoje = agenda.filter(a => isToday(a.data_hora) && a.status === 'Pendente' && (userName === 'TODOS' || a.corretor === userName));
      if (compromissosHoje.length > 0) {
        setShowResumoDia(true);
      }
      setResumoJaVisto(true);
    }
  }, [loading, agenda, resumoJaVisto, userName]);

  // ── CRM: ações ──
  const abrirModalNovo = () => { setIsEditing(false); setForm({ estagio:"LEAD", tipo_negocio:"Venda", corretor: isCorretor ? userName : "André", origem:"WhatsApp", interesse:"", categoria_imovel:"Indefinido" }); setModal(true); setShowImoveisList(false); };
  const abrirModalEditar = (lead: any) => { setIsEditing(true); setForm(lead); setModal(true); setShowImoveisList(false); };
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/crm", { method: isEditing?"PUT":"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setModal(false); setIsEditing(false); carregarLeads();
  };
  const moverLead = async (id: number, novoEstagio: string) => {
    setLeads(leads.map(l => l.id===id ? {...l,estagio:novoEstagio} : l));
    await fetch("/api/admin/crm", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,estagio:novoEstagio}) });
  };
  const excluirLead = async (id: number) => {
    if(!confirm("Excluir esta negociação permanentemente?")) return;
    await fetch(`/api/admin/crm?id=${id}`,{method:"DELETE"}); carregarLeads();
  };

  // ── CRM: drag & drop ──
  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    setDraggedLeadId(leadId); e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/plain",leadId.toString());
    setTimeout(() => { const el=document.getElementById(`lead-${leadId}`); if(el) el.style.opacity='0.5'; },0);
  };
  const handleDragEnd = (e: React.DragEvent, leadId: number) => {
    setDraggedLeadId(null); setDraggedOverCol(null);
    const el=document.getElementById(`lead-${leadId}`); if(el) el.style.opacity='1';
  };
  const handleDragOver = (e: React.DragEvent, colId: string) => { e.preventDefault(); e.dataTransfer.dropEffect="move"; if(draggedOverCol!==colId) setDraggedOverCol(colId); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDraggedOverCol(null); };
  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault(); setDraggedOverCol(null);
    if(draggedLeadId) { const l=leads.find(x=>x.id===draggedLeadId); if(l&&l.estagio!==colId) moverLead(draggedLeadId,colId); }
    setDraggedLeadId(null);
  };

  // ── Captação: ações ──
  const abrirModalPropNovo = () => { setEditandoProp(false); setFormProp({ ...FORM_PROP_VAZIO, corretor: isCorretor ? userName : "André" }); setModalProp(true); };
  const abrirModalPropEditar = (p: Proprietario) => { setEditandoProp(true); setFormProp(p); setModalProp(true); };
  const salvarProp = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/proprietarios", { method: editandoProp?"PUT":"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(formProp) });
    setModalProp(false); carregarProprietarios();
  };
  const excluirProp = async (id: number) => {
    if(!confirm("Excluir este proprietário?")) return;
    await fetch(`/api/admin/proprietarios?id=${id}`,{method:"DELETE"}); carregarProprietarios();
  };
  const moverProp = async (id: number, novoEstagio: string) => {
    setProprietarios(prev => prev.map(p => p.id===id ? {...p,estagio:novoEstagio} : p));
    await fetch("/api/admin/proprietarios", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,estagio:novoEstagio}) });
  };

  // ── Captação: drag & drop ──
  const onDragStartProp = (e: React.DragEvent, id: number) => {
    setDragPropId(id); e.dataTransfer.setData("text/plain",id.toString());
    setTimeout(()=>{ const el=document.getElementById(`prop-${id}`); if(el) el.style.opacity='0.4'; },0);
  };
  const onDragEndProp = (e: React.DragEvent, id: number) => {
    setDragPropId(null); setDragPropCol(null);
    const el=document.getElementById(`prop-${id}`); if(el) el.style.opacity='1';
  };
  const onDropProp = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); setDragPropCol(null);
    if(dragPropId){ const p=proprietarios.find(x=>x.id===dragPropId); if(p&&p.estagio!==colId) moverProp(dragPropId,colId); }
    setDragPropId(null);
  };

  // ── Agenda: ações ──
  const abrirNovaAgenda = (leadId?: number) => {
    setFormAgenda({ tipo: 'Visita', status: 'Pendente', corretor: isCorretor ? userName : 'André', lead_id: leadId, data_hora: new Date().toISOString().slice(0,16) });
    setModalAgenda(true);
  };
  const salvarAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/agenda", { method: "POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(formAgenda) });
    setModalAgenda(false);
    carregarAgenda();
  };
  const alterarStatusAgenda = async (id: number, status: string) => {
    setAgenda(agenda.map(a => a.id === id ? { ...a, status } : a));
    await fetch("/api/admin/agenda", { method: "PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id, status}) });
  };
  const excluirAgenda = async (id: number) => {
    if(!confirm("Cancelar compromisso?")) return;
    await fetch(`/api/admin/agenda?id=${id}`,{method:"DELETE"});
    setAgenda(agenda.filter(a => a.id !== id));
  };

  // ── Filtros Kanban ──
  const leadsKanban = useMemo(() => leads.filter((l:any) => {
    if(l.estagio==='ARQUIVADO') return false;
    const mb = buscaKanban==="" || (l.cliente_nome||"").toLowerCase().includes(buscaKanban.toLowerCase()) || (l.telefone||"").includes(buscaKanban) || (l.interesse||"").toLowerCase().includes(buscaKanban.toLowerCase());
    return mb && (filtroCorretorKanban==="TODOS"||l.corretor===filtroCorretorKanban) && (filtroTipoKanban==="TODOS"||l.tipo_negocio===filtroTipoKanban);
  }), [leads,buscaKanban,filtroCorretorKanban,filtroTipoKanban]);

  const leadsArquivadosList = useMemo(() => leads.filter((l:any) => {
    if(l.estagio!=='ARQUIVADO') return false;
    const mb = buscaArquivados==="" || (l.cliente_nome||"").toLowerCase().includes(buscaArquivados.toLowerCase()) || (l.interesse||"").toLowerCase().includes(buscaArquivados.toLowerCase());
    return mb && (filtroCategoriaArquivado==="TODOS"||l.categoria_imovel===filtroCategoriaArquivado);
  }), [leads,buscaArquivados,filtroCategoriaArquivado]);

  // ── Filtros Captação ──
  const propsFiltradas = useMemo(() => {
    if (!Array.isArray(proprietarios)) return [];
    return proprietarios.filter(p => {
      const mb = !buscaProp || (p.nome_proprietario||"").toLowerCase().includes(buscaProp.toLowerCase()) || (p.titulo_imovel||"").toLowerCase().includes(buscaProp.toLowerCase()) || (p.localizacao||"").toLowerCase().includes(buscaProp.toLowerCase());
      return mb && (filtroTipoProp==="TODOS"||p.tipo_anuncio===filtroTipoProp) && (filtroCorretorProp==="TODOS"||p.corretor===filtroCorretorProp);
    });
  }, [proprietarios,buscaProp,filtroTipoProp,filtroCorretorProp]);

  // ── Filtros Agenda ──
  const agendaFiltrada = useMemo(() => agenda.filter(a => filtroCorretorKanban === "TODOS" || a.corretor === filtroCorretorKanban), [agenda, filtroCorretorKanban]);
  
  const compromissosHoje = agendaFiltrada.filter(a => isToday(a.data_hora) && a.status === 'Pendente');
  const compromissosAtrasados = agendaFiltrada.filter(a => isPast(a.data_hora) && a.status === 'Pendente');
  const compromissosFuturos = agendaFiltrada.filter(a => !isToday(a.data_hora) && !isPast(a.data_hora) && a.status === 'Pendente');

  const kpisCapt = useMemo(() => {
    if (!Array.isArray(proprietarios)) return { total: 0, novos: 0, captados: 0, venda: 0, aluguel: 0 };
    return {
      total: proprietarios.length,
      novos: proprietarios.filter(p=>p.estagio==="NOVO").length,
      captados: proprietarios.filter(p=>p.estagio==="CAPTADO").length,
      venda: proprietarios.filter(p=>p.tipo_anuncio==="Venda").length,
      aluguel: proprietarios.filter(p=>p.tipo_anuncio==="Aluguel").length,
    }
  }, [proprietarios]);

  // ── Analytics ──
  const mesesDisponiveis = useMemo(() => {
    const m = new Set(leads.map((l:any) => new Date(l.criado_em).toISOString().slice(0,7)));
    return Array.from(m).sort().reverse();
  }, [leads]);

  const kpis: DashboardKPIs = useMemo(() => {
    const base = leads.filter((l:any) => {
      if(l.estagio==='ARQUIVADO') return false;
      const ds = new Date(l.criado_em).toISOString().slice(0,7);
      return (filtroMes==="TODOS"||ds===filtroMes) && (filtroCorretor==="TODOS"||l.corretor===filtroCorretor);
    });
    const calc = (list: any[]): KPIGroup => {
      const fech = list.filter((l:any)=>l.estagio==="FECHADO");
      const ab = list.filter((l:any)=>l.estagio!=="FECHADO");
      const rec = fech.reduce((a:number,l:any)=>a+Number(l.valor_estimado||0),0);
      const pip = ab.reduce((a:number,l:any)=>a+Number(l.valor_estimado||0),0);
      const tick = fech.length>0?(rec/fech.length):0;
      const conv = list.length>0?((fech.length/list.length)*100).toFixed(1):"0";
      const om = list.reduce((a:Record<string,number>,l:any)=>{ const o=l.origem||'Outros'; a[o]=(a[o]||0)+1; return a; },{});
      const or = Object.entries(om).map(([nome,count])=>({nome,count,perc:Math.round((Number(count)/list.length)*100)})).sort((a,b)=>Number(b.count)-Number(a.count));
      return {total:list.length,fechados:fech.length,abertos:ab.length,receita:rec,pipeline:pip,ticket:tick,conversao:conv,origensRanking:or,leadsList:list};
    };
    return { geral:calc(base), venda:calc(base.filter(l=>l.tipo_negocio==='Venda')), aluguel:calc(base.filter(l=>l.tipo_negocio==='Aluguel')) };
  }, [leads,filtroMes,filtroCorretor]);

  const activeGroup = analyticsTab==='GERAL'?kpis.geral:(analyticsTab==='Venda'?kpis.venda:kpis.aluguel);
  const theme = analyticsTab==='Venda'?'emerald':(analyticsTab==='Aluguel'?'violet':'blue');

  if(loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"/>
      <p className="font-black text-emerald-700 uppercase tracking-widest text-xs">Carregando Master CRM...</p>
    </div>
  );

  return (
    <>
      <style>{`
        body{margin:0!important;padding:0!important;overflow:hidden!important;}
        .custom-scrollbar::-webkit-scrollbar{height:6px;width:5px;}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent;}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px;}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#94a3b8;}
        .crm-kanban-wrapper{flex:1;min-height:0;overflow-x:auto;overflow-y:hidden;padding:20px 24px;background:#f8fafc;}
        .crm-board{display:flex;gap:18px;width:max-content;height:100%;align-items:flex-start;padding-right:24px;padding-bottom:4px;}
        .crm-col{width:310px;min-width:310px;max-width:310px;flex-shrink:0;display:flex;flex-direction:column;height:100%;border:1px solid #e2e8f0;border-radius:1.5rem;padding:12px;overflow:hidden;transition:all 0.2s ease;}
        .crm-col-body{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-right:4px;padding-bottom:16px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .animate-fade-up{animation:fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
        .delay-100{animation-delay:100ms;}.delay-200{animation-delay:200ms;}.delay-300{animation-delay:300ms;}
        @keyframes modalIn{from{opacity:0;transform:translateY(14px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>

      <div style={{margin:0,padding:0}} className="h-screen w-screen overflow-hidden bg-[#f8fafc] flex flex-col font-sans text-slate-800 fixed top-0 left-0 right-0 bottom-0 z-[9999]">

        {/* ════════════════════════════════════════════════════════
            HEADER GERAL
        ════════════════════════════════════════════════════════ */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 shadow-sm z-40 flex-wrap w-full">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/admin/imoveis" className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-500 hover:text-emerald-700">
              <ArrowLeft className="w-5 h-5"/>
            </Link>
            <div className="hidden sm:flex items-center gap-3 pr-4 md:pr-6 border-r border-slate-200">
              <img src="/logo_nova.png" alt="Porto Iguaçu" className="h-10 w-auto object-contain drop-shadow-sm"/>
              <div className="flex flex-col">
                <span className="font-black text-[12px] uppercase tracking-widest text-slate-800 leading-none mb-0.5">Porto Iguaçu</span>
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Imobiliária</span>
              </div>
            </div>
            <div>
              <h1 className="font-black text-xl md:text-2xl tracking-tight text-slate-900 leading-none flex items-center gap-2">
                Pipeline <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">CRM</span>
              </h1>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Inteligência Comercial</p>
            </div>

            {/* TABS DE NAVEGAÇÃO */}
            <div className="hidden lg:flex ml-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner overflow-x-auto">
              <button onClick={()=>setActiveView('KANBAN')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeView==='KANBAN'?'bg-white text-emerald-700 shadow-sm':'text-slate-400 hover:text-slate-600'}`}>
                <LayoutDashboard className="w-3.5 h-3.5"/> Kanban
              </button>
              <button onClick={()=>setActiveView('AGENDA')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeView==='AGENDA'?'bg-blue-600 text-white shadow-md':'text-slate-400 hover:text-slate-600'}`}>
                <CalendarClock className="w-3.5 h-3.5"/> Agenda {compromissosHoje.length>0 && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[8px] leading-none">{compromissosHoje.length}</span>}
              </button>
              <button onClick={()=>setActiveView('ANALYTICS')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeView==='ANALYTICS'?'bg-[#0f2e20] text-white shadow-md':'text-slate-400 hover:text-slate-600'}`}>
                <Activity className="w-3.5 h-3.5"/> Analytics
              </button>
              <button onClick={()=>setActiveView('ARQUIVADOS')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeView==='ARQUIVADOS'?'bg-slate-800 text-white shadow-md':'text-slate-400 hover:text-slate-600'}`}>
                <Archive className="w-3.5 h-3.5"/> Arquivados
              </button>
              <button onClick={()=>setActiveView('CAPTACAO')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeView==='CAPTACAO'?'bg-orange-600 text-white shadow-md':'text-slate-400 hover:text-slate-600'}`}>
                <Home className="w-3.5 h-3.5"/> Captação
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
              <User className="w-4 h-4 text-slate-400"/>
              <span className="text-xs font-bold text-slate-600">{userName}</span>
              {isCorretor && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-black">Corretor</span>}
            </div>

            {activeView==='AGENDA' ? (
              <button onClick={()=>abrirNovaAgenda()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 whitespace-nowrap">
                <Plus className="w-4 h-4" strokeWidth={3}/> <span className="hidden sm:inline">Novo Compromisso</span>
              </button>
            ) : activeView==='CAPTACAO' ? (
              <button onClick={abrirModalPropNovo} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 whitespace-nowrap">
                <Plus className="w-4 h-4" strokeWidth={3}/> <span className="hidden sm:inline">Novo Proprietário</span>
              </button>
            ) : (
              <button onClick={abrirModalNovo} className="flex items-center gap-2 bg-[#0f2e20] hover:bg-emerald-900 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-95 whitespace-nowrap">
                <Plus className="w-4 h-4" strokeWidth={3}/> <span className="hidden sm:inline">Novo Lead</span>
              </button>
            )}
          </div>
        </header>

        {/* ════════════════════════════════════════════════════════
            VISÃO KANBAN
        ════════════════════════════════════════════════════════ */}
        {activeView==='KANBAN' && (
          <div className="flex-1 min-h-0 flex flex-col w-full">
            <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 z-30 w-full">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="text" placeholder="Buscar lead por nome, fone, imóvel..." value={buscaKanban} onChange={e=>setBuscaKanban(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"/>
                {buscaKanban && <button onClick={()=>setBuscaKanban('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>}
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 flex-shrink-0">
                  <Key className="w-3.5 h-3.5 text-emerald-500"/>
                  <select disabled={isCorretor} value={filtroCorretorKanban} onChange={e=>setFiltroCorretorKanban(e.target.value)} className={`py-2.5 bg-transparent outline-none text-xs font-bold cursor-pointer min-w-[140px] ${isCorretor ? 'text-slate-400' : 'text-slate-600'}`}>
                    <option value="TODOS">Todos Corretores</option>
                    {corretores.map((c:string)=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 flex-shrink-0">
                  <Tag className="w-3.5 h-3.5 text-blue-500"/>
                  <select value={filtroTipoKanban} onChange={e=>setFiltroTipoKanban(e.target.value)} className="py-2.5 bg-transparent outline-none text-xs font-bold text-slate-600 cursor-pointer min-w-[130px]">
                    <option value="TODOS">Venda & Aluguel</option>
                    <option value="Venda">Apenas Venda</option>
                    <option value="Aluguel">Apenas Aluguel</option>
                  </select>
                </div>
              </div>
            </div>
            <main className="crm-kanban-wrapper custom-scrollbar w-full">
              <div className="crm-board">
                {estagios.map((coluna:Estagio) => {
                  const ldc = leadsKanban.filter((l:any)=>l.estagio===coluna.id);
                  const vf = ldc.reduce((a:number,l:any)=>a+Number(l.valor_estimado||0),0);
                  const isHov = draggedOverCol===coluna.id;
                  return (
                    <div className={`crm-col ${isHov?'bg-emerald-50/70 border-emerald-400 scale-[1.01] shadow-xl':'bg-[rgba(241,245,249,0.85)]'}`} key={coluna.id}
                      onDragOver={e=>handleDragOver(e,coluna.id)} onDragLeave={handleDragLeave} onDrop={e=>handleDrop(e,coluna.id)}>
                      <div className={`h-1.5 w-full flex-shrink-0 rounded-full bg-gradient-to-r ${coluna.cor} mb-3 ${isHov?'opacity-100':'opacity-80'}`}/>
                      <div className="px-2 pb-3 flex-shrink-0 flex items-center justify-between border-b border-slate-200/60 mb-1 pointer-events-none">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${coluna.bg} shadow-sm`}>{coluna.icone}</div>
                          <div>
                            <span className={`font-black text-[11px] uppercase tracking-wider ${coluna.text} block leading-tight`}>{coluna.nome}</span>
                            <span className="text-[10px] font-bold text-slate-400">R$ {vf.toLocaleString("pt-BR",{minimumFractionDigits:0})}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${coluna.badge}`}>{ldc.length}</span>
                      </div>
                      <div className="crm-col-body custom-scrollbar">
                        {ldc.length===0 && (
                          <div className={`flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-xl gap-2 mt-1 pointer-events-none transition-colors ${isHov?'border-emerald-300 bg-emerald-50/50':'border-slate-200 bg-white/60'}`}>
                            <AlignLeft className={`w-4 h-4 ${isHov?'text-emerald-400':'text-slate-300'}`}/>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isHov?'text-emerald-500':'text-slate-400'}`}>{isHov?'Solte aqui!':'Nenhum Lead'}</p>
                          </div>
                        )}
                        {ldc.map((lead:any) => (
                          <div key={lead.id} id={`lead-${lead.id}`} draggable onDragStart={e=>handleDragStart(e,lead.id)} onDragEnd={e=>handleDragEnd(e,lead.id)}
                            className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group relative flex flex-col gap-3 flex-shrink-0 cursor-grab active:cursor-grabbing">
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm border border-slate-100">
                              {/* NOVO BOTÃO DE AGENDA RÁPIDA */}
                              <button onClick={()=>abrirNovaAgenda(lead.id)} title="Agendar Compromisso" className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:text-blue-700 hover:bg-blue-100 transition-all"><CalendarClock className="w-3.5 h-3.5"/></button>
                              <button onClick={()=>moverLead(lead.id,'ARQUIVADO')} title="Arquivar" className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all"><Archive className="w-3.5 h-3.5"/></button>
                              <button onClick={()=>abrirModalEditar(lead)} title="Editar" className="p-1.5 rounded-lg bg-emerald-50 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                              <button onClick={()=>excluirLead(lead.id)} title="Excluir" className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                            </div>
                            <div className="flex items-center gap-3 pr-20 pointer-events-none">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 border-2 border-white shadow-sm ${coluna.bg} ${coluna.text}`}>{getIniciais(lead.cliente_nome)}</div>
                              <div className="overflow-hidden">
                                <p className="font-bold text-slate-800 text-sm leading-tight truncate">{lead.cliente_nome}</p>
                                <div className="flex items-center gap-1.5 mt-1 text-[9px] font-semibold text-slate-400">
                                  {fotosCorretores[lead.corretor] && <img src={fotosCorretores[lead.corretor]} alt={lead.corretor} className="w-3.5 h-3.5 rounded-full object-cover border border-slate-200"/>}
                                  <span className="font-black uppercase tracking-widest text-slate-500">{lead.corretor}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><CalendarDays className="w-2.5 h-2.5"/>{formatarData(lead.criado_em)}</span>
                                </div>
                              </div>
                            </div>
                            {lead.telefone && (
                              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 pointer-events-none">
                                <Phone className="w-3 h-3 text-slate-400 flex-shrink-0"/><span className="truncate">{lead.telefone}</span>
                              </div>
                            )}
                            <div className="flex flex-col gap-2 pointer-events-none">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex-shrink-0 ${lead.tipo_negocio==='Venda'?'bg-emerald-50 text-emerald-600':'bg-violet-50 text-violet-600'}`}>{lead.tipo_negocio}</span>
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex-shrink-0 bg-slate-100 text-slate-500 border border-slate-200/60">
                                  <Home className="w-3 h-3 text-slate-400"/> {lead.categoria_imovel||'Indefinido'}
                                </span>
                              </div>
                              {lead.interesse && (
                                <div className="text-[10px] font-semibold text-slate-600 truncate flex items-center gap-1.5 bg-slate-50/50 border border-slate-100 px-2.5 py-1.5 rounded-lg w-full">
                                  <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0"/><span className="truncate block w-full">{lead.interesse}</span>
                                </div>
                              )}
                            </div>
                            {Number(lead.valor_estimado||0)>0 && (
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

        {/* ════════════════════════════════════════════════════════
            VISÃO ARQUIVADOS
        ════════════════════════════════════════════════════════ */}
        {activeView==='ARQUIVADOS' && (
          <div className="flex-1 min-h-0 flex flex-col w-full bg-slate-50/50">
            <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 z-30 w-full shadow-sm">
              <div className="relative w-full md:w-1/3">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="text" placeholder="Buscar arquivados..." value={buscaArquivados} onChange={e=>setBuscaArquivados(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-slate-400 focus:bg-white transition-all"/>
                {buscaArquivados && <button onClick={()=>setBuscaArquivados('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>}
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 flex-shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-500"/>
                <select value={filtroCategoriaArquivado} onChange={e=>setFiltroCategoriaArquivado(e.target.value)} className="py-2.5 bg-transparent outline-none text-xs font-bold text-slate-600 cursor-pointer min-w-[140px]">
                  <option value="TODOS">Todas</option>
                  {categoriasDeImoveis.map((c:string)=>c!=='Indefinido'&&<option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
              {leadsArquivadosList.length===0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Archive className="w-8 h-8 text-slate-300"/></div>
                  <h2 className="text-xl font-black text-slate-700">Nenhum Lead Arquivado</h2>
                  <p className="text-sm text-slate-400 mt-2 max-w-md">Os leads arquivados no Kanban aparecem aqui.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {leadsArquivadosList.map((lead:any) => (
                    <div key={lead.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 opacity-90 hover:opacity-100">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 bg-slate-100 text-slate-500 border-2 border-slate-200">{getIniciais(lead.cliente_nome)}</div>
                          <div><p className="font-bold text-slate-800 text-sm">{lead.cliente_nome}</p><p className="text-[10px] font-semibold text-slate-400">{formatarData(lead.criado_em)}</p></div>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-100 text-slate-500 border border-slate-200">{lead.categoria_imovel}</span>
                      </div>
                      {lead.telefone && <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400"/>{lead.telefone}</div>}
                      {lead.interesse && <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-2"><Building className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5"/><span className="line-clamp-2">{lead.interesse}</span></div>}
                      <div className="mt-auto pt-4 flex gap-2">
                        <button onClick={()=>moverLead(lead.id,'LEAD')} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"><RefreshCcw className="w-3.5 h-3.5"/> Restaurar</button>
                        <button onClick={()=>excluirLead(lead.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            VISÃO AGENDA (NOVO MÓDULO DE COMPROMISSOS)
        ════════════════════════════════════════════════════════ */}
        {activeView==='AGENDA' && (
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-slate-50/50 w-full relative">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
              <div className="animate-fade-up bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                 <div>
                   <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><CalendarClock className="w-8 h-8 text-blue-600"/> Gerenciador de Compromissos</h2>
                   <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Controle suas visitas, reuniões e ligações</p>
                 </div>
                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 w-full md:w-auto">
                      <Users className="w-4 h-4 text-slate-400"/>
                      <select disabled={isCorretor} value={filtroCorretorKanban} onChange={e=>setFiltroCorretorKanban(e.target.value)} className={`bg-transparent w-full text-xs font-bold outline-none cursor-pointer ${isCorretor ? 'text-slate-400' : 'text-slate-700'}`}>
                        <option value="TODOS">Visão Geral da Imobiliária</option>
                        {corretores.map(c=><option key={c} value={c}>Compromissos: {c}</option>)}
                      </select>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUNA 1: HOJE */}
                <div className="animate-fade-up delay-100 bg-white rounded-[2rem] border border-blue-100 shadow-md overflow-hidden flex flex-col h-[600px]">
                  <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-black flex items-center gap-2 text-lg"><Bell className="w-5 h-5"/> Para Hoje</h3>
                    <span className="bg-white/20 px-3 py-1 rounded-xl text-xs font-black shadow-sm">{compromissosHoje.length}</span>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-blue-50/30 space-y-4">
                    {compromissosHoje.length===0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                         <CheckCircle className="w-12 h-12 text-blue-300 mb-3"/>
                         <p className="font-bold text-slate-500">Nenhum compromisso para hoje.</p>
                      </div>
                    ) : compromissosHoje.map(item => (
                      <div key={item.id} className="bg-white p-5 rounded-2xl border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-all relative group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{formatarHora(item.data_hora)}</span>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>alterarStatusAgenda(item.id, 'Concluído')} title="Concluir" className="p-1.5 rounded bg-emerald-50 text-emerald-500 hover:bg-emerald-100"><CheckCircle className="w-4 h-4"/></button>
                            <button onClick={()=>excluirAgenda(item.id)} title="Cancelar" className="p-1.5 rounded bg-red-50 text-red-400 hover:bg-red-100"><XCircle className="w-4 h-4"/></button>
                          </div>
                        </div>
                        <h4 className="font-black text-slate-800 text-sm">{item.titulo}</h4>
                        {item.lead_nome && <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><User className="w-3.5 h-3.5 text-blue-400"/> {item.lead_nome}</p>}
                        {item.descricao && <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">{item.descricao}</p>}
                        <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-50">
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200">{item.tipo}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.corretor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUNA 2: ATRASADOS / PENDÊNCIAS */}
                <div className="animate-fade-up delay-200 bg-white rounded-[2rem] border border-red-100 shadow-md overflow-hidden flex flex-col h-[600px]">
                  <div className="bg-gradient-to-r from-red-500 to-rose-400 px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-black flex items-center gap-2 text-lg"><AlertCircle className="w-5 h-5"/> Atrasados</h3>
                    <span className="bg-white/20 px-3 py-1 rounded-xl text-xs font-black shadow-sm">{compromissosAtrasados.length}</span>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-red-50/30 space-y-4">
                    {compromissosAtrasados.length===0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                         <Award className="w-12 h-12 text-red-300 mb-3"/>
                         <p className="font-bold text-slate-500">Tudo em dia! Nenhuma pendência.</p>
                      </div>
                    ) : compromissosAtrasados.map(item => (
                      <div key={item.id} className="bg-white p-5 rounded-2xl border-l-4 border-red-500 shadow-sm hover:shadow-md transition-all relative group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">{formatarData(item.data_hora)}</span>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>alterarStatusAgenda(item.id, 'Concluído')} title="Concluir (Baixar)" className="p-1.5 rounded bg-emerald-50 text-emerald-500 hover:bg-emerald-100"><CheckCircle className="w-4 h-4"/></button>
                            <button onClick={()=>excluirAgenda(item.id)} title="Cancelar" className="p-1.5 rounded bg-slate-50 text-slate-400 hover:bg-slate-100"><XCircle className="w-4 h-4"/></button>
                          </div>
                        </div>
                        <h4 className="font-black text-slate-800 text-sm">{item.titulo}</h4>
                        {item.lead_nome && <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><User className="w-3.5 h-3.5 text-red-400"/> {item.lead_nome}</p>}
                        <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-50">
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200">{item.tipo}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.corretor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COLUNA 3: PRÓXIMOS DIAS */}
                <div className="animate-fade-up delay-300 bg-white rounded-[2rem] border border-emerald-100 shadow-md overflow-hidden flex flex-col h-[600px]">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-black flex items-center gap-2 text-lg"><Calendar className="w-5 h-5"/> Próximos Dias</h3>
                    <span className="bg-white/20 px-3 py-1 rounded-xl text-xs font-black shadow-sm">{compromissosFuturos.length}</span>
                  </div>
                  <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-emerald-50/30 space-y-4">
                    {compromissosFuturos.length===0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                         <CalendarDays className="w-12 h-12 text-emerald-300 mb-3"/>
                         <p className="font-bold text-slate-500">Agenda livre para os próximos dias.</p>
                      </div>
                    ) : compromissosFuturos.map(item => (
                      <div key={item.id} className="bg-white p-5 rounded-2xl border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition-all relative group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5"><Calendar className="w-3 h-3"/> {formatarData(item.data_hora)} às {formatarHora(item.data_hora)}</span>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>excluirAgenda(item.id)} title="Cancelar/Excluir" className="p-1.5 rounded bg-red-50 text-red-400 hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                        <h4 className="font-black text-slate-800 text-sm mt-3">{item.titulo}</h4>
                        {item.lead_nome && <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100"><User className="w-3.5 h-3.5 text-emerald-500"/> {item.lead_nome}</p>}
                        <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-50">
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200">{item.tipo}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.corretor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            VISÃO ANALYTICS
        ════════════════════════════════════════════════════════ */}
        {activeView==='ANALYTICS' && (
          <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-slate-50 w-full relative">
            <div className={`absolute top-0 left-0 w-full h-80 bg-gradient-to-b pointer-events-none transition-colors duration-700 ${analyticsTab==='Venda'?'from-emerald-200/40':(analyticsTab==='Aluguel'?'from-violet-200/40':'from-blue-200/40')} to-transparent`}/>
            <div className="max-w-7xl mx-auto space-y-8 relative z-10" key={analyticsTab}>
              <div className="animate-fade-up bg-white p-3 lg:p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto custom-scrollbar">
                  <button onClick={()=>setAnalyticsTab('GERAL')} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${analyticsTab==='GERAL'?'bg-white text-blue-700 shadow-sm':'text-slate-500 hover:text-slate-700'}`}><Globe className="w-4 h-4"/> Visão Global</button>
                  <button onClick={()=>setAnalyticsTab('Venda')} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${analyticsTab==='Venda'?'bg-emerald-600 text-white shadow-md':'text-slate-500 hover:text-slate-700'}`}><DollarSign className="w-4 h-4"/> Performance Vendas</button>
                  <button onClick={()=>setAnalyticsTab('Aluguel')} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${analyticsTab==='Aluguel'?'bg-violet-600 text-white shadow-md':'text-slate-500 hover:text-slate-700'}`}><Key className="w-4 h-4"/> Performance Locação</button>
                </div>
                <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                  <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-1.5 w-full md:w-auto">
                    <Calendar className="w-4 h-4 text-slate-400"/>
                    <select value={filtroMes} onChange={e=>setFiltroMes(e.target.value)} className="bg-transparent py-2 w-full text-xs font-bold text-slate-700 outline-none cursor-pointer">
                      <option value="TODOS">Todo o Período</option>
                      {mesesDisponiveis.map((m:string)=><option key={m} value={m}>{formatarMesAno(m)}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-1.5 w-full md:w-auto">
                    <Users className="w-4 h-4 text-slate-400"/>
                    <select value={filtroCorretor} onChange={e=>setFiltroCorretor(e.target.value)} className="bg-transparent py-2 w-full text-xs font-bold text-slate-700 outline-none cursor-pointer">
                      <option value="TODOS">Todos os Corretores</option>
                      {corretores.map((c:string)=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className={`animate-fade-up p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-white border transition-transform hover:-translate-y-1 ${analyticsTab==='Venda'?'bg-emerald-800 border-emerald-700/50':(analyticsTab==='Aluguel'?'bg-violet-900 border-violet-800/50':'bg-[#0f2e20] border-green-900/50')}`}>
                  <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl pointer-events-none ${analyticsTab==='Venda'?'bg-emerald-500/30':(analyticsTab==='Aluguel'?'bg-violet-500/30':'bg-blue-500/20')}`}/>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5"><CheckCircle className="w-6 h-6"/></div>
                    <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/80"><TrendingUp className="w-3 h-3"/> Concluído</span>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-1">{analyticsTab==='GERAL'?'VGV Total (Vendas)':(analyticsTab==='Venda'?'VGV (Volume de Vendas)':'VGL (Locação Mensal)')}</p>
                  <p className="text-3xl font-black tracking-tighter relative z-10">R$ {analyticsTab==='GERAL'?kpis.venda.receita.toLocaleString('pt-BR'):activeGroup.receita.toLocaleString('pt-BR')}</p>
                  <p className="text-[11px] text-white/80 font-bold mt-2">{analyticsTab==='GERAL'?kpis.venda.fechados:activeGroup.fechados} Negócios Ganhos</p>
                </div>
                <div className="animate-fade-up delay-100 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden hover:-translate-y-1 transition-transform">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl border ${analyticsTab==='GERAL'?'bg-violet-50 text-violet-600 border-violet-100':'bg-slate-50 text-slate-600 border-slate-100'}`}><Activity className="w-6 h-6"/></div>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{analyticsTab==='GERAL'?'VGL Total (Locações)':'Pipeline em Andamento'}</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{analyticsTab==='GERAL'?`R$ ${kpis.aluguel.receita.toLocaleString('pt-BR')}`:`R$ ${activeGroup.pipeline.toLocaleString('pt-BR')}`}</p>
                  <p className={`text-[11px] font-bold mt-2 ${analyticsTab==='GERAL'?'text-violet-600':'text-slate-500'}`}>{analyticsTab==='GERAL'?`${kpis.aluguel.fechados} Contratos Ativos`:`${activeGroup.abertos} Leads no funil`}</p>
                </div>
                <div className="animate-fade-up delay-200 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden hover:-translate-y-1 transition-transform">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl border ${analyticsTab==='GERAL'?'bg-blue-50 text-blue-600 border-blue-100':'bg-amber-50 text-amber-600 border-amber-100'}`}>{analyticsTab==='GERAL'?<Users className="w-6 h-6"/>:<DollarSign className="w-6 h-6"/>}</div>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{analyticsTab==='GERAL'?'Total de Leads':'Ticket Médio por Contrato'}</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{analyticsTab==='GERAL'?activeGroup.total:`R$ ${activeGroup.ticket.toLocaleString('pt-BR',{maximumFractionDigits:0})}`}</p>
                  {analyticsTab!=='GERAL'&&<div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden"><div className="bg-amber-400 h-full rounded-full w-full"/></div>}
                </div>
                <div className="animate-fade-up delay-300 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden hover:-translate-y-1 transition-transform flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl border ${theme==='emerald'?'bg-emerald-50 text-emerald-600 border-emerald-100':(theme==='violet'?'bg-violet-50 text-violet-600 border-violet-100':'bg-blue-50 text-blue-600 border-blue-100')}`}><Target className="w-6 h-6"/></div>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Taxa de Conversão</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{activeGroup.conversao}%</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${theme==='emerald'?'bg-emerald-500':(theme==='violet'?'bg-violet-500':'bg-blue-500')}`} style={{width:`${activeGroup.conversao}%`}}/>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="animate-fade-up delay-100 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div><h3 className="font-black text-lg text-slate-800 tracking-tight">Funil de Vendas</h3><p className={`text-[10px] uppercase tracking-widest font-bold mt-0.5 ${theme==='emerald'?'text-emerald-500':(theme==='violet'?'text-violet-500':'text-blue-500')}`}>Jornada do Cliente ({analyticsTab})</p></div>
                    <div className={`p-2.5 rounded-xl border ${theme==='emerald'?'bg-emerald-50 border-emerald-100 text-emerald-500':(theme==='violet'?'bg-violet-50 border-violet-100 text-violet-500':'bg-blue-50 border-blue-100 text-blue-500')}`}><Filter className="w-5 h-5"/></div>
                  </div>
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    {estagios.map((est:Estagio,index:number) => {
                      const ln = activeGroup.leadsList.filter((l:any)=>l.estagio===est.id).length;
                      const mx = Math.max(...estagios.map((e:Estagio)=>activeGroup.leadsList.filter((l:any)=>l.estagio===e.id).length),1);
                      const pw = Math.max((ln/mx)*100,5);
                      const isF = est.id==='FECHADO';
                      return (
                        <div key={est.id} className="relative group">
                          <div className="w-full bg-slate-50 rounded-2xl h-14 relative flex items-center px-4 overflow-hidden border border-slate-100">
                            <div className={`absolute top-0 left-0 h-full rounded-2xl bg-gradient-to-r ${est.cor} transition-all duration-1000 ease-out opacity-90`} style={{width:`${pw}%`}}/>
                            <div className="relative z-10 flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/30 backdrop-blur-sm border border-white/40 ${isF?'text-white':'text-slate-700'}`}>{isF?<CheckCircle className="w-4 h-4"/>:<span className="font-black text-[10px]">{index+1}</span>}</div>
                                <span className={`font-black text-xs uppercase tracking-widest ${isF||pw>30?'text-white drop-shadow-md':'text-slate-700'}`}>{est.nome}</span>
                              </div>
                              <div className={`font-black text-lg ${isF||pw>80?'text-white drop-shadow-md':'text-slate-700'}`}>{ln}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="animate-fade-up delay-200 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div><h3 className="font-black text-lg text-slate-800 tracking-tight">Canais de Aquisição</h3><p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Origem dos Clientes</p></div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100"><Globe className="w-5 h-5 text-slate-500"/></div>
                  </div>
                  {activeGroup.origensRanking.length===0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl p-6"><Globe className="w-8 h-8 text-slate-200 mb-2"/><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sem dados de origem</p></div>
                  ) : (
                    <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                      {activeGroup.origensRanking.map((origem,idx) => (
                        <div key={origem.nome}>
                          <div className="flex justify-between items-end mb-1.5">
                            <span className="font-black text-[11px] uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                              {origem.nome==='WhatsApp'&&<span className="w-2 h-2 rounded-full bg-green-500"/>}
                              {origem.nome==='Instagram'&&<span className="w-2 h-2 rounded-full bg-pink-500"/>}
                              {origem.nome==='Site'&&<span className="w-2 h-2 rounded-full bg-blue-500"/>}
                              {origem.nome}
                            </span>
                            <div className="flex items-baseline gap-2"><span className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">{origem.count} Leads</span><span className="font-black text-slate-800 text-sm">{origem.perc}%</span></div>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${theme==='emerald'?'bg-emerald-500':(theme==='violet'?'bg-violet-500':'bg-slate-800')}`} style={{width:`${origem.perc}%`}}/>
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
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100"><Award className="w-6 h-6 text-amber-500"/></div>
                    <div><h3 className="font-black text-lg text-slate-800 tracking-tight">{analyticsTab==='Venda'?'Campeões de Vendas':(analyticsTab==='Aluguel'?'Campeões de Locação':'Ranking Global da Equipe')}</h3><p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Performance Individual</p></div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white text-[10px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100">
                      <tr><th className="px-8 py-5">Corretor</th><th className="px-6 py-5">Leads Recebidos</th><th className="px-6 py-5">Negócios Ganhos</th><th className="px-6 py-5">Conversão</th><th className="px-8 py-5 text-right">Receita Gerada</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {corretores.map((corretor:string) => {
                        const lc = activeGroup.leadsList.filter((l:any)=>l.corretor===corretor);
                        const fech = lc.filter((l:any)=>l.estagio==='FECHADO');
                        const rec = fech.reduce((a:number,l:any)=>a+Number(l.valor_estimado||0),0);
                        const conv = lc.length>0?Math.round((fech.length/lc.length)*100):0;
                        return {corretor,leads:lc.length,fechados:fech.length,conversao:conv,receita:rec};
                      }).sort((a,b)=>b.receita-a.receita).map((dados,index) => {
                        if(dados.leads===0) return null;
                        const isTop = index===0&&dados.receita>0;
                        return (
                          <tr key={dados.corretor} className={`transition-colors hover:bg-slate-50/80 ${isTop?'bg-amber-50/20':''}`}>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  {fotosCorretores[dados.corretor]?<img src={fotosCorretores[dados.corretor]} alt={dados.corretor} className={`w-11 h-11 rounded-2xl object-cover border-2 shadow-sm shrink-0 ${isTop?'border-amber-400 shadow-amber-400/30':'border-white'}`}/>:<div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs border-2 shadow-sm shrink-0 ${isTop?'bg-amber-100 text-amber-600 border-amber-200':'bg-slate-100 text-slate-600 border-white'}`}>{isTop?<Award className="w-5 h-5"/>:getIniciais(dados.corretor)}</div>}
                                  {isTop&&<div className="absolute -top-2.5 -right-2.5 bg-gradient-to-br from-amber-300 to-amber-500 text-white rounded-full p-1 shadow-md border-2 border-white"><Award className="w-3.5 h-3.5"/></div>}
                                </div>
                                <div><p className={`font-black text-[15px] ${isTop?'text-amber-700':'text-slate-800'}`}>{dados.corretor}</p>{isTop&&<span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Top Performance</span>}</div>
                              </div>
                            </td>
                            <td className="px-6 py-5 font-bold text-slate-500">{dados.leads}</td>
                            <td className={`px-6 py-5 font-black ${theme==='emerald'?'text-emerald-600':(theme==='violet'?'text-violet-600':'text-blue-600')}`}>{dados.fechados}</td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
                                <span className="text-[11px] font-black text-slate-600">{dados.conversao}%</span>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${theme==='emerald'?'bg-emerald-500':(theme==='violet'?'bg-violet-500':'bg-blue-500')}`} style={{width:`${dados.conversao}%`}}/></div>
                              </div>
                            </td>
                            <td className="px-8 py-5 font-black text-slate-800 text-right text-base"><span className="text-[10px] text-slate-400 mr-1 uppercase tracking-widest">R$</span>{dados.receita.toLocaleString('pt-BR')}</td>
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

        {/* ════════════════════════════════════════════════════════
            VISÃO CAPTAÇÃO — KANBAN DE PROPRIETÁRIOS
        ════════════════════════════════════════════════════════ */}
        {activeView==='CAPTACAO' && (
          <div className="flex-1 min-h-0 flex flex-col w-full">

            {/* KPIs */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-6 overflow-x-auto z-30">
              {[
                {label:"Total Capturados",value:kpisCapt.total,color:"slate"},
                {label:"Sem contato",value:kpisCapt.novos,color:"sky"},
                {label:"Imóveis Captados",value:kpisCapt.captados,color:"emerald"},
              ].map(k=>(
                <div key={k.label} className="flex items-center gap-2.5 shrink-0">
                  <span className={`text-2xl font-black ${k.color==='emerald'?'text-emerald-600':k.color==='sky'?'text-sky-600':'text-slate-700'}`}>{k.value}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight max-w-[70px]">{k.label}</span>
                </div>
              ))}
              <div className="h-8 w-px bg-slate-200 mx-1 shrink-0"/>
              <div className="flex items-center gap-2.5 shrink-0"><span className="text-2xl font-black text-emerald-600">🏡 {kpisCapt.venda}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Para Venda</span></div>
              <div className="flex items-center gap-2.5 shrink-0"><span className="text-2xl font-black text-violet-600">🔑 {kpisCapt.aluguel}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Para Aluguel</span></div>
            </div>

            {/* Filtros */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 flex-wrap z-20">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input placeholder="Buscar por nome, imóvel, bairro..." value={buscaProp} onChange={e=>setBuscaProp(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400 transition-all"/>
                {buscaProp&&<button onClick={()=>setBuscaProp('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>}
              </div>
              <div className="flex items-center gap-3 overflow-x-auto">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 shrink-0">
                  <Tag className="w-3.5 h-3.5 text-orange-500"/>
                  <select value={filtroTipoProp} onChange={e=>setFiltroTipoProp(e.target.value)} className="py-2.5 bg-transparent outline-none text-xs font-bold text-slate-600 cursor-pointer min-w-[130px]">
                    <option value="TODOS">Venda & Aluguel</option>
                    <option value="Venda">Apenas Venda</option>
                    <option value="Aluguel">Apenas Aluguel</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 shrink-0">
                  <Key className="w-3.5 h-3.5 text-violet-500"/>
                  <select disabled={isCorretor} value={filtroCorretorProp} onChange={e=>setFiltroCorretorProp(e.target.value)} className={`py-2.5 bg-transparent outline-none text-xs font-bold cursor-pointer min-w-[140px] ${isCorretor ? 'text-slate-400' : 'text-slate-600'}`}>
                    <option value="TODOS">Todos Corretores</option>
                    {CORRETORES_LIST.filter(c=>c!=="Não Atribuído").map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Kanban Captação */}
            <main className="crm-kanban-wrapper custom-scrollbar w-full">
              <div className="crm-board">
                {ESTAGIOS_CAPTACAO.map(col => {
                  const cards = propsFiltradas.filter(p=>p.estagio===col.id);
                  const isHov = dragPropCol===col.id;
                  return (
                    <div key={col.id}
                      className={`crm-col ${isHov?`${col.bg} ${col.border} scale-[1.01] shadow-lg`:'bg-slate-100/80 border-slate-200'}`}
                      onDragOver={e=>{e.preventDefault();setDragPropCol(col.id);}}
                      onDragLeave={()=>setDragPropCol(null)}
                      onDrop={e=>onDropProp(e,col.id)}>
                      <div className={`h-1.5 w-full flex-shrink-0 rounded-full bg-gradient-to-r ${col.cor} mb-3`}/>
                      <div className="px-1 pb-3 flex-shrink-0 flex items-center justify-between border-b border-slate-200/60 mb-2 pointer-events-none">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${col.bg} shadow-sm`}>{col.icon}</div>
                          <div>
                            <p className={`font-black text-[11px] uppercase tracking-wider ${col.text}`}>{col.nome}</p>
                            <p className="text-[9px] text-slate-400 font-medium">{col.desc}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${col.badge}`}>{cards.length}</span>
                      </div>
                      <div className="crm-col-body custom-scrollbar">
                        {cards.length===0&&(
                          <div className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl gap-1 transition-colors ${isHov?`${col.border} ${col.bg}`:'border-slate-200 bg-white/40'}`}>
                            <Home className={`w-4 h-4 ${isHov?col.text:'text-slate-300'}`}/>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${isHov?col.text:'text-slate-400'}`}>{isHov?'Solte aqui!':'Nenhum imóvel'}</p>
                          </div>
                        )}
                        {cards.map(prop=>(
                          <div key={prop.id} id={`prop-${prop.id}`} draggable
                            onDragStart={e=>onDragStartProp(e,prop.id)} onDragEnd={e=>onDragEndProp(e,prop.id)}
                            className="bg-white border border-slate-200/80 hover:border-orange-300 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all group relative flex flex-col gap-2.5 cursor-grab active:cursor-grabbing shrink-0">
                            {/* Ações hover */}
                            <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/90 p-1 rounded-lg shadow-sm border border-slate-100">
                              {prop.link_anuncio&&<a href={prop.link_anuncio} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-blue-50 text-blue-400 hover:text-blue-700 hover:bg-blue-100 transition-all"><ExternalLink className="w-3.5 h-3.5"/></a>}
                              <button onClick={()=>abrirModalPropEditar(prop)} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                              <button onClick={()=>excluirProp(prop.id)} className="p-1.5 rounded-lg bg-red-50 text-red-300 hover:text-red-600 hover:bg-red-100 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                            </div>
                            {/* Nome + data */}
                            <div className="flex items-center gap-2.5 pr-20 pointer-events-none">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 border-2 border-white shadow-sm ${col.bg} ${col.text}`}>{getIniciais(prop.nome_proprietario)}</div>
                              <div className="overflow-hidden">
                                <p className="font-bold text-slate-800 text-sm leading-tight truncate">{prop.nome_proprietario}</p>
                                <p className="text-[9px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-2.5 h-2.5"/> {formatarData(prop.criado_em)}
                                  {prop.corretor&&prop.corretor!=="Não Atribuído"&&<><span>·</span><span className="font-black text-slate-500">{prop.corretor}</span></>}
                                </p>
                              </div>
                            </div>
                            {/* Tipo */}
                            <div className="flex items-center gap-1.5 pointer-events-none flex-wrap">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${prop.tipo_anuncio==="Venda"?'bg-emerald-50 text-emerald-600':prop.tipo_anuncio==="Aluguel"?'bg-violet-50 text-violet-600':'bg-slate-100 text-slate-500'}`}>
                                {prop.tipo_anuncio==="Venda"?"🏡":prop.tipo_anuncio==="Aluguel"?"🔑":"❓"} {prop.tipo_anuncio}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">{prop.origem}</span>
                            </div>
                            {/* Título */}
                            {prop.titulo_imovel&&<div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg pointer-events-none"><Home className="w-3 h-3 text-slate-400 shrink-0"/><span className="text-[11px] font-semibold text-slate-600 truncate">{prop.titulo_imovel}</span></div>}
                            {/* Preço + Local */}
                            {(prop.preco_anuncio||prop.localizacao)&&(
                              <div className="flex items-center gap-2 pointer-events-none flex-wrap">
                                {prop.preco_anuncio&&<span className="font-black text-emerald-600 text-sm tracking-tight">{prop.preco_anuncio}</span>}
                                {prop.localizacao&&<span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold"><MapPin className="w-2.5 h-2.5"/> {prop.localizacao}</span>}
                              </div>
                            )}
                            {/* Telefone */}
                            {prop.telefone&&<div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 pointer-events-none"><Phone className="w-3 h-3 text-slate-400 shrink-0"/><span>{prop.telefone}</span></div>}
                            
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

        {/* ════════════════════════════════════════════════════════
            MODAL DE RESUMO DO DIA (APARECE AO LOGAR SE HOUVER COMPROMISSOS)
        ════════════════════════════════════════════════════════ */}
        {showResumoDia && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden" style={{animation:"modalIn .4s cubic-bezier(.34,1.56,.64,1)"}}>
              <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-8 text-center relative">
                <button onClick={()=>setShowResumoDia(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                  <Bell className="w-8 h-8 text-white"/>
                </div>
                <h2 className="text-2xl font-black text-white">Bom dia, {userName}!</h2>
                <p className="text-blue-100 font-medium mt-1">Aqui está sua agenda para hoje.</p>
              </div>
              <div className="p-6 max-h-80 overflow-y-auto custom-scrollbar space-y-3 bg-slate-50">
                {agenda.filter(a => isToday(a.data_hora) && a.status === 'Pendente' && (userName === 'TODOS' || a.corretor === userName)).map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-50 text-blue-600 font-black text-sm p-3 rounded-xl text-center leading-none">
                       {formatarHora(item.data_hora)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{item.titulo}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.tipo}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-white border-t border-slate-100 text-center flex gap-3">
                <button onClick={()=>setShowResumoDia(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black py-3 rounded-xl uppercase tracking-widest text-xs transition-all">Fechar</button>
                <button onClick={()=>{setShowResumoDia(false); setActiveView('AGENDA');}} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-md">Abrir Agenda Completa</button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            MODAL CRIAR COMPROMISSO (AGENDA)
        ════════════════════════════════════════════════════════ */}
        {modalAgenda && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[99990] flex items-center justify-center p-4">
            <form onSubmit={salvarAgenda} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{animation:"modalIn .25s ease-out"}}>
              <div className="bg-blue-600 px-6 py-5 flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2"><CalendarClock className="w-5 h-5"/> Novo Compromisso</h3>
                <button type="button" onClick={()=>setModalAgenda(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Título do Compromisso *</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-blue-400 rounded-2xl px-4 transition-all">
                      <ListTodo className="w-4 h-4 text-slate-400 shrink-0"/>
                      <input required type="text" placeholder="Ex: Reunião Captação, Ligar para Cliente..." value={formAgenda.titulo||""} onChange={e=>setFormAgenda({...formAgenda, titulo:e.target.value})} className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700"/>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data e Hora *</label>
                      <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-blue-400 rounded-2xl px-4 transition-all">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0"/>
                        <input required type="datetime-local" value={formAgenda.data_hora||""} onChange={e=>setFormAgenda({...formAgenda, data_hora:e.target.value})} className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700"/>
                      </div>
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo *</label>
                      <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-blue-400 rounded-2xl px-4 transition-all">
                        <Tag className="w-4 h-4 text-slate-400 shrink-0"/>
                        <select value={formAgenda.tipo||"Visita"} onChange={e=>setFormAgenda({...formAgenda, tipo:e.target.value})} className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700 cursor-pointer">
                          <option>Visita</option><option>Reunião</option><option>Ligação</option><option>Vistoria</option><option>Outros</option>
                        </select>
                      </div>
                   </div>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Corretor Responsável</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-blue-400 rounded-2xl px-4 transition-all">
                      <Key className="w-4 h-4 text-blue-500 shrink-0"/>
                      <select disabled={isCorretor} value={formAgenda.corretor||"André"} onChange={e=>setFormAgenda({...formAgenda, corretor:e.target.value})} className={`w-full py-3 bg-transparent outline-none text-sm font-semibold cursor-pointer ${isCorretor ? 'text-slate-400' : 'text-slate-700'}`}>
                        {corretores.map((c:string)=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Vincular a um Lead (Opcional)</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-blue-400 rounded-2xl px-4 transition-all">
                      <User className="w-4 h-4 text-slate-400 shrink-0"/>
                      <select value={formAgenda.lead_id||""} onChange={e=>setFormAgenda({...formAgenda, lead_id: Number(e.target.value)})} className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700 cursor-pointer">
                        <option value="">Nenhum (Compromisso Avulso)</option>
                        {leads.filter(l=>l.estagio!=='ARQUIVADO').map(l=><option key={l.id} value={l.id}>{l.cliente_nome}</option>)}
                      </select>
                    </div>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Descrição</label>
                    <div className="flex gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-blue-400 rounded-2xl px-4 py-3 transition-all">
                      <AlignLeft className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"/>
                      <textarea rows={3} placeholder="Endereço, detalhes, lembretes..." value={formAgenda.descricao||""} onChange={e=>setFormAgenda({...formAgenda, descricao:e.target.value})} className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700 resize-none"/>
                    </div>
                 </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                <button type="button" onClick={()=>setModalAgenda(false)} className="flex-1 bg-white border-2 border-slate-200 hover:bg-slate-100 text-slate-500 font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Agendar Compromisso</button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            MODAL CRM LEADS (EXISTENTE)
        ════════════════════════════════════════════════════════ */}
        {modal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[99990] flex items-center justify-center p-4" onClick={e=>{if(e.target===e.currentTarget)setModal(false);}}>
            <form onSubmit={handleSalvar} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" style={{animation:"modalIn .25s cubic-bezier(.34,1.56,.64,1)"}}>
              <div className="bg-[#0f2e20] px-8 py-6 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl"><Building className="w-6 h-6 text-emerald-400"/></div>
                  <div><h3 className="text-xl font-black text-white tracking-tight">{isEditing?"Editar Lead":"Cadastrar Novo Lead"}</h3><p className="text-[10px] text-emerald-300/60 font-semibold uppercase tracking-widest mt-0.5">{isEditing?"Atualize os dados":"Adicione ao Pipeline"}</p></div>
                </div>
                <button type="button" onClick={()=>setModal(false)} className="p-2 bg-white/10 hover:bg-red-500 rounded-full text-white transition-all"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-8 overflow-y-auto flex-1 space-y-5 relative custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome do Cliente *</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                      <input type="text" placeholder="Nome Completo" required value={form.cliente_nome||""} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700" onChange={e=>setForm({...form,cliente_nome:e.target.value})}/>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telefone / WhatsApp</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                      <input type="text" placeholder="(42) 99999-9999" value={form.telefone||""} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700" onChange={e=>setForm({...form,telefone:e.target.value})}/>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Origem do Lead</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Globe className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                      <select value={form.origem||"WhatsApp"} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700 cursor-pointer" onChange={e=>setForm({...form,origem:e.target.value})}>
                        <option value="WhatsApp">WhatsApp</option><option value="Instagram">Instagram</option><option value="Facebook">Facebook</option><option value="Site">Site</option><option value="Indicação">Indicação</option><option value="Placa">Placa no Imóvel</option><option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo de Negócio</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Tag className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                      <select value={form.tipo_negocio||"Venda"} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700 cursor-pointer" onChange={e=>setForm({...form,tipo_negocio:e.target.value})}>
                        <option value="Venda">Venda</option><option value="Aluguel">Aluguel</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoria do Imóvel</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <Home className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                      <select value={form.categoria_imovel||"Indefinido"} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700 cursor-pointer" onChange={e=>setForm({...form,categoria_imovel:e.target.value})}>
                        {categoriasDeImoveis.map((cat:string)=><option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5 relative z-50">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Imóvel de Interesse ou Preferência</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all relative">
                      <Building className="w-4 h-4 text-emerald-500 flex-shrink-0"/>
                      <input type="text" placeholder="Busque por Cód/Título ou digite a preferência..." value={form.interesse||""} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700 cursor-text"
                        onChange={e=>{setForm({...form,interesse:e.target.value});setShowImoveisList(true);}} onFocus={()=>setShowImoveisList(true)} onBlur={()=>setTimeout(()=>setShowImoveisList(false),200)}/>
                      <button type="button" onClick={()=>setShowImoveisList(!showImoveisList)}><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showImoveisList?"rotate-180":""}`}/></button>
                    </div>
                    {showImoveisList && (
                      <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar flex flex-col z-[999]">
                        {form.interesse&&form.interesse.trim()!==""&&(
                          <button type="button" onMouseDown={e=>{e.preventDefault();setShowImoveisList(false);}} className="w-full text-left px-5 py-4 border-b border-slate-100 hover:bg-slate-50 flex items-center gap-4 transition-colors shrink-0">
                            <div className="p-2.5 bg-slate-100 rounded-xl"><Search className="w-4 h-4 text-slate-500"/></div>
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pesquisa Livre</p><p className="text-sm font-bold text-slate-700 truncate">Salvar "{form.interesse}"</p></div>
                          </button>
                        )}
                        {imoveis.filter((imo:any)=>(imo.titulo||"").toLowerCase().includes((form.interesse||"").toLowerCase())||(imo.codigo||"").toLowerCase().includes((form.interesse||"").toLowerCase())).map((imovel:any)=>(
                          <button key={imovel.id} type="button" onMouseDown={e=>{e.preventDefault();setForm({...form,interesse:`[${imovel.codigo}] ${imovel.titulo}`});setShowImoveisList(false);}} className="w-full text-left px-5 py-3 border-b border-slate-100 hover:bg-emerald-50 flex items-center gap-4 transition-colors group">
                            {imovel.imagem_url?<img src={imovel.imagem_url} alt="Capa" className="w-14 h-14 rounded-xl object-cover shadow-sm shrink-0"/>:<div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Building className="w-6 h-6 text-slate-300"/></div>}
                            <div className="flex-1 overflow-hidden">
                              <div className="flex justify-between items-start mb-1"><p className="text-sm font-bold text-slate-800 truncate pr-2">{imovel.titulo}</p><span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">{imovel.codigo}</span></div>
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
                      <Key className="w-4 h-4 text-emerald-500 flex-shrink-0"/>
                      <select disabled={isCorretor} value={form.corretor||"André"} className={`w-full py-3 bg-transparent outline-none font-semibold text-sm cursor-pointer ${isCorretor ? 'text-slate-400' : 'text-slate-700'}`} onChange={e=>setForm({...form,corretor:e.target.value})}>
                        {corretores.map((c:string)=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Orçamento Estimado (R$)</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0"/>
                      <input type="number" step="0.01" placeholder="0,00" value={form.valor_estimado||""} className="w-full py-3 bg-transparent outline-none font-black text-emerald-600 text-lg" onChange={e=>setForm({...form,valor_estimado:e.target.value})}/>
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observações</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-emerald-400 focus-within:bg-white rounded-2xl px-4 transition-all">
                      <AlignLeft className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                      <input type="text" placeholder="Detalhes rápidos..." value={form.observacoes||""} className="w-full py-3 bg-transparent outline-none font-semibold text-sm text-slate-700" onChange={e=>setForm({...form,observacoes:e.target.value})}/>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0 relative z-0">
                <button type="button" onClick={()=>setModal(false)} className="flex-1 bg-white border-2 border-slate-200 hover:bg-slate-100 text-slate-500 font-black py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] bg-[#0f2e20] hover:bg-emerald-900 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">{isEditing?"Salvar Alterações":"Salvar Lead no Pipeline"}</button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            MODAL CAPTAÇÃO — PROPRIETÁRIOS (EXISTENTE)
        ════════════════════════════════════════════════════════ */}
        {modalProp && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99990] flex items-center justify-center p-4" onClick={e=>{if(e.target===e.currentTarget)setModalProp(false);}}>
            <form onSubmit={salvarProp} className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" style={{animation:"modalIn .25s cubic-bezier(.34,1.56,.64,1)"}}>
              <div className="bg-orange-700 px-7 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/10 rounded-xl"><Home className="w-5 h-5 text-orange-200"/></div>
                  <div><h3 className="text-lg font-black text-white">{editandoProp?"Editar Proprietário":"Cadastrar Proprietário"}</h3><p className="text-[9px] text-orange-200/60 font-semibold uppercase tracking-widest mt-0.5">Captação de Carteira</p></div>
                </div>
                <button type="button" onClick={()=>setModalProp(false)} className="p-2 bg-white/10 hover:bg-red-500 rounded-full text-white transition-all"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome do Proprietário *</label>
                  <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-orange-400 rounded-2xl px-4 transition-all">
                    <User className="w-4 h-4 text-slate-400 shrink-0"/>
                    <input required type="text" placeholder="Nome completo" value={formProp.nome_proprietario||""} onChange={e=>setFormProp({...formProp,nome_proprietario:e.target.value})} className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telefone</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-orange-400 rounded-2xl px-4 transition-all">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0"/>
                      <input type="text" placeholder="(42) 99999-9999" value={formProp.telefone||""} onChange={e=>setFormProp({...formProp,telefone:e.target.value})} className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700"/>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo de Anúncio</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-orange-400 rounded-2xl px-4 transition-all">
                      <Tag className="w-4 h-4 text-slate-400 shrink-0"/>
                      <select value={formProp.tipo_anuncio||"Venda"} onChange={e=>setFormProp({...formProp,tipo_anuncio:e.target.value})} className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700 cursor-pointer">
                        <option value="Venda">🏡 Venda</option><option value="Aluguel">🔑 Aluguel</option><option value="Indefinido">❓ Indefinido</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Título do Imóvel</label>
                  <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-orange-400 rounded-2xl px-4 transition-all">
                    <Home className="w-4 h-4 text-slate-400 shrink-0"/>
                    <input type="text" placeholder="Ex: Casa 3 quartos no Centro" value={formProp.titulo_imovel||""} onChange={e=>setFormProp({...formProp,titulo_imovel:e.target.value})} className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Preço Anunciado</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-orange-400 rounded-2xl px-4 transition-all">
                      <DollarSign className="w-4 h-4 text-emerald-500 shrink-0"/>
                      <input type="text" placeholder="R$ 0,00" value={formProp.preco_anuncio||""} onChange={e=>setFormProp({...formProp,preco_anuncio:e.target.value})} className="w-full py-3 bg-transparent outline-none text-sm font-black text-emerald-600"/>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Localização</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-orange-400 rounded-2xl px-4 transition-all">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0"/>
                      <input type="text" placeholder="Bairro, Cidade" value={formProp.localizacao||""} onChange={e=>setFormProp({...formProp,localizacao:e.target.value})} className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700"/>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descrição do Imóvel</label>
                  <div className="flex gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-orange-400 rounded-2xl px-4 py-3 transition-all">
                    <AlignLeft className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"/>
                    <textarea rows={3} placeholder="Características, cômodos, diferenciais..." value={formProp.descricao||""} onChange={e=>setFormProp({...formProp,descricao:e.target.value})} className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700 resize-none"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Corretor</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-orange-400 rounded-2xl px-4 transition-all">
                      <Key className="w-4 h-4 text-emerald-500 shrink-0"/>
                      <select disabled={isCorretor} value={formProp.corretor||"Não Atribuído"} onChange={e=>setFormProp({...formProp,corretor:e.target.value})} className={`w-full py-3 bg-transparent outline-none text-sm font-semibold cursor-pointer ${isCorretor ? 'text-slate-400' : 'text-slate-700'}`}>
                        {CORRETORES_LIST.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estágio</label>
                    <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-orange-400 rounded-2xl px-4 transition-all">
                      <Target className="w-4 h-4 text-slate-400 shrink-0"/>
                      <select value={formProp.estagio||"NOVO"} onChange={e=>setFormProp({...formProp,estagio:e.target.value})} className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700 cursor-pointer">
                        {ESTAGIOS_CAPTACAO.map(e=><option key={e.id} value={e.id}>{e.nome}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Link do Anúncio (Facebook)</label>
                  <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-orange-400 rounded-2xl px-4 transition-all">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0"/>
                    <input type="url" placeholder="https://facebook.com/marketplace/item/..." value={formProp.link_anuncio||""} onChange={e=>setFormProp({...formProp,link_anuncio:e.target.value})} className="w-full py-3 bg-transparent outline-none text-xs font-mono text-slate-600"/>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observações Internas</label>
                  <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 focus-within:border-orange-400 rounded-2xl px-4 transition-all">
                    <AlignLeft className="w-4 h-4 text-slate-400 shrink-0"/>
                    <input type="text" placeholder="Notas para a equipe..." value={formProp.observacoes||""} onChange={e=>setFormProp({...formProp,observacoes:e.target.value})} className="w-full py-3 bg-transparent outline-none text-sm font-semibold text-slate-700"/>
                  </div>
                </div>
              </div>
              <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                <button type="button" onClick={()=>setModalProp(false)} className="flex-1 border-2 border-slate-200 hover:bg-slate-100 text-slate-500 font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">{editandoProp?"Salvar Alterações":"Adicionar à Carteira"}</button>
              </div>
            </form>
          </div>
        )}

      </div>
    </>
  );
}