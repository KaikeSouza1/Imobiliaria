"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare, Home, Loader2, RefreshCw, Trash2,
  Phone, Mail, MapPin, ChevronDown, ChevronUp, CheckCircle,
  Clock, Eye, PhoneCall, Star, Filter, Search, X, StickyNote, Save,
  User, DollarSign, Maximize
} from "lucide-react";

// ─── TIPOS ─────────────────────────────────────────────────────────────────
type StatusType = "novo" | "visto" | "em_contato" | "finalizado";

interface Contato {
  id: number;
  nome: string;
  telefone: string;
  email: string | null;
  assunto: string | null;
  mensagem: string;
  status: StatusType;
  anotacao: string | null;
  criado_em: string;
}

interface Anuncio {
  id: number;
  nome: string;
  telefone: string;
  email: string | null;
  finalidade: string | null;
  tipo: string | null;
  endereco: string | null;
  valor: string | null;
  area: string | null;
  descricao: string | null;
  status: StatusType;
  anotacao: string | null;
  criado_em: string;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  novo:        { label: "Novo",         color: "text-red-700",    bg: "bg-red-100 border-red-200",     icon: <Star size={12} className="fill-red-500 text-red-500" /> },
  visto:       { label: "Visto",        color: "text-gray-600",   bg: "bg-gray-100 border-gray-200",   icon: <Eye size={12} /> },
  em_contato:  { label: "Em Contato",   color: "text-blue-700",   bg: "bg-blue-100 border-blue-200",   icon: <PhoneCall size={12} /> },
  finalizado:  { label: "Finalizado",   color: "text-green-700",  bg: "bg-green-100 border-green-200", icon: <CheckCircle size={12} /> },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: StatusType }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.novo;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.bg} ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── CARD DE CONTATO ────────────────────────────────────────────────────────
function ContatoCard({
  item,
  onStatusChange,
  onAnotacaoSave,
  onDelete,
}: {
  item: Contato;
  onStatusChange: (id: number, status: StatusType) => void;
  onAnotacaoSave: (id: number, anotacao: string) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [anotacao, setAnotacao] = useState(item.anotacao || "");
  const [savingNote, setSavingNote] = useState(false);

  const handleSaveNote = async () => {
    setSavingNote(true);
    await onAnotacaoSave(item.id, anotacao);
    setSavingNote(false);
  };

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all duration-300 overflow-hidden
      ${item.status === "novo" ? "border-red-200 shadow-red-50" : "border-gray-100"}`}>

      {/* CABEÇALHO DO CARD */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0f2e20] to-green-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-gray-900 truncate">{item.nome}</h3>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Clock size={11} /> {formatDate(item.criado_em)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
          </button>
        </div>

        {/* LINHA COM CONTATOS */}
        <div className="mt-3 flex flex-wrap gap-3">
          <a href={`tel:${item.telefone}`} className="flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-600 bg-green-50 px-3 py-1.5 rounded-lg transition-colors">
            <Phone size={12} /> {item.telefone}
          </a>
          {item.email && (
            <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
              <Mail size={12} /> {item.email}
            </a>
          )}
          {item.assunto && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
              {item.assunto}
            </span>
          )}
        </div>

        {/* PREVIEW DA MENSAGEM */}
        <p className="mt-3 text-sm text-gray-600 line-clamp-2 leading-relaxed">{item.mensagem}</p>
      </div>

      {/* CONTEÚDO EXPANDIDO */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-5 bg-gray-50/50">

          {/* MENSAGEM COMPLETA */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mensagem Completa</p>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {item.mensagem}
            </div>
          </div>

          {/* MUDAR STATUS */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mudar Status</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(STATUS_CONFIG) as StatusType[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => onStatusChange(item.id, s)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase border-2 transition-all
                      ${item.status === s
                        ? `${cfg.bg} ${cfg.color} border-current scale-[1.02] shadow-sm`
                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ANOTAÇÃO INTERNA */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <StickyNote size={11} /> Anotação Interna
            </p>
            <textarea
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
              rows={3}
              placeholder="Ex: Ligou às 14h, interessado em casa no centro..."
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none outline-none focus:border-green-500 transition-all"
            />
            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              className="mt-2 flex items-center gap-2 bg-[#0f2e20] hover:bg-green-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              {savingNote ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Salvar Anotação
            </button>
          </div>

          {/* AÇÕES */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <a
              href={`https://api.whatsapp.com/send?phone=55${item.telefone.replace(/\D/g, "")}&text=Olá ${encodeURIComponent(item.nome)}, recebemos sua mensagem!`}
              target="_blank"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Phone size={12} /> Responder via WhatsApp
            </a>
            <button
              onClick={() => onDelete(item.id)}
              className="flex items-center gap-1.5 text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Trash2 size={14} /> Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CARD DE ANÚNCIO ────────────────────────────────────────────────────────
function AnuncioCard({
  item,
  onStatusChange,
  onAnotacaoSave,
  onDelete,
}: {
  item: Anuncio;
  onStatusChange: (id: number, status: StatusType) => void;
  onAnotacaoSave: (id: number, anotacao: string) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [anotacao, setAnotacao] = useState(item.anotacao || "");
  const [savingNote, setSavingNote] = useState(false);

  const handleSaveNote = async () => {
    setSavingNote(true);
    await onAnotacaoSave(item.id, anotacao);
    setSavingNote(false);
  };

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all duration-300 overflow-hidden
      ${item.status === "novo" ? "border-amber-200 shadow-amber-50" : "border-gray-100"}`}>

      {/* CABEÇALHO */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Home size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-gray-900 truncate">{item.nome}</h3>
                <StatusBadge status={item.status} />
                {item.finalidade && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black rounded-full uppercase">
                    {item.finalidade}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Clock size={11} /> {formatDate(item.criado_em)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
          </button>
        </div>

        {/* CONTATOS E TAGS */}
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`tel:${item.telefone}`} className="flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-600 bg-green-50 px-3 py-1.5 rounded-lg transition-colors">
            <Phone size={12} /> {item.telefone}
          </a>
          {item.email && (
            <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
              <Mail size={12} /> {item.email}
            </a>
          )}
          {item.tipo && (
            <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <Home size={11} /> {item.tipo}
            </span>
          )}
        </div>

        {/* RESUMO DE DADOS DO IMÓVEL */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {item.valor && (
            <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <p className="text-[9px] font-black text-green-600 uppercase tracking-wider flex items-center gap-1"><DollarSign size={9} />Valor</p>
              <p className="text-xs font-bold text-green-800 truncate">R$ {item.valor}</p>
            </div>
          )}
          {item.area && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1"><Maximize size={9} />Área</p>
              <p className="text-xs font-bold text-blue-800">{item.area} m²</p>
            </div>
          )}
          {item.endereco && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
              <p className="text-[9px] font-black text-purple-600 uppercase tracking-wider flex items-center gap-1"><MapPin size={9} />Local</p>
              <p className="text-xs font-bold text-purple-800 truncate">{item.endereco}</p>
            </div>
          )}
        </div>
      </div>

      {/* CONTEÚDO EXPANDIDO */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-5 bg-gray-50/50">

          {/* DADOS COMPLETOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "Finalidade", value: item.finalidade, icon: <Star size={12} /> },
              { label: "Tipo", value: item.tipo, icon: <Home size={12} /> },
              { label: "Endereço", value: item.endereco, icon: <MapPin size={12} /> },
              { label: "Valor Pretendido", value: item.valor ? `R$ ${item.valor}` : null, icon: <DollarSign size={12} /> },
              { label: "Área", value: item.area ? `${item.area} m²` : null, icon: <Maximize size={12} /> },
            ].filter(f => f.value).map((field, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  {field.icon} {field.label}
                </p>
                <p className="text-sm font-bold text-gray-800">{field.value}</p>
              </div>
            ))}
          </div>

          {item.descricao && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descrição</p>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {item.descricao}
              </div>
            </div>
          )}

          {/* MUDAR STATUS */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mudar Status</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(STATUS_CONFIG) as StatusType[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => onStatusChange(item.id, s)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase border-2 transition-all
                      ${item.status === s
                        ? `${cfg.bg} ${cfg.color} border-current scale-[1.02] shadow-sm`
                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ANOTAÇÃO */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <StickyNote size={11} /> Anotação Interna
            </p>
            <textarea
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
              rows={3}
              placeholder="Ex: Imóvel avaliado em R$ 350k, proprietário flexível..."
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none outline-none focus:border-green-500 transition-all"
            />
            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              className="mt-2 flex items-center gap-2 bg-[#0f2e20] hover:bg-green-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              {savingNote ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Salvar Anotação
            </button>
          </div>

          {/* AÇÕES */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <a
              href={`https://api.whatsapp.com/send?phone=55${item.telefone.replace(/\D/g, "")}&text=Olá ${encodeURIComponent(item.nome)}, recebemos sua solicitação de anúncio!`}
              target="_blank"
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Phone size={12} /> Responder via WhatsApp
            </a>
            <button
              onClick={() => onDelete(item.id)}
              className="flex items-center gap-1.5 text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Trash2 size={14} /> Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ───────────────────────────────────────────────────────
export default function MensagensPage() {
  const [aba, setAba] = useState<"contatos" | "anuncios">("contatos");
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<StatusType | "todos">("todos");
  const [busca, setBusca] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resC, resA] = await Promise.all([
        fetch("/api/contatos"),
        fetch("/api/anuncios"),
      ]);
      const [dataC, dataA] = await Promise.all([resC.json(), resA.json()]);
      setContatos(Array.isArray(dataC) ? dataC : []);
      setAnuncios(Array.isArray(dataA) ? dataA : []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── HANDLERS CONTATOS ───
  const handleContatoStatus = async (id: number, status: StatusType) => {
    await fetch(`/api/contatos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setContatos(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const handleContatoAnotacao = async (id: number, anotacao: string) => {
    await fetch(`/api/contatos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anotacao }),
    });
    setContatos(prev => prev.map(c => c.id === id ? { ...c, anotacao } : c));
  };

  const handleContatoDelete = async (id: number) => {
    if (!confirm("Excluir este contato permanentemente?")) return;
    await fetch(`/api/contatos/${id}`, { method: "DELETE" });
    setContatos(prev => prev.filter(c => c.id !== id));
  };

  // ─── HANDLERS ANÚNCIOS ───
  const handleAnuncioStatus = async (id: number, status: StatusType) => {
    await fetch(`/api/anuncios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setAnuncios(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleAnuncioAnotacao = async (id: number, anotacao: string) => {
    await fetch(`/api/anuncios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anotacao }),
    });
    setAnuncios(prev => prev.map(a => a.id === id ? { ...a, anotacao } : a));
  };

  const handleAnuncioDelete = async (id: number) => {
    if (!confirm("Excluir este anúncio permanentemente?")) return;
    await fetch(`/api/anuncios/${id}`, { method: "DELETE" });
    setAnuncios(prev => prev.filter(a => a.id !== id));
  };

  // ─── FILTRAGEM ───
  const contatosFiltrados = contatos.filter(c => {
    const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
    const matchBusca = !busca ||
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca) ||
      (c.email || "").toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca;
  });

  const anunciosFiltrados = anuncios.filter(a => {
    const matchStatus = filtroStatus === "todos" || a.status === filtroStatus;
    const matchBusca = !busca ||
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.telefone.includes(busca) ||
      (a.email || "").toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca;
  });

  // ─── BADGES DE CONTAGEM ───
  const novosContatos = contatos.filter(c => c.status === "novo").length;
  const novosAnuncios = anuncios.filter(a => a.status === "novo").length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32">
      <Loader2 className="animate-spin text-green-700" size={40} />
      <p className="text-gray-500 font-bold mt-4">Carregando mensagens...</p>
    </div>
  );

  const lista = aba === "contatos" ? contatosFiltrados : anunciosFiltrados;

  return (
    <div className="space-y-8">

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-1 h-8 bg-green-600 rounded-full"></div>
            Central de Mensagens
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-7">
            Gerencie contatos e solicitações de anúncio
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
        >
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {/* ─── STATS RÁPIDOS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-2xl border border-red-200">
          <p className="text-3xl font-black text-red-900">{novosContatos + novosAnuncios}</p>
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider mt-1">Novos (total)</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200">
          <p className="text-3xl font-black text-blue-900">
            {contatos.filter(c => c.status === "em_contato").length + anuncios.filter(a => a.status === "em_contato").length}
          </p>
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mt-1">Em Contato</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl border border-green-200">
          <p className="text-3xl font-black text-green-900">{contatos.length}</p>
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider mt-1">Contatos</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-2xl border border-amber-200">
          <p className="text-3xl font-black text-amber-900">{anuncios.length}</p>
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mt-1">Anúncios</p>
        </div>
      </div>

      {/* ─── ABAS ────────────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          onClick={() => setAba("contatos")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition-all border-2
            ${aba === "contatos"
              ? "bg-[#0f2e20] text-white border-[#0f2e20] shadow-lg"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
        >
          <MessageSquare size={16} />
          Contatos
          {novosContatos > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {novosContatos}
            </span>
          )}
        </button>

        <button
          onClick={() => setAba("anuncios")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition-all border-2
            ${aba === "anuncios"
              ? "bg-amber-600 text-white border-amber-600 shadow-lg"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
        >
          <Home size={16} />
          Quer Anunciar
          {novosAnuncios > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {novosAnuncios}
            </span>
          )}
        </button>
      </div>

      {/* ─── FILTROS ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* BUSCA */}
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 transition-all"
          />
          {busca && (
            <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* FILTRO STATUS */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-black text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter size={12} /> Status:
          </span>
          {(["todos", "novo", "visto", "em_contato", "finalizado"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all
                ${filtroStatus === s
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
            >
              {s === "todos" ? "Todos" : s === "em_contato" ? "Em Contato" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── RESULTADO ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-sm text-gray-500 font-bold mb-4">
          Mostrando <span className="text-gray-900">{lista.length}</span> {aba === "contatos" ? "contato(s)" : "anúncio(s)"}
        </p>

        {lista.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {aba === "contatos" ? <MessageSquare className="text-gray-300" size={32} /> : <Home className="text-gray-300" size={32} />}
            </div>
            <h3 className="text-lg font-black text-gray-600">Nenhum resultado</h3>
            <p className="text-gray-400 text-sm mt-1">
              {busca || filtroStatus !== "todos"
                ? "Tente ajustar os filtros de busca"
                : `Nenhum ${aba === "contatos" ? "contato" : "anúncio"} recebido ainda`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {aba === "contatos"
              ? (contatosFiltrados as Contato[]).map((c) => (
                  <ContatoCard
                    key={c.id}
                    item={c}
                    onStatusChange={handleContatoStatus}
                    onAnotacaoSave={handleContatoAnotacao}
                    onDelete={handleContatoDelete}
                  />
                ))
              : (anunciosFiltrados as Anuncio[]).map((a) => (
                  <AnuncioCard
                    key={a.id}
                    item={a}
                    onStatusChange={handleAnuncioStatus}
                    onAnotacaoSave={handleAnuncioAnotacao}
                    onDelete={handleAnuncioDelete}
                  />
                ))
            }
          </div>
        )}
      </div>
    </div>
  );
}