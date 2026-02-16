"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, Phone } from "lucide-react";

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [dropdownVenda, setDropdownVenda] = useState(false);
  const [dropdownLocacao, setDropdownLocacao] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* LOGO */}
          <Link href="/" className="flex-shrink-0 relative w-40 h-16">
            <Image src="/logo.png" alt="Porto Iguaçu" fill className="object-contain" priority />
          </Link>

          {/* MENU DESKTOP */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-green-700 font-bold text-sm uppercase tracking-wide">
              Home
            </Link>

            {/* Dropdown VENDA */}
            <div 
              className="relative group"
              onMouseEnter={() => setDropdownVenda(true)}
              onMouseLeave={() => setDropdownVenda(false)}
            >
              <button className="flex items-center gap-1 text-gray-700 group-hover:text-green-700 font-bold text-sm uppercase tracking-wide py-6">
                Venda <ChevronDown size={14} />
              </button>
              
              {/* Menu Flutuante */}
              <div className={`absolute top-full left-0 w-48 bg-[#0f2e20] shadow-xl rounded-b-xl overflow-hidden transition-all duration-300 ${dropdownVenda ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                <Link href="/imoveis/venda" className="block px-6 py-3 text-white hover:bg-green-700 text-xs font-bold uppercase border-b border-green-800">
                  Ver Todos
                </Link>
                <Link href="/imoveis/venda?tipo=casa" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Casa</Link>
                <Link href="/imoveis/venda?tipo=apartamento" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Apartamento</Link>
                <Link href="/imoveis/venda?tipo=terreno" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Terreno</Link>
                <Link href="/imoveis/venda?tipo=comercial" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Comercial</Link>
                <Link href="/imoveis/venda?tipo=rural" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Rural</Link>
              </div>
            </div>

            {/* Dropdown LOCAÇÃO */}
            <div 
              className="relative group"
              onMouseEnter={() => setDropdownLocacao(true)}
              onMouseLeave={() => setDropdownLocacao(false)}
            >
              <button className="flex items-center gap-1 text-gray-700 group-hover:text-green-700 font-bold text-sm uppercase tracking-wide py-6">
                Locação <ChevronDown size={14} />
              </button>
              
              <div className={`absolute top-full left-0 w-48 bg-[#0f2e20] shadow-xl rounded-b-xl overflow-hidden transition-all duration-300 ${dropdownLocacao ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                <Link href="/imoveis/aluguel" className="block px-6 py-3 text-white hover:bg-green-700 text-xs font-bold uppercase border-b border-green-800">
                  Ver Todos
                </Link>
                <Link href="/imoveis/aluguel?tipo=casa" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Casa</Link>
                <Link href="/imoveis/aluguel?tipo=apartamento" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Apartamento</Link>
                <Link href="/imoveis/aluguel?tipo=comercial" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Comercial</Link>
              </div>
            </div>

            <Link href="/sobre" className="text-gray-700 hover:text-green-700 font-bold text-sm uppercase tracking-wide">
              A Imobiliária
            </Link>
            
            <Link href="/anuncie" className="text-gray-700 hover:text-green-700 font-bold text-sm uppercase tracking-wide">
              Anuncie Conosco
            </Link>
          </nav>

          {/* BOTÃO WHATSAPP (MANTIDO POIS É IMPORTANTE) */}
          <div className="hidden md:block">
            <Link 
              href="https://api.whatsapp.com/send?phone=5542998439975" 
              target="_blank"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-bold text-xs uppercase transition-all shadow-md hover:shadow-lg"
            >
              <Phone size={16} /> Fale Conosco
            </Link>
          </div>

          {/* BOTÃO MOBILE */}
          <button 
            onClick={() => setMenuAberto(!menuAberto)} 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {menuAberto ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MENU MOBILE (Expansível) */}
      {menuAberto && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 top-24 shadow-xl h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="p-4 space-y-2">
            <Link href="/" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-gray-800 hover:bg-green-50 rounded-lg uppercase text-sm">Home</Link>
            
            {/* Mobile Venda */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-bold text-green-800 text-xs uppercase mb-3">Venda</p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/imoveis/venda" onClick={() => setMenuAberto(false)} className="text-sm text-gray-600 font-medium hover:text-green-700">Ver Todos</Link>
                <Link href="/imoveis/venda?tipo=casa" onClick={() => setMenuAberto(false)} className="text-sm text-gray-600 font-medium hover:text-green-700">Casas</Link>
                <Link href="/imoveis/venda?tipo=apartamento" onClick={() => setMenuAberto(false)} className="text-sm text-gray-600 font-medium hover:text-green-700">Aps</Link>
                <Link href="/imoveis/venda?tipo=terreno" onClick={() => setMenuAberto(false)} className="text-sm text-gray-600 font-medium hover:text-green-700">Terrenos</Link>
              </div>
            </div>

            {/* Mobile Locação */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-bold text-green-800 text-xs uppercase mb-3">Locação</p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/imoveis/aluguel" onClick={() => setMenuAberto(false)} className="text-sm text-gray-600 font-medium hover:text-green-700">Ver Todos</Link>
                <Link href="/imoveis/aluguel?tipo=casa" onClick={() => setMenuAberto(false)} className="text-sm text-gray-600 font-medium hover:text-green-700">Casas</Link>
                <Link href="/imoveis/aluguel?tipo=apartamento" onClick={() => setMenuAberto(false)} className="text-sm text-gray-600 font-medium hover:text-green-700">Aps</Link>
              </div>
            </div>

            <Link href="/anuncie" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-gray-800 hover:bg-green-50 rounded-lg uppercase text-sm">Anuncie Conosco</Link>
            <Link href="/admin/imoveis" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-lg uppercase text-xs">Área Administrativa</Link>
          </div>
        </div>
      )}
    </header>
  );
}