"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, Phone, Mail, Facebook, Instagram, FileText, MessageCircle } from "lucide-react";

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [dropdownVenda, setDropdownVenda] = useState(false);
  const [dropdownLocacao, setDropdownLocacao] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerClasses = scrolled
    ? "bg-white shadow-md py-2"
    : "bg-transparent py-4";

  const textClasses = scrolled ? "text-[#0f2e20]" : "text-white";
  const hoverClasses = scrolled ? "hover:text-green-700" : "hover:text-green-300";

  return (
    <div className="fixed top-0 z-50 w-full font-sans transition-all duration-300">
      
      {/* === BARRA SUPERIOR (VERDE ESCURO) === */}
      <div className={`bg-[#0f2e20] text-white text-xs py-3 px-4 transition-all duration-300 ${scrolled ? 'hidden md:block' : 'block'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-8">
            <a href="tel:42999755493" className="flex items-center gap-2 hover:text-green-200 transition-colors text-sm">
              <Phone size={16} /> (42) 99975-5493
            </a>
             <span className="flex items-center gap-2 border-l border-green-800 pl-8 text-sm">
              <FileText size={16} /> CRECI-PR J09362
            </span>
          </div>
          <div className="flex items-center gap-8">
            <a href="mailto:contato@imobiliariaportoiguacu.com.br" className="flex items-center gap-2 hover:text-green-200 transition-colors hidden lg:flex text-sm">
              <Mail size={16} /> contato@imobiliariaportoiguacu.com.br
            </a>
            <div className="flex items-center gap-5 border-l border-green-800 pl-8">
                <a href="#" target="_blank" className="hover:text-green-200 transition-colors"><Facebook size={20}/></a>
                <a href="https://www.instagram.com/imobiliariaportoiguacu/" target="_blank" className="hover:text-green-200 transition-colors"><Instagram size={20}/></a>
            </div>
          </div>
        </div>
      </div>

      {/* === MENU PRINCIPAL === */}
      <header className={`${headerClasses} transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* LOGO - Mudei o nome para forçar a atualização */}
            <Link href="/" className="flex-shrink-0 relative w-48 h-24">
              <Image 
                src="/logo_nova.png"  // <--- RENOMEIE SEU ARQUIVO NA PASTA PUBLIC PARA ESSE NOME
                alt="Porto Iguaçu" 
                fill 
                className="object-contain filter drop-shadow-md" 
                priority 
                // Se a imagem ainda tiver fundo branco teimoso, descomente a linha abaixo (mas cuidado, pode deixar o branco transparente demais)
                // style={{ mixBlendMode: 'multiply' }} 
              />
            </Link>

            {/* NAV DESKTOP */}
            <nav className="hidden md:flex items-center gap-7">
              <Link href="/" className={`${textClasses} ${hoverClasses} font-bold text-xs uppercase tracking-wide transition-colors`}>
                Home
              </Link>

              <Link href="/sobre" className={`${textClasses} ${hoverClasses} font-bold text-xs uppercase tracking-wide transition-colors`}>
                Quem Somos
              </Link>

              {/* Dropdown VENDA */}
              <div 
                className="relative group h-20 flex items-center"
                onMouseEnter={() => setDropdownVenda(true)}
                onMouseLeave={() => setDropdownVenda(false)}
              >
                <button className={`flex items-center gap-1 ${textClasses} ${hoverClasses} font-bold text-xs uppercase tracking-wide`}>
                  Venda <ChevronDown size={14} />
                </button>
                <div className={`absolute top-16 left-0 w-48 bg-[#0f2e20] shadow-xl rounded-b-xl overflow-hidden transition-all duration-200 ${dropdownVenda ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                  <Link href="/imoveis/venda" className="block px-6 py-3 text-white hover:bg-green-700 text-xs font-bold uppercase border-b border-green-800">Ver Todos</Link>
                  <Link href="/imoveis/venda?tipo=casa" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Casa</Link>
                  <Link href="/imoveis/venda?tipo=apartamento" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Apartamento</Link>
                  <Link href="/imoveis/venda?tipo=terreno" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Terreno</Link>
                  <Link href="/imoveis/venda?tipo=rural" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Rural</Link>
                  <Link href="/imoveis/venda?tipo=comercial" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Comercial</Link>
                </div>
              </div>

              {/* Dropdown LOCAÇÃO */}
              <div 
                className="relative group h-20 flex items-center"
                onMouseEnter={() => setDropdownLocacao(true)}
                onMouseLeave={() => setDropdownLocacao(false)}
              >
                <button className={`flex items-center gap-1 ${textClasses} ${hoverClasses} font-bold text-xs uppercase tracking-wide`}>
                  Locação <ChevronDown size={14} />
                </button>
                <div className={`absolute top-16 left-0 w-48 bg-[#0f2e20] shadow-xl rounded-b-xl overflow-hidden transition-all duration-200 ${dropdownLocacao ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                  <Link href="/imoveis/aluguel" className="block px-6 py-3 text-white hover:bg-green-700 text-xs font-bold uppercase border-b border-green-800">Ver Todos</Link>
                  <Link href="/imoveis/aluguel?tipo=casa" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Casa</Link>
                  <Link href="/imoveis/aluguel?tipo=apartamento" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Apartamento</Link>
                  <Link href="/imoveis/aluguel?tipo=comercial" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Comercial</Link>
                </div>
              </div>

              <Link href="/anuncie" className={`${textClasses} ${hoverClasses} font-bold text-xs uppercase tracking-wide transition-colors`}>
                Anuncie Conosco
              </Link>

              <Link href="/contato" className={`${textClasses} ${hoverClasses} font-bold text-xs uppercase tracking-wide transition-colors`}>
                Fale Conosco
              </Link>
            </nav>

            <div className="hidden md:block pl-4">
              <Link 
                href="https://api.whatsapp.com/send?phone=5542999755493" 
                target="_blank"
                className="flex items-center gap-2 bg-[#0f2e20] hover:bg-green-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-green-800"
              >
                <MessageCircle size={18} /> WhatsApp
              </Link>
            </div>

            <button 
              onClick={() => setMenuAberto(!menuAberto)} 
              className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-[#0f2e20] hover:bg-gray-100' : 'text-white hover:bg-white/20'}`}
            >
              {menuAberto ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* MENU MOBILE */}
      {menuAberto && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 top-[120px] shadow-2xl h-screen overflow-y-auto pb-20 text-gray-800 z-40">
           <div className="p-6 space-y-4">
            <Link href="/" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-gray-800 bg-gray-50 rounded-lg uppercase text-sm border-l-4 border-[#0f2e20]">Home</Link>
            <Link href="/sobre" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-gray-600 hover:bg-green-50 rounded-lg uppercase text-sm">Quem Somos</Link>
            {/* Resto dos links mobile... */}
          </div>
        </div>
      )}
    </div>
  );
}