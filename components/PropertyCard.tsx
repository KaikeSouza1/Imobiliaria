"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, BedDouble, Bath, Car, Maximize, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { generateSlug } from "@/lib/slug";

interface PropertyProps {
  property: {
    id: number;
    titulo: string;
    preco: string;
    endereco: string;
    bairro: string;
    cidade: string;
    quartos: number;
    banheiros: number;
    vagas: number;
    area: number;
    imagem: string;
    finalidade: string;
    tipo?: string;
    status?: string;
  };
}

export default function PropertyCard({ property }: PropertyProps) {
  const status = property.status || "disponivel";

  const statusConfig: Record<string, { label: string; bgHex: string; overlay: string; icon: React.ReactNode }> = {
    vendido:   { label: "VENDIDO",   bgHex: "#0f2e20", overlay: "bg-[#0f2e20]/70", icon: <CheckCircle size={14} className="inline mr-1" /> },
    alugado:   { label: "ALUGADO",   bgHex: "#1a5c35", overlay: "bg-[#1a5c35]/70", icon: <CheckCircle size={14} className="inline mr-1" /> },
    reservado: { label: "RESERVADO", bgHex: "#2d8a50", overlay: "bg-[#2d8a50]/60", icon: <XCircle size={14} className="inline mr-1" /> },
    disponivel: {
      label: property.finalidade === "Venda" ? "VENDA" : "ALUGUEL",
      bgHex: property.finalidade === "Venda" ? "#0f2e20" : "#1a5c35",
      overlay: "",
      icon: null,
    },
  };

  const currentStatus = statusConfig[status] || statusConfig["disponivel"];
  const isSoldOrRented = status === "vendido" || status === "alugado" || status === "reservado";

  // Gera URL amigável
  const slug = generateSlug({
    id: property.id,
    titulo: property.titulo,
    tipo: property.tipo || "imovel",
    finalidade: property.finalidade,
    bairro: property.bairro,
    cidade: property.cidade,
  });
  const href = `/imovel/${slug}`;

  return (
    <div className="rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-green-900/20 transition-all duration-500 group border border-green-900/10">

      {/* FOTO */}
      <Link href={href} className="relative block h-64 overflow-hidden">
        <Image
          src={property.imagem}
          alt={property.titulo}
          fill
          className={`object-cover transition-transform duration-500 ${isSoldOrRented ? "grayscale-[20%]" : "group-hover:scale-110"}`}
        />

        {/* FAIXA DIAGONAL STATUS */}
        {isSoldOrRented && (
          <div className={`absolute inset-0 ${currentStatus.overlay} flex items-center justify-center`}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="font-black text-2xl tracking-[0.25em] uppercase px-16 py-3 rotate-[-35deg] w-[160%] text-center shadow-2xl border-y-4 border-white/20 flex items-center justify-center gap-2 text-white"
                style={{ backgroundColor: currentStatus.bgHex }}
              >
                {currentStatus.icon}{currentStatus.label}{currentStatus.icon}
              </div>
            </div>
          </div>
        )}

        {/* BADGE */}
        <div className="absolute top-4 left-4">
          <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg backdrop-blur-sm"
            style={{ backgroundColor: currentStatus.bgHex }}>
            {isSoldOrRented ? currentStatus.label : property.finalidade}
          </span>
        </div>

        {/* PREÇO */}
        <div className={`absolute bottom-4 right-4 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg ${isSoldOrRented ? "bg-[#0f2e20]/80" : "bg-white/90"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-tighter leading-none ${isSoldOrRented ? "text-green-300" : "text-gray-400"}`}>Valor</p>
          <p className={`text-lg font-black ${isSoldOrRented ? "text-white/60 line-through" : "text-gray-900"}`}>
            {property.preco}
          </p>
        </div>
      </Link>

      {/* CONTEÚDO COM DEGRADÊ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, #ffffff 0%, #a8d5b5 40%, #0f2e20 100%)" }} />
        <div className="relative z-10 p-6">

          <div className="flex items-center gap-1 mb-2 text-[#0f2e20]">
            <MapPin size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wide truncate">{property.bairro}, {property.cidade}</span>
          </div>

          <h3 className={`text-xl font-bold mb-4 line-clamp-1 transition-colors ${isSoldOrRented ? "text-green-900/60" : "text-gray-800 group-hover:text-[#0f2e20]"}`}>
            {property.titulo}
          </h3>

          {isSoldOrRented && (
            <div className="text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl mb-4 flex items-center gap-2" style={{ backgroundColor: currentStatus.bgHex }}>
              {currentStatus.icon}
              Este imóvel já foi {status === "vendido" ? "vendido" : status === "alugado" ? "alugado" : "reservado"}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 py-4 border-t border-green-900/20">
            <div className="flex flex-col items-center"><BedDouble size={18} className="mb-1 text-[#0f2e20]" /><span className="text-xs font-bold text-gray-700">{property.quartos}</span></div>
            <div className="flex flex-col items-center"><Bath size={18} className="mb-1 text-[#0f2e20]" /><span className="text-xs font-bold text-gray-700">{property.banheiros}</span></div>
            <div className="flex flex-col items-center"><Car size={18} className="mb-1 text-[#0f2e20]" /><span className="text-xs font-bold text-gray-700">{property.vagas}</span></div>
            <div className="flex flex-col items-center"><Maximize size={18} className="mb-1 text-[#0f2e20]" /><span className="text-xs font-bold text-gray-700">{property.area}m²</span></div>
          </div>

          <Link href={href}
            className={`mt-4 w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border
              ${isSoldOrRented
                ? "bg-white/10 text-white/50 border-white/10 cursor-default pointer-events-none"
                : "bg-white text-[#0f2e20] hover:bg-[#0f2e20] hover:text-white border-white/60 hover:border-[#0f2e20] shadow-md"
              }`}
          >
            {isSoldOrRented ? "Imóvel Indisponível" : "VER DETALHES"}
            {!isSoldOrRented && <ArrowRight size={16} />}
          </Link>
        </div>
      </div>
    </div>
  );
}