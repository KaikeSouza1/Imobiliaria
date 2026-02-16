"use client";

import Image from "next/image";
import Link from "next/link"; // Importação essencial
import { MapPin, BedDouble, Bath, Car, Maximize, ArrowRight } from "lucide-react";

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
  };
}

export default function PropertyCard({ property }: PropertyProps) {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all group">
      {/* Imagem com Link */}
      <Link href={`/imovel/${property.id}`} className="relative block h-64 overflow-hidden">
        <Image 
          src={property.imagem} 
          alt={property.titulo} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg ${property.finalidade === 'Venda' ? 'bg-blue-600' : 'bg-green-600'}`}>
            {property.finalidade}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Valor</p>
          <p className="text-lg font-black text-gray-900">{property.preco}</p>
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="p-6">
        <div className="flex items-center gap-1 text-green-600 mb-2">
          <MapPin size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wide truncate">
            {property.bairro}, {property.cidade}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-4 line-clamp-1 group-hover:text-green-700 transition-colors">
          {property.titulo}
        </h3>

        {/* Ícones Técnicos */}
        <div className="grid grid-cols-4 gap-2 py-4 border-t border-gray-50">
          <div className="flex flex-col items-center">
            <BedDouble size={18} className="text-gray-400 mb-1" />
            <span className="text-xs font-bold text-gray-700">{property.quartos}</span>
          </div>
          <div className="flex flex-col items-center">
            <Bath size={18} className="text-gray-400 mb-1" />
            <span className="text-xs font-bold text-gray-700">{property.banheiros}</span>
          </div>
          <div className="flex flex-col items-center">
            <Car size={18} className="text-gray-400 mb-1" />
            <span className="text-xs font-bold text-gray-700">{property.vagas}</span>
          </div>
          <div className="flex flex-col items-center">
            <Maximize size={18} className="text-gray-400 mb-1" />
            <span className="text-xs font-bold text-gray-700">{property.area}m²</span>
          </div>
        </div>

        {/* O BOTÃO QUE ESTAVA FALTANDO O LINK */}
        <Link 
          href={`/imovel/${property.id}`}
          className="mt-4 w-full bg-slate-50 hover:bg-[#0f2e20] text-[#0f2e20] hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-gray-100 hover:border-[#0f2e20]"
        >
          VER DETALHES <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}