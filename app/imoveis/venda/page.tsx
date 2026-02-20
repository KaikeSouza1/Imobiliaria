"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, XCircle, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";

interface Imovel {
  id: number;
  titulo: string;
  preco: number;
  tipo: string;
  finalidade: string;
  cidade: string;
  bairro: string;
  endereco: string;
  quartos: number;
  banheiros: number;
  vagas: number;
  area: number;
  imagem_url: string;
  codigo: string;
  ativo: boolean;
  status: string;
}

const categories = [
  { label: "Todos",       value: "" },
  { label: "Apartamentos", value: "Apartamento" },
  { label: "Barracões",   value: "Barracão" },
  { label: "Casas",       value: "Casa" },
  { label: "Comerciais",  value: "Comercial" },
  { label: "Imóveis Rurais", value: "Imóvel Rural" },
  { label: "Sobrados",    value: "Sobrado" },
  { label: "T. Rurais",   value: "Terreno Rural" },
  { label: "T. Urbanos",  value: "Terreno Urbano" },
];

type OrdemTipo = "recentes" | "menor_preco" | "maior_preco" | "menor_area" | "maior_area";

const ORDEM_OPTIONS: { value: OrdemTipo; label: string; icon: React.ReactNode }[] = [
  { value: "recentes",    label: "Mais Recentes",   icon: <ArrowUpDown size={14} /> },
  { value: "menor_preco", label: "Menor Preço",      icon: <ArrowUp size={14} /> },
  { value: "maior_preco", label: "Maior Preço",      icon: <ArrowDown size={14} /> },
  { value: "menor_area",  label: "Menor Área",       icon: <ArrowUp size={14} /> },
  { value: "maior_area",  label: "Maior Área",       icon: <ArrowDown size={14} /> },
];

function ordenarImoveis(lista: Imovel[], ordem: OrdemTipo): Imovel[] {
  const copia = [...lista];
  switch (ordem) {
    case "menor_preco": return copia.sort((a, b) => a.preco - b.preco);
    case "maior_preco": return copia.sort((a, b) => b.preco - a.preco);
    case "menor_area":  return copia.sort((a, b) => a.area - b.area);
    case "maior_area":  return copia.sort((a, b) => b.area - a.area);
    default:            return copia;
  }
}

function VendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tipoUrl   = searchParams.get("tipo") || "";
  const cidadeUrl = searchParams.get("cidade");
  const bairroUrl = searchParams.get("bairro");
  const codigoUrl = searchParams.get("codigo");

  const [imoveis, setImoveis]   = useState<Imovel[]>([]);
  const [loading, setLoading]   = useState(true);
  const [ordem, setOrdem]       = useState<OrdemTipo>("recentes");
  const [showOrdem, setShowOrdem] = useState(false);
  const ordemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ordemRef.current && !ordemRef.current.contains(e.target as Node)) {
        setShowOrdem(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchImoveis() {
      try {
        const res = await fetch("/api/imoveis");
        if (res.ok) {
          const data = await res.json();
          setImoveis(data.filter((item: Imovel) => item.ativo && item.finalidade === "Venda"));
        }
      } catch (error) {
        console.error("Erro ao buscar", error);
      } finally {
        setLoading(false);
      }
    }
    fetchImoveis();
  }, []);

  const imoveisFiltrados = useMemo(() => {
    const filtrados = imoveis.filter((imovel) => {
      if (codigoUrl && imovel.codigo?.toLowerCase() !== codigoUrl.toLowerCase()) return false;
      if (tipoUrl) {
        const tipoImovel = imovel.tipo?.toLowerCase() || "";
        const tipoBusca  = tipoUrl.toLowerCase();
        if (!tipoImovel.includes(tipoBusca)) return false;
      }
      if (cidadeUrl && imovel.cidade !== cidadeUrl) return false;
      if (bairroUrl && imovel.bairro !== bairroUrl) return false;
      return true;
    });
    return ordenarImoveis(filtrados, ordem);
  }, [imoveis, tipoUrl, cidadeUrl, bairroUrl, codigoUrl, ordem]);

  const updateTypeFilter = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newType) params.set("tipo", newType);
    else params.delete("tipo");
    router.push(`/imoveis/venda?${params.toString()}`);
  };

  const limparFiltros = () => {
    setOrdem("recentes");
    router.push("/imoveis/venda");
  };

  const mapToCard = (imovel: Imovel) => ({
    ...imovel,
    preco: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(imovel.preco),
    imagem: imovel.imagem_url || "/logo_nova.png",
  });

  const ordemAtual = ORDEM_OPTIONS.find((o) => o.value === ordem)!;
  const temFiltros = tipoUrl || cidadeUrl || bairroUrl || codigoUrl;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">

        {/* BARRA DE RESUMO + ORDENAÇÃO */}
        <div className="bg-white p-4 rounded-t-2xl shadow-sm border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 font-medium text-sm">
            <span className="font-black text-gray-900 text-lg">{imoveisFiltrados.length}</span> imóveis à venda
            {cidadeUrl && <span> em <span className="font-bold">{cidadeUrl}</span></span>}
            {bairroUrl && <span> · <span className="font-bold">{bairroUrl}</span></span>}
            {codigoUrl && <span> · cód. <span className="font-bold">{codigoUrl}</span></span>}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={ordemRef}>
              <button
                onClick={() => setShowOrdem(!showOrdem)}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                <SlidersHorizontal size={15} />
                <span className="hidden sm:inline">Ordenar:</span>
                <span className="text-green-700">{ordemAtual.label}</span>
              </button>

              {showOrdem && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 min-w-[200px]">
                  {ORDEM_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setOrdem(opt.value); setShowOrdem(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors text-left
                        ${ordem === opt.value
                          ? "bg-green-50 text-green-700"
                          : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      <span className="text-gray-400">{opt.icon}</span>
                      {opt.label}
                      {ordem === opt.value && <span className="ml-auto w-2 h-2 bg-green-600 rounded-full"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {(temFiltros || ordem !== "recentes") && (
              <button
                onClick={limparFiltros}
                className="flex items-center gap-2 text-red-500 font-bold text-sm hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors border border-red-100"
              >
                <XCircle size={16} /> Limpar
              </button>
            )}
          </div>
        </div>

        {/* ABAS DE CATEGORIA */}
        <div className="bg-white p-2 rounded-b-2xl shadow-xl border border-gray-100 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max px-2">
            {categories.map((cat) => {
              const isActive = tipoUrl === cat.value || (cat.value === "" && !tipoUrl);
              const count = cat.value === ""
                ? imoveis.length
                : imoveis.filter((i) => i.tipo === cat.value).length;
              return (
                <button
                  key={cat.label}
                  onClick={() => updateTypeFilter(cat.value)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap
                    ${isActive
                      ? "bg-green-700 text-white shadow-md scale-105"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  {cat.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black
                    ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto px-4 mt-10">
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center text-gray-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p>Carregando imóveis...</p>
          </div>
        ) : imoveisFiltrados.length > 0 ? (
          <>
            {ordem !== "recentes" && (
              <div className="mb-4 flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 px-4 py-2 rounded-xl w-fit">
                {ordemAtual.icon} Ordenado por: {ordemAtual.label}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {imoveisFiltrados.map((imovel) => (
                <PropertyCard key={imovel.id} property={mapToCard(imovel)} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Search size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Não encontramos imóveis à venda com esses filtros.
            </p>
            <button
              onClick={limparFiltros}
              className="mt-8 bg-green-700 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wide hover:bg-green-800 transition-all shadow-lg"
            >
              Ver Todos à Venda
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function VendaPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      <section className="relative h-[350px] bg-[#0f2e20] flex items-end justify-center pb-16">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1920"
            alt="Fundo"
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-black mb-2 uppercase tracking-tighter">Comprar Imóvel</h1>
          <p className="text-green-200 font-medium tracking-wide uppercase text-sm">Encontre as melhores oportunidades</p>
        </div>
      </section>
      <Suspense fallback={<div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-green-700" size={32} /></div>}>
        <VendaContent />
      </Suspense>
    </main>
  );
}