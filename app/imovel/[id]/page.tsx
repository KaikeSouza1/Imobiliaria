"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  MapPin, BedDouble, Bath, Car, Maximize, 
  MessageCircle, Share2, Loader2, Camera, X, CheckCircle2
} from "lucide-react";

const MapDisplay = dynamic(() => import("@/components/MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="h-[450px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
      <MapPin className="text-gray-300" size={40} />
    </div>
  )
});

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
  latitude?: number;
  longitude?: number;
  status?: string;
  destaque?: boolean;
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
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    }
    loadImovel();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-green-700 mb-4" size={40} />
      <p className="text-gray-500 font-black uppercase text-xs tracking-widest">Carregando Imóvel...</p>
    </div>
  );

  if (!imovel) return <div className="p-20 text-center font-bold">Imóvel não encontrado.</div>;

  // FILTRO DE FOTOS: Garante que só links válidos entrem na lista
  const todasFotos = [imovel.imagem_url, ...(imovel.fotos_adicionais || [])].filter(url => url && url.trim() !== "");
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const hasLocation = imovel.latitude && imovel.longitude;

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div className="space-y-3">
            <div className="flex gap-2">
              {imovel.destaque && (
                <span className="bg-[#9eff00] text-[#0f2e20] px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">DESTAQUE</span>
              )}
              <span className="bg-[#0f2e20] text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">{imovel.finalidade}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">{imovel.titulo}</h1>
            <p className="flex items-center gap-2 text-gray-500 font-medium text-lg">
              <MapPin size={20} className="text-green-600" />
              {imovel.endereco} • {imovel.bairro}, {imovel.cidade}
            </p>
          </div>
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-right min-w-[280px] shadow-sm">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Valor Total</p>
            <h2 className="text-4xl font-black text-[#0f2e20]">{formatMoney(imovel.preco)}</h2>
          </div>
        </div>
      </div>

      {/* GALERIA DINÂMICA (CORRIGIDA) */}
      <section className="max-w-7xl mx-auto px-4">
        <div 
          className={`grid gap-3 rounded-[3rem] overflow-hidden relative shadow-2xl h-[450px] md:h-[650px] 
          ${todasFotos.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4 md:grid-rows-2'}`}
        >
          {/* FOTO 1 (Principal) */}
          <div className={`relative cursor-pointer group overflow-hidden ${todasFotos.length === 1 ? 'col-span-full row-span-full' : 'md:col-span-2 md:row-span-2'}`} onClick={() => setModalAberto(true)}>
            <Image src={todasFotos[0]} alt="Principal" fill className="object-cover group-hover:scale-105 transition-all duration-700" priority />
          </div>

          {/* FOTO 2 */}
          {todasFotos.length >= 2 && (
            <div className={`relative cursor-pointer group overflow-hidden ${todasFotos.length === 2 ? 'md:col-span-2 md:row-span-2' : ''}`} onClick={() => setModalAberto(true)}>
              <Image src={todasFotos[1]} alt="Foto 2" fill className="object-cover group-hover:scale-105 transition-all duration-700" />
            </div>
          )}

          {/* FOTO 3 */}
          {todasFotos.length >= 3 && (
            <div className="hidden md:block relative cursor-pointer group overflow-hidden" onClick={() => setModalAberto(true)}>
              <Image src={todasFotos[2]} alt="Foto 3" fill className="object-cover group-hover:scale-105 transition-all duration-700" />
            </div>
          )}

          {/* FOTO 4 */}
          {todasFotos.length >= 4 && (
            <div className="hidden md:block relative cursor-pointer group overflow-hidden" onClick={() => setModalAberto(true)}>
              <Image src={todasFotos[3]} alt="Foto 4" fill className="object-cover group-hover:scale-105 transition-all duration-700" />
            </div>
          )}

          {/* FOTO 5 OU MAIS */}
          {todasFotos.length >= 5 && (
            <div className="hidden md:block relative cursor-pointer group overflow-hidden" onClick={() => setModalAberto(true)}>
              <Image src={todasFotos[4]} alt="Foto 5" fill className="object-cover group-hover:scale-105 transition-all duration-700" />
              {todasFotos.length > 5 && (
                <div className="absolute inset-0 bg-[#0f2e20]/80 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                  <Camera size={32} className="mb-2" />
                  <span className="font-black text-xl">+{todasFotos.length - 5} FOTOS</span>
                </div>
              )}
            </div>
          )}

          <button onClick={() => setModalAberto(true)} className="absolute bottom-8 right-8 bg-white text-[#0f2e20] px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-3 shadow-2xl hover:bg-[#0f2e20] hover:text-white transition-all">
            <Camera size={20} /> Ver Galeria Completa
          </button>
        </div>
      </section>

      {/* DETALHES TÉCNICOS */}
      <div className="max-w-7xl mx-auto px-4 mt-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12 border-y border-slate-100 mb-12">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-4 rounded-2xl"><BedDouble className="text-green-700" size={28} /></div>
              <div><p className="text-2xl font-black text-gray-800 leading-none">{imovel.quartos}</p><p className="text-gray-400 text-[10px] uppercase font-black mt-2">Quartos</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-4 rounded-2xl"><Bath className="text-green-700" size={28} /></div>
              <div><p className="text-2xl font-black text-gray-800 leading-none">{imovel.banheiros}</p><p className="text-gray-400 text-[10px] uppercase font-black mt-2">Banheiros</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-4 rounded-2xl"><Car className="text-green-700" size={28} /></div>
              <div><p className="text-2xl font-black text-gray-800 leading-none">{imovel.vagas}</p><p className="text-gray-400 text-[10px] uppercase font-black mt-2">Vagas</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-4 rounded-2xl"><Maximize className="text-green-700" size={28} /></div>
              <div><p className="text-2xl font-black text-gray-800 leading-none">{imovel.area}m²</p><p className="text-gray-400 text-[10px] uppercase font-black mt-2">Área Total</p></div>
            </div>
          </div>

          <h3 className="text-2xl font-black text-gray-900 mb-6 uppercase">Descrição</h3>
          <div className="text-gray-600 leading-relaxed text-xl whitespace-pre-wrap font-medium">
            {imovel.descricao}
          </div>

          {hasLocation && (
            <section className="mt-20">
              <h3 className="text-2xl font-black text-gray-900 uppercase flex items-center gap-3 mb-8">
                <MapPin className="text-green-700" size={32} /> Localização no Mapa
              </h3>
              <MapDisplay lat={Number(imovel.latitude)} lng={Number(imovel.longitude)} title={imovel.titulo} address={imovel.endereco} />
            </section>
          )}
        </div>

        {/* CONTATO SIDEBAR */}
        <div className="lg:col-span-1">
          <div className="bg-[#0f2e20] p-10 rounded-[3rem] sticky top-32 shadow-2xl border border-green-900">
            <h4 className="font-black text-white text-2xl uppercase mb-4">Gostou deste imóvel?</h4>
            <p className="text-green-100/60 text-sm mb-10 font-medium">Fale com um de nossos corretores agora mesmo e agende uma visita presencial.</p>

            <Link href={`https://api.whatsapp.com/send?phone=5542999755493&text=Interesse no imóvel: ${imovel.titulo}`} target="_blank"
              className="w-full bg-[#009c3b] text-white font-black py-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl mb-6">
              <MessageCircle size={28} /> CHAMAR NO WHATSAPP
            </Link>
            
            <button className="w-full bg-white/5 text-white border border-white/10 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-xs uppercase tracking-widest">
              <Share2 size={20} /> Compartilhar Agora
            </button>

            <div className="mt-12 pt-10 border-t border-white/5 flex items-center gap-5">
              <div className="w-12 h-12 bg-green-900 rounded-full flex items-center justify-center text-green-400 font-black">PI</div>
              <div>
                <p className="text-white font-bold">Imobiliária Porto Iguaçu</p>
                <p className="text-green-500 text-[10px] font-black uppercase">Atendimento Premium</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL GALERIA */}
      {modalAberto && (
        <div className="fixed inset-0 bg-[#0f2e20] z-[200] overflow-y-auto p-4 md:p-10 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex justify-between items-center mb-12">
            <p className="text-white font-black uppercase tracking-widest text-lg">{imovel.titulo}</p>
            <button onClick={() => setModalAberto(false)} className="text-white bg-red-600 p-5 rounded-full hover:scale-110 transition-all shadow-2xl">
              <X size={32} />
            </button>
          </div>
          <div className="max-w-4xl mx-auto space-y-12 pb-32">
            {todasFotos.map((img, i) => (
              <div key={i} className="relative w-full h-[60vh] md:h-[90vh] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                <Image src={img} alt={`Foto ${i}`} fill className="object-contain md:object-cover" />
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-green-700 font-black uppercase tracking-[0.3em]">Carregando...</div>}>
      <ImovelDetalhesContent />
    </Suspense>
  );
}