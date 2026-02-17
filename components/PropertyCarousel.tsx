"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";

interface PropertyCarouselProps {
  items: any[];
}

export default function PropertyCarousel({ items }: PropertyCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      // Rola o tamanho de um card (350px) + o gap (24px)
      const scrollAmount = 374; 
      
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="relative w-full">
      {/* Botão Esquerda */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 z-20 bg-white text-[#0f2e20] p-3 rounded-full shadow-2xl hover:scale-110 hover:bg-[#0f2e20] hover:text-white transition-all hidden md:flex items-center justify-center border border-gray-100"
        aria-label="Anterior"
      >
        <ChevronLeft size={24} strokeWidth={3} />
      </button>

      {/* Container de Scroll */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-8 pt-4 px-2 snap-x snap-mandatory scroll-smooth"
        style={{ 
          scrollbarWidth: "none",  /* Firefox */
          msOverflowStyle: "none"  /* IE/Edge */
        }}
      >
        {/* CSS para esconder scrollbar no Chrome/Safari */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {items.map((imovel) => (
          // flex-none é CRUCIAL aqui: impede que o card encolha
          <div key={imovel.id} className="flex-none w-[300px] md:w-[350px] snap-center">
            <PropertyCard property={imovel} />
          </div>
        ))}
      </div>

      {/* Botão Direita */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 z-20 bg-white text-[#0f2e20] p-3 rounded-full shadow-2xl hover:scale-110 hover:bg-[#0f2e20] hover:text-white transition-all hidden md:flex items-center justify-center border border-gray-100"
        aria-label="Próximo"
      >
        <ChevronRight size={24} strokeWidth={3} />
      </button>
    </div>
  );
}