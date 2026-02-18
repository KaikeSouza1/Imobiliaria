"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, Plus, Power, Loader2, Home, Building2, TreePine, Store, CheckCircle, XCircle, TrendingUp } from "lucide-react";

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
  { value: "Todos",      label: "Todos",       icon: Home,      color: "from-gray-600 to-gray-800" },
  { value: "Casa",       label: "Casas",       icon: Home,      color: "from-blue-600 to-blue-800" },
  { value: "Apartamento",label: "Apartamentos",icon: Building2, color: "from-purple-600 to-purple-800" },
  { value: "Terreno",    label: "Terrenos",    icon: TreePine,  color: "from-green-600 to-green-800" },
  { value: "Comercial",  label: "Comerciais",  icon: Store,     color: "from-orange-600 to-orange-800" },
];

export default function AdminImoveisPage() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("Todos");
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

  const imoveisFiltrados = imoveis.filter(im => {
    const matchTipo = filtroTipo === "Todos" || im.tipo === filtroTipo;
    const matchStatus =
      filtroStatus === "Todos" ||
      (filtroStatus === "Ativos" && im.ativo) ||
      (filtroStatus === "Inativos" && !im.ativo) ||
      (filtroStatus === "Vendidos/Alugados" && (im.status === "vendido" || im.status === "alugado"));
    return matchTipo && matchStatus;
  });

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
          <p className="text-gray-500 text-sm mt-1 ml-7">Gerencie todo o portfólio da imobiliária em um só lugar</p>
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

      {/* FILTROS POR TIPO */}
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Filtrar por Tipo</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {tiposConfig.map((tipo) => {
            const Icon = tipo.icon;
            const count = tipo.value === "Todos" ? imoveis.length : imoveis.filter(i => i.tipo === tipo.value).length;
            const isActive = filtroTipo === tipo.value;
            return (
              <button
                key={tipo.value}
                onClick={() => setFiltroTipo(tipo.value)}
                className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 group
                  ${isActive
                    ? `bg-gradient-to-br ${tipo.color} text-white shadow-lg scale-105`
                    : "bg-white border-2 border-gray-100 hover:border-gray-300 text-gray-600 hover:shadow-md"
                  }`}
              >
                <div className="relative z-10">
                  <Icon size={28} className="mb-2" />
                  <p className="font-black text-lg">{count}</p>
                  <p className="text-xs font-bold opacity-90">{tipo.label}</p>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTROS POR STATUS */}
      <div className="flex gap-2 flex-wrap">
        {["Todos", "Ativos", "Inativos", "Vendidos/Alugados"].map(status => (
          <button
            key={status}
            onClick={() => setFiltroStatus(status)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
              ${filtroStatus === status
                ? "bg-gray-900 text-white shadow-md"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* GRID DE IMÓVEIS */}
      {imoveisFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
          <Home className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-600">Nenhum imóvel encontrado</h3>
          <p className="text-gray-400 mt-2">Ajuste os filtros ou cadastre um novo imóvel</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imoveisFiltrados.map((im) => (
            <div
              key={im.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-green-200 transition-all duration-300 group"
            >
              {/* IMAGEM COM FALLBACK */}
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                <ImgAdmin src={im.imagem_url} alt={im.titulo} />

                {/* BADGES */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-sm
                    ${im.finalidade === "Venda" ? "bg-blue-600" : "bg-green-600"}`}>
                    {im.finalidade}
                  </span>
                  {!im.ativo && (
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-600 text-white shadow-lg">
                      Inativo
                    </span>
                  )}
                  {im.status === "vendido" && (
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#0f2e20] text-white shadow-lg">
                      Vendido
                    </span>
                  )}
                  {im.status === "alugado" && (
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#1a5c35] text-white shadow-lg">
                      Alugado
                    </span>
                  )}
                  {(!im.imagem_url || im.imagem_url.trim() === "") && (
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-lg">
                      Sem foto
                    </span>
                  )}
                </div>

                {/* TIPO ICON */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-lg">
                  {IconeTipo(im.tipo)}
                </div>
              </div>

              {/* INFO */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm line-clamp-1 mb-1">{im.titulo}</h3>
                <p className="text-xs text-gray-500 mb-3">{im.bairro}, {im.cidade}</p>
                <p className="text-lg font-black text-green-700 mb-4">
                  R$ {Number(im.preco).toLocaleString("pt-BR")}
                </p>

                {/* AÇÕES */}
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
                      im.ativo
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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