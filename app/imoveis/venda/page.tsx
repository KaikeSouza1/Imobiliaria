"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, XCircle } from "lucide-react";
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
}

function VendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Captura os parâmetros da URL
  const tipoUrl = searchParams.get('tipo');
  const cidadeUrl = searchParams.get('cidade');
  const bairroUrl = searchParams.get('bairro');
  const codigoUrl = searchParams.get('codigo');

  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImoveis() {
      try {
        const res = await fetch("/api/imoveis");
        if (res.ok) {
          const data = await res.json();
          // Filtra apenas Venda e Ativos
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

  // Lógica de Filtragem Rigorosa
  const imoveisFiltrados = imoveis.filter(imovel => {
    // 1. Filtro por Código (Exato)
    if (codigoUrl && imovel.codigo.toLowerCase() !== codigoUrl.toLowerCase()) return false;
    
    // 2. Filtro por Tipo (Parcial)
    if (tipoUrl && !imovel.tipo.toLowerCase().includes(tipoUrl.toLowerCase())) return false;
    
    // 3. Filtro por Cidade (Exato)
    if (cidadeUrl && imovel.cidade !== cidadeUrl) return false;
    
    // 4. Filtro por Bairro (Exato - Aqui estava o problema antes)
    if (bairroUrl && imovel.bairro !== bairroUrl) return false;
    
    return true;
  });

  const limparFiltros = () => router.push("/imoveis/venda");

  const mapToCard = (imovel: Imovel) => ({
    ...imovel,
    preco: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.preco),
    imagem: imovel.imagem_url || "/logo_nova.png"
  });

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 font-medium text-sm">
            Encontramos <span className="font-bold text-gray-900 text-lg">{imoveisFiltrados.length}</span> imóveis
            {cidadeUrl && <span> em <span className="font-bold">{cidadeUrl}</span></span>}
            {bairroUrl && <span> no bairro <span className="font-bold">{bairroUrl}</span></span>}
            {codigoUrl && <span> com código <span className="font-bold">{codigoUrl}</span></span>}
          </div>
          {(tipoUrl || cidadeUrl || bairroUrl || codigoUrl) && (
            <button onClick={limparFiltros} className="flex items-center gap-2 text-red-500 font-bold text-sm hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
              <XCircle size={16} /> Limpar Filtros
            </button>
          )}
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
          <div className="text-center py-24 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Search size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Não encontramos imóveis para venda com esses filtros específicos. Tente buscar em outro bairro ou ver todos.
            </p>
            <button onClick={limparFiltros} className="mt-8 bg-[#0f2e20] text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wide hover:bg-green-800 transition-all shadow-lg">
              Ver Todos os Imóveis
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
          <Image src="https://images.unsplash.com/photo-1600596542815-60c37611b5a6?auto=format&fit=crop&w=1920" alt="Fundo" fill className="object-cover opacity-20" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-black mb-2 uppercase tracking-tighter">Comprar Imóvel</h1>
          <p className="text-green-200 font-medium tracking-wide uppercase text-sm">Invista no seu futuro e da sua família</p>
        </div>
      </section>
      <Suspense fallback={<div className="text-center py-20">Carregando...</div>}>
        <VendaContent />
      </Suspense>
    </main>
  );
}