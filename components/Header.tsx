"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown, MessageCircle } from "lucide-react";

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
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-green-700 font-bold text-xs uppercase tracking-wide transition-colors">
              Home
            </Link>

            {/* Dropdown VENDA */}
            <div 
              className="relative group h-24 flex items-center"
              onMouseEnter={() => setDropdownVenda(true)}
              onMouseLeave={() => setDropdownVenda(false)}
            >
              <button className="flex items-center gap-1 text-gray-700 group-hover:text-green-700 font-bold text-xs uppercase tracking-wide">
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
              className="relative group h-24 flex items-center"
              onMouseEnter={() => setDropdownLocacao(true)}
              onMouseLeave={() => setDropdownLocacao(false)}
            >
              <button className="flex items-center gap-1 text-gray-700 group-hover:text-green-700 font-bold text-xs uppercase tracking-wide">
                Locação <ChevronDown size={14} />
              </button>
              
              <div className={`absolute top-16 left-0 w-48 bg-[#0f2e20] shadow-xl rounded-b-xl overflow-hidden transition-all duration-200 ${dropdownLocacao ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                <Link href="/imoveis/aluguel" className="block px-6 py-3 text-white hover:bg-green-700 text-xs font-bold uppercase border-b border-green-800">Ver Todos</Link>
                <Link href="/imoveis/aluguel?tipo=casa" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Casa</Link>
                <Link href="/imoveis/aluguel?tipo=apartamento" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Apartamento</Link>
                <Link href="/imoveis/aluguel?tipo=comercial" className="block px-6 py-3 text-green-100 hover:bg-green-700 text-xs font-bold uppercase">Comercial</Link>
              </div>
            </div>

            <Link href="/anuncie" className="text-gray-700 hover:text-green-700 font-bold text-xs uppercase tracking-wide transition-colors">
              Anuncie Conosco
            </Link>

            {/* === AQUI ESTÁ O LINK QUE FALTAVA === */}
            <Link href="/contato" className="text-gray-700 hover:text-green-700 font-bold text-xs uppercase tracking-wide transition-colors">
              Fale Conosco
            </Link>
          </nav>

          {/* BOTÃO DE WHATSAPP (Direto) */}
          <div className="hidden md:block pl-4">
            <Link 
              href="https://api.whatsapp.com/send?phone=5542998439975" 
              target="_blank"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <MessageCircle size={18} /> WhatsApp
            </Link>
          </div>

          {/* BOTÃO MENU MOBILE */}
          <button 
            onClick={() => setMenuAberto(!menuAberto)} 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {menuAberto ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MENU MOBILE */}
      {menuAberto && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 top-24 shadow-2xl h-[calc(100vh-6rem)] overflow-y-auto pb-20">
          <div className="p-6 space-y-4">
            <Link href="/" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-gray-800 bg-gray-50 rounded-lg uppercase text-sm border-l-4 border-green-600">Home</Link>
            
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="font-black text-green-800 text-xs uppercase mb-3">Venda</p>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/imoveis/venda" onClick={() => setMenuAberto(false)} className="text-sm text-gray-600 font-medium hover:text-green-700">Ver Todos</Link>
                <Link href="/imoveis/venda?tipo=casa" onClick={() => setMenuAberto(false)} className="text-sm text-gray-600 font-medium hover:text-green-700">Casas</Link>
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-4">
              <p className="font-black text-green-800 text-xs uppercase mb-3">Locação</p>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/imoveis/aluguel" onClick={() => setMenuAberto(false)} className="text-sm text-gray-600 font-medium hover:text-green-700">Ver Todos</Link>
              </div>
            </div>

            <Link href="/anuncie" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-gray-600 hover:bg-green-50 rounded-lg uppercase text-sm">Anuncie Conosco</Link>
            
            {/* LINK NO MOBILE TAMBÉM */}
            <Link href="/contato" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-gray-600 hover:bg-green-50 rounded-lg uppercase text-sm">Fale Conosco</Link>
            
            <Link href="/admin/imoveis" onClick={() => setMenuAberto(false)} className="block px-4 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-lg uppercase text-xs mt-8">Área Restrita</Link>
          </div>
        </div>
      )}
    </header>
  );
}