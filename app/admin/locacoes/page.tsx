"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus, Loader2, KeyRound, Wallet, AlertTriangle, FileText,
  Search, X, Eye, Edit, Trash2, Sparkles,
} from "lucide-react";

interface Locacao {
  id: number;
  imovel_id: number;
  imovel_titulo: string;
  imovel_cidade: string;
  imovel_bairro: string;
  locatario_nome: string;
  locatario_cpf: string;
  valor_aluguel: number;
  dia_vencimento: number;
  status: string;
  boletos_atrasados: string;
  total_boletos: string;
}

function formatarCpf(cpf: string) {
  const d = (cpf || "").replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export default function AdminLocacoesPage() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const fetchLocacoes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/locacoes");
      const data = await res.json();
      setLocacoes(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocacoes(); }, []);

  const handleExcluir = async (id: number) => {
    if (!confirm("Confirma excluir este contrato de locação e todos os boletos gerados?")) return;
    const res = await fetch(`/api/admin/locacoes/${id}`, { method: "DELETE" });
    if (res.ok) setLocacoes((prev) => prev.filter((l) => l.id !== id));
  };

  const filtradas = useMemo(() => {
    return locacoes.filter((l) => {
      if (busca) {
        const termo = busca.toLowerCase();
        const alvo = `${l.locatario_nome} ${l.locatario_cpf} ${l.imovel_titulo}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      if (filtroStatus !== "Todos" && l.status !== filtroStatus) return false;
      return true;
    });
  }, [locacoes, busca, filtroStatus]);

  const stats = {
    total: locacoes.length,
    ativos: locacoes.filter((l) => l.status === "ativo").length,
    receitaMensal: locacoes.filter((l) => l.status === "ativo").reduce((acc, l) => acc + Number(l.valor_aluguel || 0), 0),
    atrasados: locacoes.reduce((acc, l) => acc + Number(l.boletos_atrasados || 0), 0),
  };

  if (loading) return (
    <div className="text-center py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-green-700" size={40} />
      <p className="text-gray-500 font-bold">Carregando contratos...</p>
    </div>
  );

  return (
    <div className="space-y-8">

      {/* AVISO DE DEMONSTRAÇÃO */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4 text-sm font-medium">
        <Sparkles className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
        <p>
          <strong>Módulo em demonstração:</strong> os boletos gerados aqui são fictícios (código de barras e linha digitável simulados),
          apenas para mostrar o fluxo completo. A integração com um banco/emissor real de boletos fica para uma próxima etapa.
        </p>
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-1 h-8 bg-green-600 rounded-full"></div>
            Controle de Locações
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-7">Contratos de aluguel, locatários e boletos</p>
        </div>
        <Link
          href="/admin/locacoes/novo"
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> Nova Locação
        </Link>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200">
          <FileText className="text-blue-700 mb-2" size={24} />
          <p className="text-3xl font-black text-blue-900">{stats.total}</p>
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Contratos</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl border border-green-200">
          <KeyRound className="text-green-700 mb-2" size={24} />
          <p className="text-3xl font-black text-green-900">{stats.ativos}</p>
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Ativos</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-2xl border border-emerald-200">
          <Wallet className="text-emerald-700 mb-2" size={24} />
          <p className="text-2xl font-black text-emerald-900">
            {stats.receitaMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Receita Mensal Prevista</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-2xl border border-red-200">
          <AlertTriangle className="text-red-700 mb-2" size={24} />
          <p className="text-3xl font-black text-red-900">{stats.atrasados}</p>
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Boletos em Atraso</p>
        </div>
      </div>

      {/* BUSCA E FILTROS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por locatário, CPF ou imóvel..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all"
          />
          {busca && (
            <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Todos", "ativo", "encerrado"].map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border capitalize
                ${filtroStatus === s ? "bg-[#0f2e20] text-white border-[#0f2e20] shadow-sm" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`}
            >
              {s === "Todos" ? "Todos" : s}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA */}
      {filtradas.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
          <KeyRound className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-600">Nenhuma locação cadastrada</h3>
          <p className="text-gray-400 mt-2 text-sm">Clique em "Nova Locação" para cadastrar o primeiro contrato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtradas.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-green-200 transition-all duration-300 p-5">
              <div className="flex items-start justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white
                  ${l.status === "ativo" ? "bg-green-600" : "bg-gray-500"}`}>
                  {l.status}
                </span>
                {Number(l.boletos_atrasados) > 0 && (
                  <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white bg-red-600">
                    {l.boletos_atrasados} em atraso
                  </span>
                )}
              </div>

              <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{l.imovel_titulo || "Imóvel não vinculado"}</h3>
              <p className="text-xs text-gray-500 mb-3">{l.imovel_bairro}, {l.imovel_cidade}</p>

              <div className="border-t border-gray-100 pt-3 space-y-1 mb-4">
                <p className="text-sm font-bold text-gray-800">{l.locatario_nome}</p>
                <p className="text-xs text-gray-500">CPF {formatarCpf(l.locatario_cpf)}</p>
                <p className="text-xs text-gray-500">Vencimento todo dia {l.dia_vencimento}</p>
              </div>

              <p className="text-lg font-black text-green-700 mb-4">
                {Number(l.valor_aluguel).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                <span className="text-xs text-gray-400 font-bold">/mês</span>
              </p>

              <div className="flex gap-2">
                <Link
                  href={`/admin/locacoes/${l.id}`}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <Eye size={14} /> Detalhes
                </Link>
                <Link
                  href={`/admin/locacoes/editar/${l.id}`}
                  className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-bold text-xs transition-all"
                  title="Editar"
                >
                  <Edit size={14} />
                </Link>
                <button
                  onClick={() => handleExcluir(l.id)}
                  className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold text-xs transition-all"
                  title="Excluir"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
