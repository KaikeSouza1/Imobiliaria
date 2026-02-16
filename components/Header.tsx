"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Instagram, Facebook, Menu, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full font-sans shadow-sm bg-white relative z-50">
      
      {/* Barra Superior (Verde Escuro) */}
      <div className="bg-[#0f2e20] text-gray-200 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex gap-6">
            <span className="flex items-center gap-1 hover:text-white cursor-pointer">
              <Phone size={14} className="text-green-500" /> (42) 99975-5493
            </span>
            <span className="hidden sm:flex items-center gap-1 hover:text-white cursor-pointer">
              <Mail size={14} className="text-green-500" /> contato@imobiliariaportoiguacu.com.br
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <span>Segunda a Sexta 08:30 às 18:30h</span>
            <div className="flex gap-3 border-l border-gray-700 pl-4">
              <Link href="#" className="hover:text-green-400 transition-colors"><Facebook size={16} /></Link>
              <Link href="#" className="hover:text-green-400 transition-colors"><Instagram size={16} /></Link>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Principal */}
      <div className="bg-white sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-24 flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="Porto Iguaçu" 
              width={200} 
              height={80} 
              className="h-16 w-auto object-contain"
            />
          </Link>

          {/* Links Centrais (Desktop) */}
          <nav className="hidden lg:flex gap-8 font-bold text-sm uppercase text-gray-600 tracking-wide items-center h-full">
            <Link href="/" className="hover:text-green-700 transition-colors h-full flex items-center border-b-2 border-transparent hover:border-green-600">Início</Link>
            <Link href="/sobre" className="hover:text-green-700 transition-colors h-full flex items-center border-b-2 border-transparent hover:border-green-600">Quem somos</Link>
            
            {/* MENU DROPDOWN VENDA (Estilo da sua foto) */}
            <div className="group relative h-full flex items-center cursor-pointer">
              <span className="flex items-center gap-1 hover:text-green-700 group-hover:text-green-700 transition-colors border-b-2 border-transparent group-hover:border-green-600 h-full">
                Venda <ChevronDown size={14} />
              </span>
              
              {/* O Menu que abre (Verde igual a foto) */}
              <div className="absolute top-full left-0 w-56 bg-[#0f2e20] text-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 rounded-b-lg overflow-hidden">
                <Link href="/imoveis/venda?tipo=apartamento" className="block px-6 py-3 hover:bg-green-700 transition-colors border-b border-green-800/50 text-xs font-bold">Apartamento</Link>
                <Link href="/imoveis/venda?tipo=casa" className="block px-6 py-3 hover:bg-green-700 transition-colors border-b border-green-800/50 text-xs font-bold">Casa</Link>
                <Link href="/imoveis/venda?tipo=comercial" className="block px-6 py-3 hover:bg-green-700 transition-colors border-b border-green-800/50 text-xs font-bold">Comercial</Link>
                <Link href="/imoveis/venda?tipo=sobrado" className="block px-6 py-3 hover:bg-green-700 transition-colors border-b border-green-800/50 text-xs font-bold">Sobrado</Link>
                <Link href="/imoveis/venda?tipo=terreno" className="block px-6 py-3 hover:bg-green-700 transition-colors border-b border-green-800/50 text-xs font-bold">Terreno</Link>
                <Link href="/imoveis/venda?tipo=rural" className="block px-6 py-3 hover:bg-green-700 transition-colors text-xs font-bold">Terreno Rural</Link>
              </div>
            </div>

            {/* MENU DROPDOWN ALUGUEL (Para manter padrão) */}
            <div className="group relative h-full flex items-center cursor-pointer">
              <span className="flex items-center gap-1 hover:text-green-700 group-hover:text-green-700 transition-colors border-b-2 border-transparent group-hover:border-green-600 h-full">
                Locação <ChevronDown size={14} />
              </span>
              <div className="absolute top-full left-0 w-56 bg-[#0f2e20] text-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 rounded-b-lg overflow-hidden">
                <Link href="/imoveis/aluguel?tipo=apartamento" className="block px-6 py-3 hover:bg-green-700 transition-colors border-b border-green-800/50 text-xs font-bold">Apartamento</Link>
                <Link href="/imoveis/aluguel?tipo=casa" className="block px-6 py-3 hover:bg-green-700 transition-colors border-b border-green-800/50 text-xs font-bold">Casa</Link>
                <Link href="/imoveis/aluguel?tipo=comercial" className="block px-6 py-3 hover:bg-green-700 transition-colors text-xs font-bold">Comercial</Link>
              </div>
            </div>

            <Link href="/anuncie" className="hover:text-green-700 transition-colors h-full flex items-center border-b-2 border-transparent hover:border-green-600">Anuncie Conosco</Link>
            <Link href="/contato" className="hover:text-green-700 transition-colors h-full flex items-center border-b-2 border-transparent hover:border-green-600">Fale Conosco</Link>
          </nav>

          {/* Botão de Destaque */}
          <div className="flex items-center gap-4">
            <Link href="/imoveis/venda" className="hidden lg:block bg-green-600 text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-green-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-xs tracking-wider">
              BUSCAR IMÓVEIS
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button className="lg:hidden text-green-800" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={32} />
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile (Simples para funcionar em telas pequenas) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 absolute w-full left-0 top-full shadow-lg">
          <nav className="flex flex-col p-4 font-bold text-gray-600">
            <Link href="/" className="py-3 border-b border-gray-100">Início</Link>
            <Link href="/imoveis/venda" className="py-3 border-b border-gray-100 text-green-700">Comprar</Link>
            <Link href="/imoveis/aluguel" className="py-3 border-b border-gray-100">Alugar</Link>
            <Link href="/anuncie" className="py-3 border-b border-gray-100">Anuncie</Link>
            <Link href="/sobre" className="py-3">Quem somos</Link>
          </nav>
        </div>
      )}
    </header>
  );
}