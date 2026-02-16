"use client";

import { useState, useEffect } from "react";
import Image from "next/image"; 
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import { Search, MapPin, Home, Key, ArrowRight, CheckCircle2, Hash, LayoutGrid, Lock, Loader2 } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import CustomSelect from "@/components/CustomSelect"; // Certifique-se que este componente suporta z-index alto
import HomeContact from "@/components/HomeContact";

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

  const destaquesVenda = imoveis.filter(i => i.finalidade === "Venda").slice(0, 3);
  const destaquesAluguel = imoveis.filter(i => i.finalidade === "Aluguel" || i.finalidade === "Locação").slice(0, 3);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSearch = () => {
    if (filters.codigo) {
      router.push(`/imoveis/venda?codigo=${filters.codigo}`);
      return;
    }
    const baseRoute = filters.finalidade === "Aluguel" ? "/imoveis/aluguel" : "/imoveis/venda";
    const params = new URLSearchParams();
    if (filters.tipo) params.append("tipo", filters.tipo);
    if (filters.cidade) params.append("cidade", filters.cidade);
    router.push(`${baseRoute}?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const mapToCard = (imovel: Imovel) => ({
    ...imovel,
    preco: formatMoney(imovel.preco),
    imagem: imovel.imagem_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800"
  });

  return (
    <main className="min-h-screen bg-slate-50 font-sans overflow-x-hidden relative">
      
      {/* Luzes de Fundo */}
      <div className="absolute top-[600px] -left-20 w-[500px] h-[500px] bg-green-200/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[1200px] -right-20 w-[600px] h-[600px] bg-green-100/50 rounded-full blur-[120px] pointer-events-none"></div>

      {/* === HERO SECTION === */}
      <section className="relative h-[700px] w-full flex items-center overflow-hidden z-10">
        <div className="absolute inset-0 z-0">
           <Image src="/banner.jpg" alt="Banner" fill className="object-cover" priority />
        </div>
        <div className="absolute inset-0 z-1 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-10">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 drop-shadow-xl">
            Aqui seu sonho <br/> <span className="text-green-400">acontece!</span>
          </h1>
          <p className="text-xl text-white max-w-xl mb-10 font-medium border-l-4 border-green-500 pl-6 drop-shadow-md">
            Clique no botão abaixo e confira nossos imóveis exclusivos selecionados para você.
          </p>
          <Link href="/imoveis/venda" className="inline-flex bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-1 items-center gap-3">
            Quero conferir!
          </Link>
        </div>
      </section>

      {/* === BARRA DE BUSCA (CORREÇÃO AQUI) === */}
      <div className="relative -mt-32 z-30 px-4"> {/* Aumentei z-index para z-30 */}
        
        {/* CORREÇÃO IMPORTANTE: Removi 'overflow-hidden' desta div para o menu não cortar */}
        <div className="max-w-6xl mx-auto bg-white rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 relative">
          
          <div className="p-8 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-8">
              Encontre seu imóvel ideal
              <span className="h-1.5 w-16 bg-green-600 rounded-full ml-4 block"></span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CustomSelect label="Finalidade" icon={<Key size={14}/>} value={filters.finalidade} onChange={(v) => handleFilterChange('finalidade', v)} options={[{ label: "Comprar", value: "Comprar" }, { label: "Alugar", value: "Alugar" }]} />
              <CustomSelect label="Tipo" icon={<Home size={14}/>} value={filters.tipo} onChange={(v) => handleFilterChange('tipo', v)} options={[{ label: "Todos", value: "" }, { label: "Casa", value: "Casa" }, { label: "Apartamento", value: "Apartamento" }, { label: "Terreno", value: "Terreno" }, { label: "Comercial", value: "Comercial" }]} />
              <CustomSelect label="Cidade" icon={<MapPin size={14}/>} value={filters.cidade} onChange={(v) => handleFilterChange('cidade', v)} options={[{ label: "Todas", value: "" }, { label: "Porto União", value: "Porto União" }, { label: "União da Vitória", value: "União da Vitória" }]} />
              <CustomSelect label="Bairro" icon={<LayoutGrid size={14}/>} value={filters.bairro} onChange={(v) => handleFilterChange('bairro', v)} options={[{ label: "Todos", value: "" }, { label: "Centro", value: "Centro" }, { label: "São Cristóvão", value: "São Cristóvão" }]} />
            </div>
          </div>
          
          {/* Mantive overflow-hidden APENAS na parte de baixo onde não tem dropdown */}
          <div className="bg-gray-50 border-t border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-[2rem]">
            <div className="w-full md:w-auto flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase hidden md:block tracking-wide">CÓDIGO DO IMÓVEL:</span>
              <div className="relative group w-full md:w-64">
                <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                <input type="text" placeholder="Digite aqui..." className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all placeholder:text-gray-300" value={filters.codigo} onChange={(e) => handleFilterChange('codigo', e.target.value)} />
              </div>
            </div>
            <button onClick={handleSearch} className="w-full md:w-auto bg-[#0f2e20] hover:bg-green-900 text-white rounded-xl font-bold py-3 px-12 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-green-900/20 active:scale-95 text-sm uppercase tracking-wider">
              <Search size={18} strokeWidth={3} /> Ver Resultados
            </button>
          </div>
        </div>
      </div>

      {/* === SEÇÃO 1: VENDA === */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 mt-24 mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <span className="text-green-600 font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-2"><CheckCircle2 size={16} /> Oportunidades Exclusivas</span>
            <h2 className="text-4xl font-extrabold text-slate-900">Venda</h2>
          </div>
          <Link href="/imoveis/venda" className="hidden md:flex items-center gap-2 text-slate-700 font-bold hover:text-green-600 transition-colors bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100 hover:shadow-md">Ver todos à venda <ArrowRight size={16}/></Link>
        </div>
        
        {loading ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center">
            <Loader2 className="animate-spin mb-2" size={30} /> Carregando destaques...
          </div>
        ) : destaquesVenda.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destaquesVenda.map((imovel) => <PropertyCard key={imovel.id} property={mapToCard(imovel)} />)}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Nenhum imóvel em destaque no momento.</p>
          </div>
        )}
      </section>

      <div className="max-w-7xl mx-auto px-4 relative z-10"><div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div></div>

      {/* === SEÇÃO 2: ALUGUEL === */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 mt-16 mb-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <span className="text-blue-600 font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-2"><CheckCircle2 size={16} /> Prontos para morar</span>
            <h2 className="text-4xl font-extrabold text-slate-900">Locação</h2>
          </div>
          <Link href="/imoveis/aluguel" className="hidden md:flex items-center gap-2 text-slate-700 font-bold hover:text-blue-600 transition-colors bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100 hover:shadow-md">Ver todos para alugar <ArrowRight size={16}/></Link>
        </div>
        
        {loading ? (
           <div className="text-center py-20 text-gray-400 flex flex-col items-center">
             <Loader2 className="animate-spin mb-2" size={30} /> Carregando destaques...
           </div>
        ) : destaquesAluguel.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destaquesAluguel.map((imovel) => <PropertyCard key={imovel.id} property={mapToCard(imovel)} />)}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">Nenhum imóvel para locação em destaque.</p>
          </div>
        )}
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