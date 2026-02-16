"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
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
  ativo: boolean;
}

function AluguelContent() {
  const searchParams = useSearchParams();
  const tipoUrl = searchParams.get('tipo');

  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  // 1. BUSCAR DO BANCO
  useEffect(() => {
    async function fetchImoveis() {
      try {
        const res = await fetch("/api/imoveis");
        if (res.ok) {
          const data = await res.json();
          // Filtra só o que é ALUGUEL e está ATIVO
          // Aceita tanto "Aluguel" quanto "Locação" se você tiver escrito diferente no cadastro
          const apenasAluguel = data.filter((item: Imovel) => 
            item.ativo && (item.finalidade === "Aluguel" || item.finalidade === "Locação")
          );
          setImoveis(apenasAluguel);
        }
      } catch (error) {
        console.error("Erro ao buscar", error);
      } finally {
        setLoading(false);
      }
    }
    fetchImoveis();
  }, []);

  // 2. ATUALIZAR FILTROS PELA URL
  useEffect(() => {
    if (tipoUrl) {
      const tipoFormatado = tipoUrl.charAt(0).toUpperCase() + tipoUrl.slice(1).toLowerCase();
      setFiltroTipo(tipoFormatado);
    } else {
      setFiltroTipo("Todos");
    }
  }, [tipoUrl]);

  const imoveisFiltrados = filtroTipo === "Todos" 
    ? imoveis 
    : imoveis.filter(imovel => imovel.tipo.toLowerCase().includes(filtroTipo.toLowerCase()));

  // Formata o preço com "/mês" no final para aluguel
  const formatMoney = (val: number) => {
    const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    return `${money}/mês`;
  };

  const mapToCard = (imovel: Imovel) => ({
    ...imovel,
    preco: formatMoney(imovel.preco),
    imagem: imovel.imagem_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800"
  });

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 font-medium text-sm order-2 md:order-1">
            Mostrando <span className="font-bold text-gray-900">{imoveisFiltrados.length}</span> imóveis
            {filtroTipo !== "Todos" && <span className="ml-1 text-blue-600">({filtroTipo})</span>}
          </div>

          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide order-1 md:order-2">
            {["Todos", "Casa", "Apartamento", "Comercial"].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${
                  filtroTipo === tipo 
                  ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10">
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center text-gray-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p>Carregando imóveis...</p>
          </div>
        ) : imoveisFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {imoveisFiltrados.map((imovel) => (
              <PropertyCard key={imovel.id} property={mapToCard(imovel)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Nenhum imóvel encontrado</h3>
            <p className="text-gray-500 mt-2">Não encontramos imóveis para alugar nesta categoria.</p>
            <button onClick={() => setFiltroTipo("Todos")} className="mt-6 text-blue-600 font-bold hover:underline">Ver todos disponíveis</button>
          </div>
        )}
      </div>
    </>
  );
}

export default function AluguelPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      <section className="relative h-[250px] bg-[#0f2e20] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <Image src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1920" alt="Fundo" fill className="object-cover opacity-20" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">Alugar Imóvel</h1>
          <p className="text-green-200">Encontre o lugar perfeito para morar ou abrir seu negócio.</p>
        </div>
      </section>

      <Suspense fallback={<div className="text-center py-20">Carregando...</div>}>
        <AluguelContent />
      </Suspense>
    </main>
  );
}