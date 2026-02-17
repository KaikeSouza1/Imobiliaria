"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image"; 
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { Search, MapPin, Home, Key, ArrowRight, CheckCircle2, Hash, LayoutGrid, Lock, Loader2, Star } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import CustomSelect from "@/components/CustomSelect"; 
import HomeContact from "@/components/HomeContact";
import PropertyCarousel from "@/components/PropertyCarousel";

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
  destaque: boolean;
}

export default function Page() {
  const router = useRouter();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    finalidade: "Comprar",
    tipo: "",
    cidade: "",
    bairro: "",
    codigo: ""
  });

  useEffect(() => {
    async function fetchImoveis() {
      try {
        const res = await fetch("/api/imoveis");
        if (res.ok) {
          const data = await res.json();
          setImoveis(data.filter((item: Imovel) => item.ativo));
        }
      } catch (error) {
        console.error("Erro ao buscar imóveis:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchImoveis();
  }, []);

  const dynamicCities = useMemo(() => {
    const cities = Array.from(new Set(imoveis.map(i => i.cidade))).filter(Boolean).sort();
    return [{ label: "Todas", value: "" }, ...cities.map(c => ({ label: c, value: c }))];
  }, [imoveis]);

  const dynamicBoroughs = useMemo(() => {
    const boroughs = Array.from(new Set(imoveis.map(i => i.bairro))).filter(Boolean).sort();
    return [{ label: "Todos", value: "" }, ...boroughs.map(b => ({ label: b, value: b }))];
  }, [imoveis]);

  const mapToCard = (imovel: Imovel) => ({
    ...imovel,
    preco: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.preco),
    imagem: imovel.imagem_url || "/logo_nova.png"
  });

  // Pega TODOS os destaques para o carrossel (sem slice)
  const destaquesVenda = imoveis
    .filter(i => i.finalidade === "Venda" && i.destaque)
    .map(mapToCard);

  const destaquesLocacao = imoveis
    .filter(i => (i.finalidade === "Aluguel" || i.finalidade === "Locação") && i.destaque)
    .map(mapToCard);

  const handleSearch = () => {
    if (filters.codigo) {
      router.push(`/imoveis/venda?codigo=${filters.codigo}`);
      return;
    }
    const baseRoute = filters.finalidade === "Alugar" ? "/imoveis/aluguel" : "/imoveis/venda";
    const params = new URLSearchParams();
    if (filters.tipo) params.append("tipo", filters.tipo);
    if (filters.cidade) params.append("cidade", filters.cidade);
    if (filters.bairro) params.append("bairro", filters.bairro);
    router.push(`${baseRoute}?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans overflow-x-hidden relative">
      
      {/* === HERO ORIGINAL === */}
      <section className="relative h-[750px] w-full flex items-center justify-center overflow-hidden z-10">
        <div className="absolute inset-0 z-0">
           <Image src="/banner.jpg" alt="Banner" fill className="object-cover" priority />
        </div>
        <div className="absolute inset-0 z-1 bg-black/60"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full text-center mt-20">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl uppercase tracking-wide">
            Bem-Vindo À Imobiliária Porto Iguaçu
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-4xl mx-auto leading-relaxed drop-shadow-md font-medium">
            Na Imobiliária Porto Iguaçu, conectamos sonhos aos endereços certos. Com experiência no mercado imobiliário das gêmeas do Iguaçu, nossa equipe de especialistas está aqui para ajudá-lo a encontrar o lar perfeito ou o investimento ideal.
          </p>
        </div>
      </section>

      {/* === BARRA DE BUSCA ORIGINAL === */}
      <div className="relative -mt-32 z-30 px-4">
        <div className="max-w-6xl mx-auto bg-[#0f2e20] rounded-[2rem] shadow-2xl border border-green-800 relative font-bold overflow-hidden">
          <div className="p-8 pb-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-8 uppercase tracking-tight">
              ENCONTRE SEU IMÓVEL AQUI
              <div className="h-1.5 w-12 bg-white rounded-full hidden md:block"></div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              <CustomSelect label="Finalidade" icon={<Key size={14} className="text-white"/>} value={filters.finalidade} onChange={(v) => handleFilterChange('finalidade', v)} options={[{ label: "Comprar", value: "Comprar" }, { label: "Alugar", value: "Alugar" }]} />
              <CustomSelect label="Tipo" icon={<Home size={14} className="text-white"/>} value={filters.tipo} onChange={(v) => handleFilterChange('tipo', v)} options={[{ label: "Todos", value: "" }, { label: "Casa", value: "Casa" }, { label: "Apartamento", value: "Apartamento" }, { label: "Terreno", value: "Terreno" }, { label: "Comercial", value: "Comercial" }]} />
              <CustomSelect label="Cidade" icon={<MapPin size={14} className="text-white"/>} value={filters.cidade} onChange={(v) => handleFilterChange('cidade', v)} options={dynamicCities} />
              <CustomSelect label="Bairro" icon={<LayoutGrid size={14} className="text-white"/>} value={filters.bairro} onChange={(v) => handleFilterChange('bairro', v)} options={dynamicBoroughs} />
            </div>
          </div>
          <div className="bg-[#0a1f16]/50 border-t border-green-800/50 p-6 flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-[2rem]">
            <div className="w-full md:w-auto flex items-center gap-3">
              <span className="text-xs font-black text-white uppercase hidden md:block tracking-wide">BUSCAR POR CÓDIGO:</span>
              <div className="relative group w-full md:w-64">
                <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                <input type="text" placeholder="Digite o código..." className="w-full bg-white text-gray-800 border-none text-sm font-black rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-500 transition-all placeholder:text-gray-400 shadow-md" value={filters.codigo} onChange={(e) => handleFilterChange('codigo', e.target.value)} />
              </div>
            </div>
            <button onClick={handleSearch} className="w-full md:w-auto bg-[#009c3b] hover:bg-white hover:text-[#009c3b] text-white rounded-xl font-black py-3 px-12 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 text-sm uppercase tracking-wider transform hover:-translate-y-1">
              <Search size={18} strokeWidth={3} /> Procurar
            </button>
          </div>
        </div>
      </div>

      {/* === DESTAQUES PARA VENDA === */}
      <section className="max-w-[1400px] mx-auto px-4 mt-24 mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <span className="text-green-700 font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} /> Oportunidades Exclusivas
            </span>
            <h2 className="text-4xl font-extrabold text-slate-900">Imóveis Destaques para Venda</h2>
          </div>
          <Link href="/imoveis/venda" className="hidden md:flex items-center gap-2 text-slate-700 font-bold hover:text-green-700 transition-colors bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100 hover:shadow-md">
            Ver todos à venda <ArrowRight size={16}/>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center">
            <Loader2 className="animate-spin mb-2" size={30} /> Carregando...
          </div>
        ) : destaquesVenda.length > 0 ? (
          <PropertyCarousel items={destaquesVenda} />
        ) : (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-bold">Nenhum imóvel em destaque para venda.</p>
          </div>
        )}

        <Link href="/imoveis/venda" className="md:hidden mt-8 flex items-center justify-center gap-2 w-full bg-white text-slate-700 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest border border-gray-200">
            Ver Todos Venda <ArrowRight size={16} />
        </Link>
      </section>

      <div className="max-w-7xl mx-auto px-4 relative z-10"><div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div></div>

      {/* === DESTAQUES PARA LOCAÇÃO === */}
      <section className="max-w-[1400px] mx-auto px-4 mt-16 mb-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <span className="text-blue-700 font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} /> Prontos para morar
            </span>
            <h2 className="text-4xl font-extrabold text-slate-900">Imóveis Destaques para Locação</h2>
          </div>
          <Link href="/imoveis/aluguel" className="hidden md:flex items-center gap-2 text-slate-700 font-bold hover:text-blue-700 transition-colors bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100 hover:shadow-md">
            Ver todos para alugar <ArrowRight size={16}/>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center">
            <Loader2 className="animate-spin mb-2" size={30} /> Carregando...
          </div>
        ) : destaquesLocacao.length > 0 ? (
          <PropertyCarousel items={destaquesLocacao} />
        ) : (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-bold">Nenhum imóvel em destaque para locação.</p>
          </div>
        )}

        <Link href="/imoveis/aluguel" className="md:hidden mt-8 flex items-center justify-center gap-2 w-full bg-white text-slate-700 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest border border-gray-200">
            Ver Todos Locação <ArrowRight size={16} />
        </Link>
      </section>

      <HomeContact />

      <div className="bg-[#0a1f16] pb-2 text-center relative z-20">
        <Link href="/login" className="inline-flex items-center gap-2 text-[10px] text-green-800 hover:text-green-500 uppercase font-bold tracking-widest transition-colors opacity-50 hover:opacity-100 px-4 py-2">
          <Lock size={10} /> Área Restrita
        </Link>
      </div>

    </main>
  );
}