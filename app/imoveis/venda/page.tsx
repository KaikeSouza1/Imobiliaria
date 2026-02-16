"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";

// === CORREÇÃO AQUI: Adicionei o campo 'codigo' ===
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
  codigo: string; // <--- Faltava essa linha!
}

function VendaContent() {
  const searchParams = useSearchParams();
  const tipoUrl = searchParams.get('tipo');
  const codigoUrl = searchParams.get('codigo'); // Pega o código da URL se tiver

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
          // Filtra só o que é VENDA e está ATIVO
          const apenasVenda = data.filter((item: Imovel) => 
            item.ativo && item.finalidade === "Venda"
          );
          setImoveis(apenasVenda);
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

  // 3. FILTRAGEM FINAL
  const imoveisFiltrados = imoveis.filter(imovel => {
    // Se a busca for por CÓDIGO (vindo da home), ignora o tipo e busca só o código
    if (codigoUrl) {
       // Verifica se o código existe e se bate (ou se o ID bate, caso use ID como código)
       return (imovel.codigo && imovel.codigo.toLowerCase() === codigoUrl.toLowerCase()) || imovel.id.toString() === codigoUrl;
    }

    // Se não for busca por código, usa o filtro de Tipo (Casa, Apê, etc)
    if (filtroTipo === "Todos") return true;
    return imovel.tipo.toLowerCase().includes(filtroTipo.toLowerCase());
  });

  // Helper para formatar dinheiro
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Helper para adaptar para o Card
  const mapToCard = (imovel: Imovel) => ({
    ...imovel,
    preco: formatMoney(imovel.preco),
    imagem: imovel.imagem_url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800"
  });

  return (
    <>
      {/* BARRA DE FILTROS */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="text-gray-600 font-medium text-sm order-2 md:order-1">
            Mostrando <span className="font-bold text-gray-900">{imoveisFiltrados.length}</span> imóveis
            {filtroTipo !== "Todos" && <span className="ml-1 text-green-600">({filtroTipo})</span>}
            {codigoUrl && <span className="ml-1 text-green-600">(Cód: {codigoUrl})</span>}
          </div>

          {/* Esconde os filtros de tipo se estiver buscando por código específico */}
          {!codigoUrl && (
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide order-1 md:order-2">
              {["Todos", "Casa", "Apartamento", "Terreno", "Comercial", "Sobrado", "Terreno Rural"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${
                    filtroTipo === tipo 
                    ? "bg-green-600 text-white border-green-600 shadow-md" 
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600"
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GRID DE RESULTADOS */}
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
            <p className="text-gray-500 mt-2">
              {codigoUrl ? `Não encontramos o código "${codigoUrl}".` : "Não encontramos imóveis ativos nesta categoria no momento."}
            </p>
            <button onClick={() => window.location.href = '/imoveis/venda'} className="mt-6 text-green-600 font-bold hover:underline">
              Ver todos disponíveis
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
      <section className="relative h-[250px] bg-[#0f2e20] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <Image src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1920" alt="Fundo" fill className="object-cover opacity-20" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">Comprar Imóvel</h1>
          <p className="text-green-200">Encontre as melhores oportunidades de venda da região.</p>
        </div>
      </section>

      <Suspense fallback={<div className="text-center py-20">Carregando...</div>}>
        <VendaContent />
      </Suspense>
    </main>
  );
}