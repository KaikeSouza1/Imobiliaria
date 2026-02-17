"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation"; 
import { Menu, X, ChevronDown, Phone, Mail, Facebook, Instagram, FileText, MessageCircle } from "lucide-react";

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [dropdownVenda, setDropdownVenda] = useState(false);
  const [dropdownLocacao, setDropdownLocacao] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // CONFIGURAÇÃO DE PÁGINA
  const isHome = pathname === "/";
  // O Header fica "Compacto" se scrollar OU se não for a Home
  const isCompact = scrolled || !isHome;

  // ESTILOS DINÂMICOS
  const headerBg = isCompact ? "bg-[#0f2e20] shadow-xl" : "bg-transparent";
  
  // Altura reduzida nas páginas internas ou no scroll
  const headerHeight = isCompact ? "h-16" : "h-24"; 
  const logoSize = isCompact ? "w-32 h-16" : "w-48 h-24";
  
  const textClasses = "text-white";
  const hoverClasses = "hover:text-green-300";

  // LISTA DE OPÇÕES ATUALIZADA
  const propertyTypes = [
    "Apartamento",
    "Casa",
    "Sobrado",
    "Comercial",
    "Terreno",
    "Terreno Rural"
  ];

  return (
    <div className="fixed top-0 z-50 w-full font-sans transition-all duration-500">

      {/* === BARRA SUPERIOR === */}
      <div className={`bg-[#0f2e20] text-white text-[10px] md:text-xs transition-all duration-500 overflow-hidden ${isCompact ? 'py-1 opacity-95' : 'py-3'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-4 gap-2">
          <div className="flex items-center gap-4 md:gap-8">
            <a href="tel:42999755493" className="flex items-center gap-2 hover:text-green-200 transition-colors">
              <Phone size={isCompact ? 12 : 16} /> (42) 99975-5493
            </a>
            <span className="flex items-center gap-2 border-l border-green-800 pl-4 md:pl-8">
              <FileText size={isCompact ? 12 : 16} /> CRECI-PR J09362
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="mailto:contato@imobiliariaportoiguacu.com.br" className="flex items-center gap-2 hover:text-green-200 transition-colors">
              <Mail size={14} /> contato@imobiliariaportoiguacu.com.br
            </a>
            <div className="flex items-center gap-4 border-l border-green-800 pl-8">
              <a href="#" target="_blank" className="hover:text-green-200 transition-colors"><Facebook size={18} /></a>
              <a href="https://www.instagram.com/imobiliariaportoiguacu/" target="_blank" className="hover:text-green-200 transition-colors"><Instagram size={18} /></a>
            </div>
          </div>
        </div>
      </div>

      {/* === MENU PRINCIPAL === */}
      <header className={`${headerBg} transition-all duration-500 border-t border-white/5`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center transition-all duration-500 ${headerHeight}`}>

            {/* LOGO DINÂMICA */}
            <Link href="/" className={`flex-shrink-0 relative transition-all duration-500 ${logoSize}`}>
              <Image
                src="/logo_nova.png"
                alt="Porto Iguaçu"
                fill
                className="object-contain filter drop-shadow-md"
                priority
              />
            </Link>

            {/* NAV DESKTOP */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link href="/" className={`${textClasses} ${hoverClasses} font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-colors`}>
                Home
              </Link>

              <Link href="/sobre" className={`${textClasses} ${hoverClasses} font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-colors`}>
                Quem Somos
              </Link>

              {/* Dropdown VENDA (Opções Adicionadas) */}
              <div
                className="relative group flex items-center h-full"
                onMouseEnter={() => setDropdownVenda(true)}
                onMouseLeave={() => setDropdownVenda(false)}
              >
                <button className={`flex items-center gap-1 ${textClasses} ${hoverClasses} font-bold text-[10px] lg:text-xs uppercase tracking-widest`}>
                  Venda <ChevronDown size={12} />
                </button>
                <div className={`absolute ${isCompact ? 'top-12' : 'top-16'} left-0 w-48 bg-[#0f2e20] shadow-2xl rounded-b-xl overflow-hidden transition-all duration-300 ${dropdownVenda ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                  <div className="py-2">
                    <Link href="/imoveis/venda" className="block px-6 py-2 text-white hover:bg-green-700 text-[10px] font-bold uppercase border-b border-green-800 mb-2">Ver Todos</Link>
                    {propertyTypes.map((tipo) => (
                       <Link 
                         key={tipo} 
                         href={`/imoveis/venda?tipo=${tipo}`} 
                         className="block px-6 py-2 text-green-100 hover:bg-green-700 text-[10px] font-bold uppercase"
                       >
                         {tipo}
                       </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dropdown LOCAÇÃO (Opções Adicionadas) */}
              <div
                className="relative group flex items-center h-full"
                onMouseEnter={() => setDropdownLocacao(true)}
                onMouseLeave={() => setDropdownLocacao(false)}
              >
                <button className={`flex items-center gap-1 ${textClasses} ${hoverClasses} font-bold text-[10px] lg:text-xs uppercase tracking-widest`}>
                  Locação <ChevronDown size={12} />
                </button>
                <div className={`absolute ${isCompact ? 'top-12' : 'top-16'} left-0 w-48 bg-[#0f2e20] shadow-2xl rounded-b-xl overflow-hidden transition-all duration-300 ${dropdownLocacao ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                  <div className="py-2">
                    <Link href="/imoveis/aluguel" className="block px-6 py-2 text-white hover:bg-green-700 text-[10px] font-bold uppercase border-b border-green-800 mb-2">Ver Todos</Link>
                    {propertyTypes.map((tipo) => (
                       <Link 
                         key={tipo} 
                         href={`/imoveis/aluguel?tipo=${tipo}`} 
                         className="block px-6 py-2 text-green-100 hover:bg-green-700 text-[10px] font-bold uppercase"
                       >
                         {tipo}
                       </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link href="/anuncie" className={`${textClasses} ${hoverClasses} font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-colors`}>
                Anuncie
              </Link>

              <Link href="/contato" className={`${textClasses} ${hoverClasses} font-bold text-[10px] lg:text-xs uppercase tracking-widest transition-colors`}>
                Contato
              </Link>
            </nav>

            {/* BOTÃO WHATSAPP COMPACTO */}
            <div className="hidden md:block pl-4">
              <Link
                href="https://api.whatsapp.com/send?phone=5542999755493"
                target="_blank"
                className={`flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black uppercase transition-all shadow-lg border border-green-500 ${isCompact ? 'px-4 py-2 text-[10px]' : 'px-6 py-3 text-xs'}`}
              >
                <MessageCircle size={isCompact ? 16 : 18} /> WhatsApp
              </Link>
            </div>

            {/* BOTÃO MOBILE */}
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="md:hidden p-2 rounded-lg transition-colors text-white hover:bg-white/10"
            >
              {menuAberto ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* MENU MOBILE */}
      {menuAberto && (
        <div className="md:hidden bg-[#0f2e20] border-t border-green-800 absolute w-full left-0 top-[100px] shadow-2xl h-screen overflow-y-auto pb-20 z-40">
          <div className="p-6 space-y-2">
            <Link href="/" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-white hover:bg-green-800 rounded-lg uppercase text-sm border-l-4 border-green-500">Home</Link>
            <Link href="/sobre" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-green-100 hover:bg-green-800 rounded-lg uppercase text-sm">Quem Somos</Link>
            <Link href="/imoveis/venda" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-green-100 hover:bg-green-800 rounded-lg uppercase text-sm">Venda</Link>
            <Link href="/imoveis/aluguel" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-green-100 hover:bg-green-800 rounded-lg uppercase text-sm">Locação</Link>
            <Link href="/contato" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-green-100 hover:bg-green-800 rounded-lg uppercase text-sm">Contato</Link>
            <Link href="https://api.whatsapp.com/send?phone=5542999755493" target="_blank" className="block px-4 py-3 font-bold text-white bg-green-600 rounded-lg uppercase text-sm text-center mt-4">WhatsApp</Link>
          </div>
        </div>
      )}
    </div>
  );
}