"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";

interface PropertyCarouselProps {
  items: any[];
}

export default function PropertyCarousel({ items }: PropertyCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightGradient, setShowRightGradient] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      // No mobile, rola a largura da tela. No desktop, rola o tamanho fixo do card.
      const isMobile = window.innerWidth < 768;
      const scrollAmount = isMobile ? window.innerWidth * 0.85 : 374; 
      
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  // Função para controlar a visibilidade do gradiente lateral (dica visual)
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      // Se a rolagem estiver perto do fim (tolerância de 10px), esconde o gradiente
      const isEnd = scrollLeft + clientWidth >= scrollWidth - 10;
      setShowRightGradient(!isEnd);
    }
  };

  useEffect(() => {
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", handleScroll);
      // Verifica estado inicial
      handleScroll();
    }
    return () => ref?.removeEventListener("scroll", handleScroll);
  }, [items]);

  return (
    <div className="relative w-full group">
      {/* Botão Esquerda (Apenas Desktop) */}
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
        className="flex gap-4 md:gap-6 overflow-x-auto pb-8 pt-4 px-4 md:px-2 snap-x snap-mandatory scroll-smooth"
        style={{ 
          scrollbarWidth: "none",  /* Firefox */
          msOverflowStyle: "none"  /* IE/Edge */
        }}
      >
        {/* Esconder scrollbar no Chrome/Safari */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {items.map((imovel) => (
          // MODIFICAÇÃO PRINCIPAL: w-[85vw] no mobile força o próximo card a aparecer um pedaço
          <div key={imovel.id} className="flex-none w-[85vw] sm:w-[300px] md:w-[350px] snap-center">
            <PropertyCard property={imovel} />
          </div>
        ))}
        
        {/* Espaçador final para o último item não ficar colado na borda no mobile */}
        <div className="w-2 flex-none md:hidden"></div>
      </div>

      {/* Gradiente indicativo de rolagem no Mobile (lado direito) */}
      <div 
        className={`md:hidden absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-slate-50/90 to-transparent pointer-events-none transition-opacity duration-300 z-10 ${showRightGradient ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Botão Direita (Apenas Desktop) */}
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