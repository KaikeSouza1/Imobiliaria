"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Phone, FileText, GitCompare, TrendingUp, Facebook, Instagram, Mail } from "lucide-react";

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [dropdownVenda, setDropdownVenda] = useState(false);
  const [dropdownLocacao, setDropdownLocacao] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = pathname === "/";
  const isCompact = scrolled || !isHome;

  const headerBg = isCompact ? "bg-[#0f2e20] shadow-xl" : "bg-transparent";
  const headerHeight = isCompact ? "h-16" : "h-24";
  const logoSize = isCompact ? "w-32 h-16" : "w-48 h-24";

  const propertyTypesVenda = [
    "Apartamento",
    "Barracão",
    "Casa",
    "Comercial",
    "Imóvel Rural",
    "Sobrado",
    "Terreno Rural",
    "Terreno Urbano",
  ];

  const propertyTypesLocacao = [
    "Apartamento",
    "Barracão",
    "Casa",
    "Comercial",
    "Imóvel Rural",
    "Kitnet",
    "Sobrado",
    "Terreno Rural",
    "Terreno Urbano",
  ];

  return (
    <div className="fixed top-0 z-50 w-full font-sans transition-all duration-500">
      
      {/* === BARRA SUPERIOR === */}
      <div className={`bg-[#0f2e20] text-white text-[10px] md:text-xs transition-all duration-500 overflow-hidden ${isCompact ? "py-1 opacity-95" : "py-3"}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 w-full">
          
          {/* Lado Esquerdo: Contatos básicos */}
          <div className="flex items-center gap-4 md:gap-6">
            <a href="tel:42999755493" className="flex items-center gap-2 hover:text-green-200 transition-colors">
              <Phone size={isCompact ? 12 : 14} /> <span className="hidden sm:inline">(42) 99975-5493</span>
            </a>
            <span className="flex items-center gap-2 border-l border-green-800 pl-4">
              <FileText size={isCompact ? 12 : 14} /> <span className="hidden sm:inline">CRECI-PR J09362</span>
            </span>
          </div>
          
          {/* Lado Direito */}
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/indices" className="flex items-center gap-1.5 hover:text-green-200 transition-colors font-medium">
              <TrendingUp size={14} className="text-green-400" /> Índices
            </Link>

            <Link href="/comparar" className="flex items-center gap-1.5 hover:text-green-200 transition-colors border-l border-green-800 pl-4 md:pl-6 font-medium">
              <GitCompare size={14} /> Comparar
            </Link>
            
            <div className="flex items-center gap-4 border-l border-green-800 pl-4 md:pl-6">
              <a href="https://www.facebook.com/profile.php?id=61560745614772" target="_blank" className="hover:text-green-300 transition-transform hover:scale-110">
                <Facebook size={16} />
              </a>
              <a href="https://www.instagram.com/imobportoiguacu/" target="_blank" className="hover:text-green-300 transition-transform hover:scale-110">
                <Instagram size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* === MENU PRINCIPAL === */}
      <header className={`${headerBg} transition-all duration-500 border-t border-white/5`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center transition-all duration-500 ${headerHeight}`}>

            {/* LOGO */}
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
              <Link href="/" className="text-white hover:text-green-300 font-bold text-[11px] uppercase tracking-widest transition-colors">
                Home
              </Link>

              <Link href="/sobre" className="text-white hover:text-green-300 font-bold text-[11px] uppercase tracking-widest transition-colors">
                Quem Somos
              </Link>

              {/* Dropdown VENDA */}
              <div className="relative group flex items-center h-full" onMouseEnter={() => setDropdownVenda(true)} onMouseLeave={() => setDropdownVenda(false)}>
                <button className="flex items-center gap-1 text-white hover:text-green-300 font-bold text-[11px] uppercase tracking-widest">
                  Venda <ChevronDown size={12} />
                </button>
                <div className={`absolute ${isCompact ? "top-12" : "top-16"} left-0 w-48 bg-[#0f2e20] shadow-2xl rounded-b-lg overflow-hidden transition-all duration-300 ${dropdownVenda ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}>
                  <div className="py-2">
                    {propertyTypesVenda.map((tipo) => (
                      <Link key={tipo} href={`/imoveis/venda?tipo=${tipo}`} className="block px-6 py-2 text-green-100 hover:bg-green-800 text-[10px] font-bold uppercase transition-colors">
                        {tipo}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dropdown LOCAÇÃO */}
              <div className="relative group flex items-center h-full" onMouseEnter={() => setDropdownLocacao(true)} onMouseLeave={() => setDropdownLocacao(false)}>
                <button className="flex items-center gap-1 text-white hover:text-green-300 font-bold text-[11px] uppercase tracking-widest">
                  Locação <ChevronDown size={12} />
                </button>
                <div className={`absolute ${isCompact ? "top-12" : "top-16"} left-0 w-48 bg-[#0f2e20] shadow-2xl rounded-b-lg overflow-hidden transition-all duration-300 ${dropdownLocacao ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}>
                  <div className="py-2">
                    {propertyTypesLocacao.map((tipo) => (
                      <Link key={tipo} href={`/imoveis/aluguel?tipo=${tipo}`} className="block px-6 py-2 text-green-100 hover:bg-green-800 text-[10px] font-bold uppercase transition-colors">
                        {tipo}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link href="/anuncie" className="text-white hover:text-green-300 font-bold text-[11px] uppercase tracking-widest transition-colors">
                Anuncie
              </Link>

              <Link href="/contato" className="text-white hover:text-green-300 font-bold text-[11px] uppercase tracking-widest transition-colors">
                Contato
              </Link>
            </nav>

            {/* BOTÃO MOBILE */}
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10"
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
            <Link href="/indices" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-yellow-400 hover:bg-green-800 rounded-lg uppercase text-sm">Índices Econômicos</Link>
            <Link href="/imoveis/venda" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-green-100 hover:bg-green-800 rounded-lg uppercase text-sm">Venda</Link>
            <Link href="/imoveis/aluguel" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-green-100 hover:bg-green-800 rounded-lg uppercase text-sm">Locação</Link>
            <Link href="/imoveis/aluguel?tipo=Kitnet" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-green-300 hover:bg-green-800 rounded-lg uppercase text-sm pl-8">↳ Kitnets</Link>
            <Link href="/anuncie" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-green-100 hover:bg-green-800 rounded-lg uppercase text-sm">Anuncie</Link>
            <Link href="/contato" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-green-100 hover:bg-green-800 rounded-lg uppercase text-sm">Contato</Link>
          </div>
        </div>
      )}
    </div>
  );
}