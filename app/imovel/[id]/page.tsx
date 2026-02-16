"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, BedDouble, Bath, Car, Maximize, 
  MessageCircle, Share2, Loader2, Camera, X
} from "lucide-react";

interface Imovel {
  id: number;
  titulo: string;
  descricao: string;
  preco: number;
  tipo: string;
  finalidade: string;
  cidade: string;
  bairro: string;
  endereco: string;
  area: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  imagem_url: string;
  fotos_adicionais: string[];
  codigo: string;
}

function ImovelDetalhesContent() {
  const params = useParams();
  const id = params?.id;
  
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    async function loadImovel() {
      if (!id) return;
      try {
        const res = await fetch(`/api/imoveis/${id}`);
        if (!res.ok) throw new Error("Não encontrado");
        const data = await res.json();
        setImovel(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadImovel();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-green-700 mb-4" size={40} />
      <p className="text-gray-500 font-medium">Carregando imóvel...</p>
    </div>
  );

  if (!imovel) return <div className="p-20 text-center">Imóvel não encontrado.</div>;

  const todasFotos = [imovel.imagem_url, ...(imovel.fotos_adicionais || [])];
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      
      {/* HEADER DO IMÓVEL */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase">{imovel.titulo}</h1>
            <p className="flex items-center gap-2 text-gray-500 mt-2">
              <MapPin size={18} className="text-green-600" />
              {imovel.endereco} • {imovel.bairro}, {imovel.cidade}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Consultar Valores</p>
            <h2 className="text-3xl font-black text-green-700">{formatMoney(imovel.preco)}</h2>
          </div>
        </div>
      </div>

      {/* GRID DE FOTOS ESTILO MOSAICO */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 h-[500px] rounded-3xl overflow-hidden relative">
          
          {/* Foto Principal (Esquerda) */}
          <div className="md:col-span-2 md:row-span-2 relative cursor-pointer group" onClick={() => setModalAberto(true)}>
            <Image src={todasFotos[0]} alt="Principal" fill className="object-cover group-hover:brightness-90 transition-all" priority />
          </div>

          {/* Fotos da Direita */}
          <div className="hidden md:block relative cursor-pointer group" onClick={() => setModalAberto(true)}>
            <Image src={todasFotos[1] || todasFotos[0]} alt="Foto 2" fill className="object-cover group-hover:brightness-90 transition-all" />
          </div>
          
          <div className="hidden md:block relative cursor-pointer group" onClick={() => setModalAberto(true)}>
            <Image src={todasFotos[2] || todasFotos[0]} alt="Foto 3" fill className="object-cover group-hover:brightness-90 transition-all" />
          </div>

          <div className="hidden md:block relative cursor-pointer group" onClick={() => setModalAberto(true)}>
            <Image src={todasFotos[3] || todasFotos[0]} alt="Foto 4" fill className="object-cover group-hover:brightness-90 transition-all" />
          </div>

          {/* Foto com Contador */}
          <div className="hidden md:block relative cursor-pointer group" onClick={() => setModalAberto(true)}>
            <Image src={todasFotos[4] || todasFotos[0]} alt="Foto 5" fill className="object-cover group-hover:brightness-90 transition-all" />
            {todasFotos.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                <Camera size={24} className="mb-1" />
                <span className="font-bold">+{todasFotos.length - 5} Mais</span>
              </div>
            )}
          </div>

          {/* Botão Flutuante mobile para abrir galeria */}
          <button 
            onClick={() => setModalAberto(true)}
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg md:hidden"
          >
            <Camera size={16} /> Ver todas as fotos
          </button>
        </div>
      </section>

      {/* DETALHES TÉCNICOS */}
      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          
          {/* Badges */}
          <div className="flex gap-2 mb-8">
            <span className="bg-green-100 text-green-700 px-4 py-1 rounded-lg text-xs font-bold uppercase">Destaque</span>
            <span className="bg-slate-100 text-slate-700 px-4 py-1 rounded-lg text-xs font-bold uppercase">{imovel.finalidade}</span>
            <span className="bg-slate-100 text-slate-700 px-4 py-1 rounded-lg text-xs font-bold uppercase">{imovel.tipo}</span>
          </div>

          {/* Ícones */}
          <div className="flex flex-wrap gap-8 py-8 border-y border-gray-100 mb-8">
            <div className="flex items-center gap-3">
              <BedDouble className="text-green-600" size={28} />
              <div><p className="text-xl font-bold leading-none">{imovel.quartos}</p><p className="text-gray-400 text-xs uppercase font-bold">Quartos</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Bath className="text-green-600" size={28} />
              <div><p className="text-xl font-bold leading-none">{imovel.banheiros}</p><p className="text-gray-400 text-xs uppercase font-bold">Banheiros</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Car className="text-green-600" size={28} />
              <div><p className="text-xl font-bold leading-none">{imovel.vagas}</p><p className="text-gray-400 text-xs uppercase font-bold">Vagas</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Maximize className="text-green-600" size={28} />
              <div><p className="text-xl font-bold leading-none">{imovel.area}m²</p><p className="text-gray-400 text-xs uppercase font-bold">Área</p></div>
            </div>
          </div>

          <h3 className="text-xl font-black text-gray-900 mb-4 uppercase">Descrição</h3>
          <div className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">
            {imovel.descricao}
          </div>
        </div>

        {/* CONTATO SIDEBAR */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 p-8 rounded-3xl sticky top-8 border border-slate-100">
            <h4 className="font-black text-xl mb-6 uppercase">Interessado?</h4>
            <Link 
              href={`https://api.whatsapp.com/send?phone=5542998439975&text=Tenho interesse no imóvel: ${imovel.titulo}`}
              target="_blank"
              className="w-full bg-green-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 mb-4"
            >
              <MessageCircle size={24} /> WHATSAPP
            </Link>
            <button className="w-full bg-white text-slate-600 border border-slate-200 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all">
              <Share2 size={20} /> COMPARTILHAR
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DA GALERIA COMPLETA */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black z-[100] overflow-y-auto p-4 md:p-10">
          <button onClick={() => setModalAberto(false)} className="fixed top-6 right-6 text-white z-[110] bg-white/10 p-2 rounded-full hover:bg-white/20">
            <X size={32} />
          </button>
          <div className="max-w-5xl mx-auto space-y-4">
            {todasFotos.map((img, i) => (
              <div key={i} className="relative w-full h-[70vh]">
                <Image src={img} alt={`Foto ${i}`} fill className="object-contain" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImovelPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-green-700">Iniciando...</div>}>
      <ImovelDetalhesContent />
    </Suspense>
  );
}