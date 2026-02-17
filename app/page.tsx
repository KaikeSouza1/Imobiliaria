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
          // Filtra apenas os ativos para exibir no site
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

  // --- FILTROS DINÂMICOS ---
  
  // Lista de cidades disponíveis
  const dynamicCities = useMemo(() => {
    const cities = Array.from(new Set(imoveis.map(i => i.cidade))).filter(Boolean).sort();
    return [{ label: "Todas as Cidades", value: "" }, ...cities.map(c => ({ label: c, value: c }))];
  }, [imoveis]);

  // Lista de bairros (filtra baseado na cidade selecionada)
  const dynamicBoroughs = useMemo(() => {
    let source = imoveis;
    // Se tiver cidade selecionada, mostra apenas bairros daquela cidade
    if (filters.cidade) {
      source = imoveis.filter(i => i.cidade === filters.cidade);
    }
    const boroughs = Array.from(new Set(source.map(i => i.bairro))).filter(Boolean).sort();
    return [{ label: "Todos os Bairros", value: "" }, ...boroughs.map(b => ({ label: b, value: b }))];
  }, [imoveis, filters.cidade]);

  // --- SEPARAÇÃO DE DESTAQUES ---
  const mapToCard = (imovel: Imovel) => ({
    ...imovel,
    preco: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.preco),
    imagem: imovel.imagem_url || "/logo_nova.png"
  });

  const destaquesVenda = imoveis
    .filter(i => i.finalidade === "Venda" && i.destaque)
    .map(mapToCard);

  const destaquesLocacao = imoveis
    .filter(i => (i.finalidade === "Aluguel" || i.finalidade === "Locação") && i.destaque)
    .map(mapToCard);

  // --- BUSCA INTELIGENTE ---
  const handleSearch = () => {
    // 1. Prioridade: Busca por Código (Redirecionamento Inteligente)
    if (filters.codigo) {
      // Procura o imóvel na lista carregada
      const imovelEncontrado = imoveis.find(i => i.codigo.toLowerCase() === filters.codigo.toLowerCase());
      
      if (imovelEncontrado) {
        // Se achou, verifica se é Venda ou Aluguel e manda pra página certa
        const isLocacao = imovelEncontrado.finalidade === "Aluguel" || imovelEncontrado.finalidade === "Locação";
        const rota = isLocacao ? "/imoveis/aluguel" : "/imoveis/venda";
        router.push(`${rota}?codigo=${filters.codigo}`);
      } else {
        // Se não achou, avisa (ou manda para venda generico com aviso)
        alert("Imóvel com este código não encontrado.");
      }
      return;
    }

    // 2. Busca por Filtros Normais
    const baseRoute = filters.finalidade === "Alugar" || filters.finalidade === "Aluguel" ? "/imoveis/aluguel" : "/imoveis/venda";
    const params = new URLSearchParams();
    if (filters.tipo) params.append("tipo", filters.tipo);
    if (filters.cidade) params.append("cidade", filters.cidade);
    if (filters.bairro) params.append("bairro", filters.bairro);
    
    router.push(`${baseRoute}?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    // Se mudar a cidade, limpa o bairro para evitar bairro de outra cidade selecionado
    if (key === "cidade") {
      setFilters(prev => ({ ...prev, cidade: value, bairro: "" }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans overflow-x-hidden relative">
      
      {/* HERO SECTION */}
      <section className="relative h-[650px] w-full flex items-center justify-center z-10">
        <div className="absolute inset-0 z-0">
           <Image src="/banner.jpg" alt="Banner" fill className="object-cover" priority />
        </div>
        <div className="absolute inset-0 z-1 bg-black/60"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full text-center mt-10">
          <h1 className="text-4xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl uppercase tracking-tighter italic">
            Porto Iguaçu
          </h1>
          <p className="text-lg md:text-2xl text-white/90 font-bold uppercase tracking-widest border-t border-white/20 pt-6">
            Sua imobiliária de confiança
          </p>
        </div>
      </section>

      {/* BARRA DE BUSCA */}
      <div className="relative -mt-24 z-30 px-4">
        <div className="max-w-6xl mx-auto bg-[#0f2e20] rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-8 md:p-10">
            <h2 className="text-xl font-black text-white flex items-center gap-3 mb-8 uppercase tracking-widest">
              Encontre seu imóvel
              <div className="h-1 w-12 bg-green-500 rounded-full"></div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CustomSelect label="Finalidade" icon={<Key size={14}/>} value={filters.finalidade} onChange={(v) => handleFilterChange('finalidade', v)} options={[{ label: "Comprar", value: "Comprar" }, { label: "Alugar", value: "Alugar" }]} />
              <CustomSelect label="Tipo" icon={<Home size={14}/>} value={filters.tipo} onChange={(v) => handleFilterChange('tipo', v)} options={[{ label: "Todos os Tipos", value: "" }, { label: "Casa", value: "Casa" }, { label: "Apartamento", value: "Apartamento" }, { label: "Terreno", value: "Terreno" }, { label: "Comercial", value: "Comercial" }]} />
              <CustomSelect label="Cidade" icon={<MapPin size={14}/>} value={filters.cidade} onChange={(v) => handleFilterChange('cidade', v)} options={dynamicCities} />
              <CustomSelect label="Bairro" icon={<LayoutGrid size={14}/>} value={filters.bairro} onChange={(v) => handleFilterChange('bairro', v)} options={dynamicBoroughs} />
            </div>
          </div>
          <div className="bg-black/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5">
            <div className="relative w-full md:w-80">
              <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
              <input type="text" placeholder="Código do imóvel..." className="w-full bg-white/10 border border-white/10 text-white text-sm font-bold rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-white/30" value={filters.codigo} onChange={(e) => handleFilterChange('codigo', e.target.value)} />
            </div>
            <button onClick={handleSearch} className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white rounded-xl font-black py-4 px-16 transition-all flex items-center justify-center gap-3 shadow-xl uppercase tracking-widest text-sm">
              <Search size={20} strokeWidth={3} /> Buscar
            </button>
          </div>
        </div>
      </div>

      {/* --- SEÇÃO 1: DESTAQUES VENDA --- */}
      <section className="max-w-[1400px] mx-auto px-4 mt-24 mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 px-2">
          <div>
            <span className="text-green-600 font-black uppercase tracking-[0.2em] text-xs mb-2 block flex items-center gap-2">
              <Star size={14} className="fill-green-600" /> Oportunidades Exclusivas
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter">
              Destaques para Venda
            </h2>
          </div>
          <Link href="/imoveis/venda" className="hidden md:flex items-center gap-2 bg-[#0f2e20] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg">
            Ver Todos Venda <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-700" size={40} /></div>
        ) : destaquesVenda.length > 0 ? (
          <PropertyCarousel items={destaquesVenda} />
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-400 font-bold uppercase tracking-widest">Nenhum destaque de venda cadastrado</p>
          </div>
        )}

        <Link href="/imoveis/venda" className="md:hidden mt-6 flex items-center justify-center gap-2 w-full bg-[#0f2e20] text-white px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest">
            Ver Todos Venda <ArrowRight size={16} />
        </Link>
      </section>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </div>

      {/* --- SEÇÃO 2: DESTAQUES LOCAÇÃO --- */}
      <section className="max-w-[1400px] mx-auto px-4 mt-16 mb-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 px-2">
          <div>
            <span className="text-blue-600 font-black uppercase tracking-[0.2em] text-xs mb-2 block flex items-center gap-2">
              <CheckCircle2 size={14} /> Prontos para Morar
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter">
              Destaques para Locação
            </h2>
          </div>
          <Link href="/imoveis/aluguel" className="hidden md:flex items-center gap-2 bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg">
            Ver Todos Locação <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-700" size={40} /></div>
        ) : destaquesLocacao.length > 0 ? (
          <PropertyCarousel items={destaquesLocacao} />
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-400 font-bold uppercase tracking-widest">Nenhum destaque de locação cadastrado</p>
          </div>
        )}

        <Link href="/imoveis/aluguel" className="md:hidden mt-6 flex items-center justify-center gap-2 w-full bg-blue-700 text-white px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest">
            Ver Todos Locação <ArrowRight size={16} />
        </Link>
      </section>

      <HomeContact />

      <div className="bg-[#0a1f16] py-4 text-center relative z-20">
        <Link href="/login" className="text-[10px] text-green-800 hover:text-green-500 uppercase font-black tracking-[0.4em] transition-all opacity-40 hover:opacity-100 flex items-center justify-center gap-2">
          <Lock size={12} /> Área Restrita
        </Link>
      </div>

    </main>
  );
}