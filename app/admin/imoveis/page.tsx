"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, Plus, Power, Loader2, Home, Building2, TreePine, Store, CheckCircle, XCircle, TrendingUp, Search, X, SlidersHorizontal } from "lucide-react";

interface Imovel {
  id: number;
  titulo: string;
  preco: number;
  tipo: string;
  finalidade: string;
  cidade: string;
  bairro: string;
  imagem_url: string;
  ativo: boolean;
  status: string;
  codigo: string;
  destaque: boolean;
}

const FALLBACK = "/sem-foto.jpg";

function ImgAdmin({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src && src.trim() !== "" ? src : FALLBACK);
  return (
    <Image
      src={imgSrc}
      fill
      className="object-cover group-hover:scale-110 transition-transform duration-500"
      alt={alt}
      onError={() => setImgSrc(FALLBACK)}
    />
  );
}

const tiposConfig = [
  { value: "Todos",       label: "Todos",        icon: Home,      color: "from-gray-600 to-gray-800" },
  { value: "Casa",        label: "Casas",        icon: Home,      color: "from-blue-600 to-blue-800" },
  { value: "Apartamento", label: "Apartamentos", icon: Building2, color: "from-purple-600 to-purple-800" },
  { value: "Terreno",     label: "Terrenos",     icon: TreePine,  color: "from-green-600 to-green-800" },
  { value: "Comercial",   label: "Comerciais",   icon: Store,     color: "from-orange-600 to-orange-800" },
];

export default function AdminImoveisPage() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  // ── FILTROS ──
  const [busca, setBusca] = useState("");
  const [filtroCodigo, setFiltroCodigo] = useState("");
  const [filtroCidade, setFiltroCidade] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroFinalidade, setFiltroFinalidade] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const fetchImoveis = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/imoveis");
      const data = await res.json();
      setImoveis(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImoveis(); }, []);

  const toggleAtivo = async (imovel: Imovel) => {
    try {
      const res = await fetch(`/api/imoveis/${imovel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...imovel, ativo: !imovel.ativo })
      });
      if (res.ok) fetchImoveis();
    } catch {
      alert("Erro ao mudar status");
    }
  };

  const handleExcluir = async (id: number) => {
    if (!confirm("Confirma exclusão permanente deste imóvel?")) return;
    try {
      const res = await fetch(`/api/imoveis/${id}`, { method: "DELETE" });
      if (res.ok) setImoveis(prev => prev.filter(im => im.id !== id));
    } catch {
      alert("Erro ao excluir");
    }
  };

  // ── CIDADES DINÂMICAS ──
  const cidades = useMemo(() => {
    const set = Array.from(new Set(imoveis.map(i => i.cidade).filter(Boolean))).sort();
    return ["Todas", ...set];
  }, [imoveis]);

  // ── FILTRAGEM COMBINADA ──
  const imoveisFiltrados = useMemo(() => {
    return imoveis.filter(im => {
      // Busca geral (título)
      if (busca && !im.titulo?.toLowerCase().includes(busca.toLowerCase())) return false;
      // Código
      if (filtroCodigo && !im.codigo?.toLowerCase().includes(filtroCodigo.toLowerCase())) return false;
      // Cidade/Bairro
      if (filtroCidade && filtroCidade !== "Todas") {
        const term = filtroCidade.toLowerCase();
        const inCidade = im.cidade?.toLowerCase().includes(term);
        const inBairro = im.bairro?.toLowerCase().includes(term);
        if (!inCidade && !inBairro) return false;
      }
      // Tipo
      if (filtroTipo !== "Todos" && im.tipo !== filtroTipo) return false;
      // Finalidade
      if (filtroFinalidade !== "Todos" && im.finalidade !== filtroFinalidade) return false;
      // Status
      if (filtroStatus === "Ativos" && !im.ativo) return false;
      if (filtroStatus === "Inativos" && im.ativo) return false;
      if (filtroStatus === "Vendidos" && im.status !== "vendido") return false;
      if (filtroStatus === "Alugados" && im.status !== "alugado") return false;
      if (filtroStatus === "Reservados" && im.status !== "reservado") return false;
      return true;
    });
  }, [imoveis, busca, filtroCodigo, filtroCidade, filtroTipo, filtroFinalidade, filtroStatus]);

  const limparFiltros = () => {
    setBusca("");
    setFiltroCodigo("");
    setFiltroCidade("Todas");
    setFiltroTipo("Todos");
    setFiltroFinalidade("Todos");
    setFiltroStatus("Todos");
  };

  const temFiltrosAtivos =
    busca || filtroCodigo ||
    (filtroCidade && filtroCidade !== "Todas") ||
    filtroTipo !== "Todos" ||
    filtroFinalidade !== "Todos" ||
    filtroStatus !== "Todos";

  const stats = {
    total:    imoveis.length,
    ativos:   imoveis.filter(i => i.ativo).length,
    vendidos: imoveis.filter(i => i.status === "vendido").length,
    alugados: imoveis.filter(i => i.status === "alugado").length,
  };

  const IconeTipo = (tipo: string) => {
    const config = tiposConfig.find(t => t.value === tipo);
    return config ? <config.icon size={20} /> : <Home size={20} />;
  };

  if (loading) return (
    <div className="text-center py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-green-700" size={40} />
      <p className="text-gray-500 font-bold">Carregando painel...</p>
    </div>
  );

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-1 h-8 bg-green-600 rounded-full"></div>
            Gestão de Imóveis
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-7">Gerencie todo o portfólio da imobiliária</p>
        </div>
        <Link
          href="/admin/imoveis/novo"
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> Novo Imóvel
        </Link>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Home className="text-blue-700" size={24} />
            <TrendingUp className="text-blue-400" size={16} />
          </div>
          <p className="text-3xl font-black text-blue-900">{stats.total}</p>
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="text-green-700" size={24} />
            <Power className="text-green-400" size={16} />
          </div>
          <p className="text-3xl font-black text-green-900">{stats.ativos}</p>
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Ativos</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-2xl border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="text-red-700" size={24} />
            <CheckCircle className="text-red-400" size={16} />
          </div>
          <p className="text-3xl font-black text-red-900">{stats.vendidos}</p>
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Vendidos</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-2xl border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="text-orange-700" size={24} />
            <Home className="text-orange-400" size={16} />
          </div>
          <p className="text-3xl font-black text-orange-900">{stats.alugados}</p>
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Alugados</p>
        </div>
      </div>

      {/* ── PAINEL DE BUSCA E FILTROS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* HEADER DO PAINEL */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700 font-black text-sm uppercase tracking-wider">
            <SlidersHorizontal size={16} className="text-green-600" />
            Busca e Filtros
            {temFiltrosAtivos && (
              <span className="bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {imoveisFiltrados.length} resultado{imoveisFiltrados.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="flex items-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <X size={14} /> Limpar tudo
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">

          {/* LINHA 1: BUSCA POR TÍTULO + CÓDIGO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TÍTULO */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Buscar por Título</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ex: Apartamento Centro..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all"
                />
                {busca && (
                  <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* CÓDIGO */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Buscar por Código</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-black">#</span>
                <input
                  type="text"
                  placeholder="Ex: REF-1234"
                  value={filtroCodigo}
                  onChange={e => setFiltroCodigo(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all"
                />
                {filtroCodigo && (
                  <button onClick={() => setFiltroCodigo("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LINHA 2: CIDADE + TIPO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CIDADE */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Cidade / Bairro</label>
              <div className="flex gap-2 flex-wrap">
                {cidades.map(c => (
                  <button
                    key={c}
                    onClick={() => setFiltroCidade(c)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border
                      ${filtroCidade === c || (c === "Todas" && !filtroCidade)
                        ? "bg-[#0f2e20] text-white border-[#0f2e20] shadow-sm"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* FINALIDADE */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Finalidade</label>
              <div className="flex gap-2">
                {["Todos", "Venda", "Aluguel"].map(f => (
                  <button
                    key={f}
                    onClick={() => setFiltroFinalidade(f)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border
                      ${filtroFinalidade === f
                        ? f === "Venda"
                          ? "bg-green-700 text-white border-green-700 shadow-sm"
                          : f === "Aluguel"
                            ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                            : "bg-gray-900 text-white border-gray-900 shadow-sm"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LINHA 3: TIPO */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Tipo de Imóvel</label>
            <div className="flex gap-2 flex-wrap">
              {tiposConfig.map(t => {
                const Icon = t.icon;
                const count = t.value === "Todos" ? imoveis.length : imoveis.filter(i => i.tipo === t.value).length;
                return (
                  <button
                    key={t.value}
                    onClick={() => setFiltroTipo(t.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border
                      ${filtroTipo === t.value
                        ? "bg-[#0f2e20] text-white border-[#0f2e20] shadow-sm"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <Icon size={14} />
                    {t.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black
                      ${filtroTipo === t.value ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LINHA 4: STATUS */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Status</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "Todos",      label: "Todos",      color: "bg-gray-900 text-white border-gray-900" },
                { value: "Ativos",     label: "✅ Ativos",     color: "bg-green-700 text-white border-green-700" },
                { value: "Inativos",   label: "⚫ Inativos",   color: "bg-gray-600 text-white border-gray-600" },
                { value: "Vendidos",   label: "🔴 Vendidos",   color: "bg-red-700 text-white border-red-700" },
                { value: "Alugados",   label: "🟠 Alugados",   color: "bg-orange-600 text-white border-orange-600" },
                { value: "Reservados", label: "🟡 Reservados", color: "bg-yellow-500 text-white border-yellow-500" },
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setFiltroStatus(s.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border
                    ${filtroStatus === s.value
                      ? s.color + " shadow-sm"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RODAPÉ COM CONTAGEM */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500">
            Exibindo <span className="text-gray-900 font-black">{imoveisFiltrados.length}</span> de <span className="text-gray-900 font-black">{imoveis.length}</span> imóveis
            {temFiltrosAtivos && (
              <button onClick={limparFiltros} className="ml-3 text-red-500 hover:underline font-bold">
                Limpar filtros
              </button>
            )}
          </p>
        </div>
      </div>

      {/* GRID DE IMÓVEIS */}
      {imoveisFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
          <Search className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-600">Nenhum imóvel encontrado</h3>
          <p className="text-gray-400 mt-2 text-sm">Tente ajustar os filtros de busca</p>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="mt-4 bg-[#0f2e20] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-800 transition-all"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imoveisFiltrados.map((im) => (
            <div
              key={im.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-green-200 transition-all duration-300 group"
            >
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                <ImgAdmin src={im.imagem_url} alt={im.titulo} />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-sm
                    ${im.finalidade === "Venda" ? "bg-blue-600" : "bg-green-600"}`}>
                    {im.finalidade}
                  </span>
                  {!im.ativo && (
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-red-600 text-white shadow-lg">Inativo</span>
                  )}
                  {im.status === "vendido" && (
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-[#0f2e20] text-white shadow-lg">Vendido</span>
                  )}
                  {im.status === "alugado" && (
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-orange-600 text-white shadow-lg">Alugado</span>
                  )}
                  {im.status === "reservado" && (
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-yellow-500 text-white shadow-lg">Reservado</span>
                  )}
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-lg">
                  {IconeTipo(im.tipo)}
                </div>
              </div>

              <div className="p-4">
                {/* Código */}
                {im.codigo && (
                  <p className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-md inline-block mb-1">
                    #{im.codigo}
                  </p>
                )}
                <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{im.titulo}</h3>
                <p className="text-xs text-gray-500 mb-3">{im.bairro}, {im.cidade}</p>
                <p className="text-lg font-black text-green-700 mb-4">
                  {im.preco === 0
                    ? <span className="text-sm text-gray-500 font-bold">Consultar valores</span>
                    : `R$ ${Number(im.preco).toLocaleString("pt-BR")}`
                  }
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/admin/imoveis/editar/${im.id}`}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <Edit size={14} /> Editar
                  </Link>
                  <button
                    onClick={() => toggleAtivo(im)}
                    className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                      im.ativo ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    title={im.ativo ? "Desativar" : "Ativar"}
                  >
                    <Power size={14} />
                  </button>
                  <button
                    onClick={() => handleExcluir(im.id)}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold text-xs transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}