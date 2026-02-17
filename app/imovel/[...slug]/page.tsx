// app/imovel/[...slug]/page.tsx
// Aceita: /imovel/venda/casa/sao-pedro-porto-uniao-12
// E também: /imovel/12 (rota legada, redireciona)
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, BedDouble, Bath, Car, Maximize, 
  MessageCircle, Share2, Loader2, Camera, X, ArrowLeft
} from "lucide-react";
import { extractIdFromSlug, generateSlug } from "@/lib/slug";

// Carrega o mapa só no cliente
import dynamic from "next/dynamic";
const MapDisplay = dynamic(
  () => import("@/components/MapDisplay").then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-[450px] bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
        <MapPin className="text-gray-300" size={40} />
      </div>
    ),
  }
);

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
}

function ImovelDetalhesContent() {
  const params = useParams();
  const router = useRouter();
  const slugParts = params?.slug as string[];

  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [fotoAtiva, setFotoAtiva] = useState(0);

  useEffect(() => {
    async function loadImovel() {
      if (!slugParts) return;

      // Extrai o ID do último segmento do slug
      const lastPart = slugParts[slugParts.length - 1];
      const id = extractIdFromSlug(lastPart) || lastPart;

      try {
        const res = await fetch(`/api/imoveis/${id}`);
        if (!res.ok) throw new Error("Não encontrado");
        const data = await res.json();
        setImovel(data);

        // Redireciona para URL canônica se o slug for só o ID legado
        if (slugParts.length === 1 && /^\d+$/.test(slugParts[0])) {
          const slug = generateSlug(data);
          router.replace(`/imovel/${slug}`);
          return;
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadImovel();
  }, [slugParts, router]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="animate-spin text-green-700 mb-4" size={40} />
      <p className="text-gray-500 font-medium">Carregando imóvel...</p>
    </div>
  );

  if (!imovel) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <p className="text-2xl font-bold text-gray-700">Imóvel não encontrado</p>
      <Link href="/" className="mt-4 text-green-600 font-bold hover:underline flex items-center gap-2">
        <ArrowLeft size={18} /> Voltar para a home
      </Link>
    </div>
  );

  const todasFotos = [imovel.imagem_url, ...(imovel.fotos_adicionais || [])].filter(Boolean);
  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const hasLocation = imovel.latitude && imovel.longitude;
  const canonicalSlug = generateSlug(imovel);
  const urlCompartilhar = `https://imobiliariaportoiguacu.com.br/imovel/${canonicalSlug}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: imovel.titulo, url: urlCompartilhar });
    } else {
      navigator.clipboard.writeText(urlCompartilhar);
      alert("Link copiado!");
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      
      {/* BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <nav className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
          <span>/</span>
          <Link 
            href={imovel.finalidade === "Venda" ? "/imoveis/venda" : "/imoveis/aluguel"}
            className="hover:text-green-600 transition-colors capitalize"
          >
            {imovel.finalidade === "Venda" ? "Comprar" : "Alugar"}
          </Link>
          <span>/</span>
          <Link 
            href={`/imoveis/${imovel.finalidade === "Venda" ? "venda" : "aluguel"}?tipo=${imovel.tipo}`}
            className="hover:text-green-600 transition-colors"
          >
            {imovel.tipo}
          </Link>
          <span>/</span>
          <span className="text-gray-600 font-bold truncate max-w-[200px]">{imovel.titulo}</span>
        </nav>
      </div>

      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white
                ${imovel.finalidade === "Venda" ? "bg-[#0f2e20]" : "bg-[#1a5c35]"}`}>
                {imovel.finalidade}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600">
                {imovel.tipo}
              </span>
              {imovel.codigo && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-200">
                  Cód: {imovel.codigo}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-gray-900 uppercase leading-tight">{imovel.titulo}</h1>
            <p className="flex items-center gap-2 text-gray-500 mt-2">
              <MapPin size={16} className="text-green-600 flex-shrink-0" />
              {imovel.endereco} — {imovel.bairro}, {imovel.cidade}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              {imovel.finalidade === "Venda" ? "Valor" : "Aluguel/mês"}
            </p>
            <h2 className="text-3xl font-black text-green-700">{formatMoney(imovel.preco)}</h2>
          </div>
        </div>
      </div>

      {/* GALERIA MOSAICO */}
      <section className="max-w-7xl mx-auto px-4">
        {(() => {
          const total = todasFotos.length;

          // Layout dinâmico baseado na quantidade de fotos
          if (total === 1) {
            return (
              <div className="relative h-[500px] rounded-3xl overflow-hidden cursor-pointer" onClick={() => { setFotoAtiva(0); setModalAberto(true); }}>
                <Image src={todasFotos[0]} alt="Principal" fill className="object-cover hover:brightness-90 transition-all" priority />
              </div>
            );
          }

          if (total === 2) {
            return (
              <div className="grid grid-cols-2 gap-2 h-[500px] rounded-3xl overflow-hidden">
                {todasFotos.slice(0, 2).map((foto, i) => (
                  <div key={i} className="relative cursor-pointer group" onClick={() => { setFotoAtiva(i); setModalAberto(true); }}>
                    <Image src={foto} alt={`Foto ${i+1}`} fill className="object-cover group-hover:brightness-90 transition-all" priority={i === 0} />
                  </div>
                ))}
              </div>
            );
          }

          if (total === 3) {
            return (
              <div className="grid grid-cols-2 gap-2 h-[500px] rounded-3xl overflow-hidden">
                <div className="relative cursor-pointer group row-span-2" onClick={() => { setFotoAtiva(0); setModalAberto(true); }}>
                  <Image src={todasFotos[0]} alt="Principal" fill className="object-cover group-hover:brightness-90 transition-all" priority />
                </div>
                {todasFotos.slice(1, 3).map((foto, i) => (
                  <div key={i} className="relative cursor-pointer group" onClick={() => { setFotoAtiva(i+1); setModalAberto(true); }}>
                    <Image src={foto} alt={`Foto ${i+2}`} fill className="object-cover group-hover:brightness-90 transition-all" />
                  </div>
                ))}
              </div>
            );
          }

          // 4+ fotos: layout mosaico completo
          const extras = total - 5;
          return (
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[500px] rounded-3xl overflow-hidden relative">
              <div className="col-span-2 row-span-2 relative cursor-pointer group" onClick={() => { setFotoAtiva(0); setModalAberto(true); }}>
                <Image src={todasFotos[0]} alt="Principal" fill className="object-cover group-hover:brightness-90 transition-all" priority />
              </div>
              {[1, 2, 3, 4].map((idx) => {
                if (!todasFotos[idx]) return <div key={idx} className="bg-gray-100" />;
                const isLast = idx === 4 && extras > 0;
                return (
                  <div key={idx} className="relative cursor-pointer group" onClick={() => { setFotoAtiva(idx); setModalAberto(true); }}>
                    <Image src={todasFotos[idx]} alt={`Foto ${idx+1}`} fill className="object-cover group-hover:brightness-90 transition-all" />
                    {isLast && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white pointer-events-none">
                        <Camera size={24} className="mb-1" />
                        <span className="font-bold">+{extras} fotos</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Botão mobile */}
        <div className="flex justify-end mt-2 md:hidden">
          <button
            onClick={() => setModalAberto(true)}
            className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg border border-gray-100"
          >
            <Camera size={16} /> {todasFotos.length} fotos
          </button>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* ESQUERDA: DETALHES */}
        <div className="lg:col-span-2">
          
          {/* ÍCONES */}
          <div className="flex flex-wrap gap-8 py-8 border-y border-gray-100 mb-8">
            {imovel.quartos > 0 && (
              <div className="flex items-center gap-3">
                <BedDouble className="text-green-600" size={28} />
                <div>
                  <p className="text-xl font-bold leading-none">{imovel.quartos}</p>
                  <p className="text-gray-400 text-xs uppercase font-bold">Quartos</p>
                </div>
              </div>
            )}
            {imovel.banheiros > 0 && (
              <div className="flex items-center gap-3">
                <Bath className="text-green-600" size={28} />
                <div>
                  <p className="text-xl font-bold leading-none">{imovel.banheiros}</p>
                  <p className="text-gray-400 text-xs uppercase font-bold">Banheiros</p>
                </div>
              </div>
            )}
            {imovel.vagas > 0 && (
              <div className="flex items-center gap-3">
                <Car className="text-green-600" size={28} />
                <div>
                  <p className="text-xl font-bold leading-none">{imovel.vagas}</p>
                  <p className="text-gray-400 text-xs uppercase font-bold">Vagas</p>
                </div>
              </div>
            )}
            {imovel.area > 0 && (
              <div className="flex items-center gap-3">
                <Maximize className="text-green-600" size={28} />
                <div>
                  <p className="text-xl font-bold leading-none">{imovel.area}m²</p>
                  <p className="text-gray-400 text-xs uppercase font-bold">Área</p>
                </div>
              </div>
            )}
          </div>

          {/* DESCRIÇÃO */}
          {imovel.descricao && (
            <>
              <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">Sobre o imóvel</h3>
              <div className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap mb-8">
                {imovel.descricao}
              </div>
            </>
          )}

          {/* TABELA DE DETALHES */}
          <div className="mb-8">
            <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">Detalhes</h3>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              {[
                { label: "ID do Imóvel",      value: imovel.codigo || `#${imovel.id}` },
                { label: "Tipo de Imóvel",    value: imovel.tipo },
                { label: "Finalidade",        value: imovel.finalidade },
                { label: "Cidade",            value: imovel.cidade },
                { label: "Bairro",            value: imovel.bairro },
                ...(imovel.area > 0      ? [{ label: "Área Total",  value: `${imovel.area} m²` }]      : []),
                ...(imovel.quartos > 0   ? [{ label: "Quartos",     value: String(imovel.quartos) }]   : []),
                ...(imovel.banheiros > 0 ? [{ label: "Banheiros",   value: String(imovel.banheiros) }] : []),
                ...(imovel.vagas > 0     ? [{ label: "Garagens",    value: String(imovel.vagas) }]     : []),
                {
                  label: "Preço",
                  value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(imovel.preco),
                },
                {
                  label: "Status",
                  value: imovel.status === "vendido"   ? "Vendido"
                       : imovel.status === "alugado"   ? "Alugado"
                       : imovel.status === "reservado" ? "Reservado"
                       : "Disponível",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center px-5 py-3.5 text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <span className="font-bold text-gray-400">{row.label}</span>
                  <span className="font-bold text-gray-900 text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DIREITA: CONTATO FIXO */}
        <div className="lg:col-span-1">
          <div className="bg-[#0f2e20] p-8 rounded-3xl sticky top-8 text-white shadow-2xl">
            <h4 className="font-black text-xl mb-2 uppercase">Tenho interesse!</h4>
            <p className="text-green-200 text-sm mb-6">Fale diretamente com um corretor agora</p>
            
            <Link 
              href={`https://api.whatsapp.com/send?phone=5542999755493&text=Ol%C3%A1!%20Tenho%20interesse%20no%20im%C3%B3vel%3A%20${encodeURIComponent(imovel.titulo)}%20-%20${urlCompartilhar}`}
              target="_blank"
              className="w-full bg-green-500 hover:bg-green-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg mb-3"
            >
              <MessageCircle size={22} /> CHAMAR NO WHATSAPP
            </Link>
            
            <button 
              onClick={handleShare}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
            >
              <Share2 size={18} /> Compartilhar imóvel
            </button>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-green-300 text-[10px] uppercase font-bold tracking-widest">Referência</p>
              <p className="text-white font-bold text-sm mt-1">{imovel.codigo || `#${imovel.id}`}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAPA */}
      {hasLocation && (
        <section className="max-w-7xl mx-auto px-4 mt-16">
          <h2 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-2">
            <MapPin className="text-green-600" /> Localização
          </h2>
          <p className="text-gray-500 text-sm mb-6">{imovel.bairro}, {imovel.cidade}</p>
          <MapDisplay
            lat={imovel.latitude!}
            lng={imovel.longitude!}
            title={imovel.titulo}
            address={`${imovel.endereco}, ${imovel.bairro} - ${imovel.cidade}`}
          />
        </section>
      )}

      {/* MODAL GALERIA FULL SCREEN */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col">
          {/* Header do modal */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <span className="text-white font-bold text-sm">{fotoAtiva + 1} / {todasFotos.length}</span>
            <button
              onClick={() => setModalAberto(false)}
              className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Foto principal */}
          <div className="flex-1 relative">
            <Image
              src={todasFotos[fotoAtiva]}
              alt={`Foto ${fotoAtiva + 1}`}
              fill
              className="object-contain"
            />
            {/* Navegar prev/next */}
            {fotoAtiva > 0 && (
              <button
                onClick={() => setFotoAtiva(f => f - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-3 rounded-full transition-all"
              >
                ←
              </button>
            )}
            {fotoAtiva < todasFotos.length - 1 && (
              <button
                onClick={() => setFotoAtiva(f => f + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-3 rounded-full transition-all"
              >
                →
              </button>
            )}
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 p-4 overflow-x-auto border-t border-white/10">
            {todasFotos.map((foto, i) => (
              <button
                key={i}
                onClick={() => setFotoAtiva(i)}
                className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all
                  ${fotoAtiva === i ? "ring-2 ring-green-400 scale-105" : "opacity-50 hover:opacity-100"}`}
              >
                <Image src={foto} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImovelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-700" size={40} />
      </div>
    }>
      <ImovelDetalhesContent />
    </Suspense>
  );
}