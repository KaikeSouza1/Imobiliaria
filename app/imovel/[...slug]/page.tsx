// app/imovel/[...slug]/page.tsx
"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, BedDouble, Bath, Car, Maximize, 
  MessageCircle, Share2, Loader2, Camera, X, ArrowLeft, ChevronLeft, ChevronRight
} from "lucide-react";
import { extractIdFromSlug, generateSlug } from "@/lib/slug";

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

function GaleriaMobile({ fotos, onOpen }: { fotos: string[]; onOpen: (index: number) => void }) {
  const thumbsRef = useRef<HTMLDivElement>(null);

  return (
    <div className="md:hidden flex flex-col gap-2">
      {/* FOTO PRINCIPAL */}
      <div
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer"
        style={{ aspectRatio: "4/3" }}
        onClick={() => onOpen(0)}
      >
        <Image
          src={fotos[0]}
          alt="Foto principal"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay gradiente suave */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Badge contador de fotos */}
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(0); }}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20"
        >
          <Camera size={13} />
          {fotos.length} fotos
        </button>
      </div>

      {/* MINIATURAS HORIZONTAIS */}
      {fotos.length > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {fotos.slice(1).map((foto, i) => (
            <div
              key={i}
              onClick={() => onOpen(i + 1)}
              className="relative flex-none rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-green-500 transition-all"
              style={{ width: 80, height: 60 }}
            >
              <Image src={foto} alt={`Foto ${i + 2}`} fill className="object-cover" />
              {/* Última miniatura com overlay "+N" se houver muitas */}
              {i === 4 && fotos.length > 6 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xs font-black">+{fotos.length - 6}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GaleriaDesktop({ fotos, onOpen }: { fotos: string[]; onOpen: (index: number) => void }) {
  const total = fotos.length;

  if (total === 1) {
    return (
      <div className="hidden md:block relative h-[500px] rounded-3xl overflow-hidden cursor-pointer" onClick={() => onOpen(0)}>
        <Image src={fotos[0]} alt="Principal" fill className="object-cover hover:brightness-90 transition-all" priority />
      </div>
    );
  }

  if (total === 2) {
    return (
      <div className="hidden md:grid grid-cols-2 gap-2 h-[500px] rounded-3xl overflow-hidden">
        {fotos.slice(0, 2).map((foto, i) => (
          <div key={i} className="relative cursor-pointer group" onClick={() => onOpen(i)}>
            <Image src={foto} alt={`Foto ${i+1}`} fill className="object-cover group-hover:brightness-90 transition-all" priority={i === 0} />
          </div>
        ))}
      </div>
    );
  }

  if (total === 3) {
    return (
      <div className="hidden md:grid grid-cols-2 gap-2 h-[500px] rounded-3xl overflow-hidden">
        <div className="relative cursor-pointer group row-span-2" onClick={() => onOpen(0)}>
          <Image src={fotos[0]} alt="Principal" fill className="object-cover group-hover:brightness-90 transition-all" priority />
        </div>
        {fotos.slice(1, 3).map((foto, i) => (
          <div key={i} className="relative cursor-pointer group" onClick={() => onOpen(i+1)}>
            <Image src={foto} alt={`Foto ${i+2}`} fill className="object-cover group-hover:brightness-90 transition-all" />
          </div>
        ))}
      </div>
    );
  }

  const extras = total - 5;
  return (
    <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[500px] rounded-3xl overflow-hidden relative">
      <div className="col-span-2 row-span-2 relative cursor-pointer group" onClick={() => onOpen(0)}>
        <Image src={fotos[0]} alt="Principal" fill className="object-cover group-hover:brightness-90 transition-all" priority />
      </div>
      {[1, 2, 3, 4].map((idx) => {
        if (!fotos[idx]) return <div key={idx} className="bg-gray-100" />;
        const isLast = idx === 4 && extras > 0;
        return (
          <div key={idx} className="relative cursor-pointer group" onClick={() => onOpen(idx)}>
            <Image src={fotos[idx]} alt={`Foto ${idx+1}`} fill className="object-cover group-hover:brightness-90 transition-all" />
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
}

function ModalGaleria({ fotos, fotoAtiva, onClose, onChange }: {
  fotos: string[];
  fotoAtiva: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  // Fechar com ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && fotoAtiva > 0) onChange(fotoAtiva - 1);
      if (e.key === "ArrowRight" && fotoAtiva < fotos.length - 1) onChange(fotoAtiva + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [fotoAtiva, fotos.length, onClose, onChange]);

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
        <span className="text-white font-bold text-sm">{fotoAtiva + 1} / {fotos.length}</span>
        <button onClick={onClose} className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Foto principal */}
      <div className="flex-1 relative min-h-0">
        <Image src={fotos[fotoAtiva]} alt={`Foto ${fotoAtiva + 1}`} fill className="object-contain" />

        {fotoAtiva > 0 && (
          <button
            onClick={() => onChange(fotoAtiva - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-3 rounded-full transition-all"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {fotoAtiva < fotos.length - 1 && (
          <button
            onClick={() => onChange(fotoAtiva + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-3 rounded-full transition-all"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 p-3 overflow-x-auto border-t border-white/10 flex-shrink-0" style={{ scrollbarWidth: "none" }}>
        {fotos.map((foto, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`relative flex-shrink-0 w-14 h-10 md:w-16 md:h-12 rounded-lg overflow-hidden transition-all
              ${fotoAtiva === i ? "ring-2 ring-green-400 scale-105" : "opacity-50 hover:opacity-100"}`}
          >
            <Image src={foto} alt="" fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
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
      const lastPart = slugParts[slugParts.length - 1];
      const id = extractIdFromSlug(lastPart) || lastPart;
      try {
        const res = await fetch(`/api/imoveis/${id}`);
        if (!res.ok) throw new Error("Não encontrado");
        const data = await res.json();
        setImovel(data);
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

  const openModal = (index: number) => {
    setFotoAtiva(index);
    setModalAberto(true);
  };

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
  const formatMoney = (val: number) =>
    val === 0
      ? "Consultar valores"
      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
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

  const isConsultar = imovel.preco === 0;

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">

      {/* BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <nav className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href={imovel.finalidade === "Venda" ? "/imoveis/venda" : "/imoveis/aluguel"} className="hover:text-green-600 transition-colors">
            {imovel.finalidade === "Venda" ? "Comprar" : "Alugar"}
          </Link>
          <span>/</span>
          <Link href={`/imoveis/${imovel.finalidade === "Venda" ? "venda" : "aluguel"}?tipo=${imovel.tipo}`} className="hover:text-green-600 transition-colors">
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
            <div className="flex items-center gap-2 mb-2 flex-wrap">
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
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase leading-tight">{imovel.titulo}</h1>
            <p className="flex items-start gap-2 text-gray-500 mt-2 text-sm">
              <MapPin size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span>{imovel.endereco} — {imovel.bairro}, {imovel.cidade}</span>
            </p>
          </div>
          <div className="text-left md:text-right flex-shrink-0">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              {imovel.finalidade === "Venda" ? "Valor" : "Aluguel/mês"}
            </p>
            <h2 className={`text-2xl md:text-3xl font-black ${isConsultar ? "text-gray-600 text-xl" : "text-green-700"}`}>
              {formatMoney(imovel.preco)}
            </h2>
          </div>
        </div>
      </div>

      {/* GALERIA */}
      <section className="max-w-7xl mx-auto px-4">
        {/* Mobile */}
        <GaleriaMobile fotos={todasFotos} onOpen={openModal} />
        {/* Desktop */}
        <GaleriaDesktop fotos={todasFotos} onOpen={openModal} />
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* ESQUERDA */}
        <div className="lg:col-span-2">

          {/* ÍCONES */}
          <div className="flex flex-wrap gap-6 md:gap-8 py-6 md:py-8 border-y border-gray-100 mb-8">
            {imovel.quartos > 0 && (
              <div className="flex items-center gap-3">
                <BedDouble className="text-green-600" size={26} />
                <div>
                  <p className="text-lg md:text-xl font-bold leading-none">{imovel.quartos}</p>
                  <p className="text-gray-400 text-xs uppercase font-bold">Quartos</p>
                </div>
              </div>
            )}
            {imovel.banheiros > 0 && (
              <div className="flex items-center gap-3">
                <Bath className="text-green-600" size={26} />
                <div>
                  <p className="text-lg md:text-xl font-bold leading-none">{imovel.banheiros}</p>
                  <p className="text-gray-400 text-xs uppercase font-bold">Banheiros</p>
                </div>
              </div>
            )}
            {imovel.vagas > 0 && (
              <div className="flex items-center gap-3">
                <Car className="text-green-600" size={26} />
                <div>
                  <p className="text-lg md:text-xl font-bold leading-none">{imovel.vagas}</p>
                  <p className="text-gray-400 text-xs uppercase font-bold">Vagas</p>
                </div>
              </div>
            )}
            {imovel.area > 0 && (
              <div className="flex items-center gap-3">
                <Maximize className="text-green-600" size={26} />
                <div>
                  <p className="text-lg md:text-xl font-bold leading-none">{imovel.area}m²</p>
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

          {/* TABELA */}
          <div className="mb-8">
            <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">Detalhes</h3>
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              {[
                { label: "ID do Imóvel",   value: imovel.codigo || `#${imovel.id}` },
                { label: "Tipo de Imóvel", value: imovel.tipo },
                { label: "Finalidade",     value: imovel.finalidade },
                { label: "Cidade",         value: imovel.cidade },
                { label: "Bairro",         value: imovel.bairro },
                ...(imovel.area > 0      ? [{ label: "Área Total",  value: `${imovel.area} m²` }]      : []),
                ...(imovel.quartos > 0   ? [{ label: "Quartos",     value: String(imovel.quartos) }]   : []),
                ...(imovel.banheiros > 0 ? [{ label: "Banheiros",   value: String(imovel.banheiros) }] : []),
                ...(imovel.vagas > 0     ? [{ label: "Garagens",    value: String(imovel.vagas) }]     : []),
                {
                  label: "Preço",
                  value: isConsultar
                    ? "Consultar valores"
                    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(imovel.preco),
                },
                {
                  label: "Status",
                  value: imovel.status === "vendido"   ? "Vendido"
                       : imovel.status === "alugado"   ? "Alugado"
                       : imovel.status === "reservado" ? "Reservado"
                       : "Disponível",
                },
              ].map((row, i) => (
                <div key={i} className={`flex justify-between items-center px-5 py-3.5 text-sm ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <span className="font-bold text-gray-400">{row.label}</span>
                  <span className="font-bold text-gray-900 text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DIREITA: CONTATO */}
        <div className="lg:col-span-1">
          <div className="bg-[#0f2e20] p-6 md:p-8 rounded-3xl sticky top-8 text-white shadow-2xl">
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

      {/* MODAL */}
      {modalAberto && (
        <ModalGaleria
          fotos={todasFotos}
          fotoAtiva={fotoAtiva}
          onClose={() => setModalAberto(false)}
          onChange={setFotoAtiva}
        />
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