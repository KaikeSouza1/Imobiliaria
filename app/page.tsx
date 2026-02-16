"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Search, MapPin, Home, DollarSign, ChevronDown, Check, ArrowRight, BedDouble, Bath, Car, Maximize } from "lucide-react";

// Dados simulados para os cards de destaque (você pode substituir pela sua API depois)
const properties = [
  {
    id: 1,
    titulo: "CASA CIDADE NOVA",
    preco: "R$ 1.200.000,00",
    endereco: "Av. João Pessoa",
    bairro: "Cidade Nova",
    cidade: "Porto União",
    quartos: 3,
    banheiros: 2,
    vagas: 2,
    area: 240,
    imagem: "https://res.cloudinary.com/drrajudle/image/upload/v1771258467/imoveis-porto-iguacu/casa-cidade-nova_cover.jpg",
    finalidade: "Venda"
  },
  {
    id: 2,
    titulo: "APARTAMENTO CENTRO",
    preco: "R$ 3.500,00 /mês",
    endereco: "Rua Sete de Setembro",
    bairro: "Centro",
    cidade: "União da Vitória",
    quartos: 2,
    banheiros: 1,
    vagas: 1,
    area: 85,
    imagem: "https://res.cloudinary.com/drrajudle/image/upload/v1771252897/imoveis-porto-iguacu/apt-centro_cover.jpg",
    finalidade: "Locação"
  }
];

export default function HomePage() {
  // ESTADOS DA BUSCA
  const [finalidade, setFinalidade] = useState("Comprar");
  const [tipo, setTipo] = useState("Todos");
  const [cidade, setCidade] = useState("Todos");
  const [bairro, setBairro] = useState("Todos");
  
  // ESTADOS DOS MENUS (CORREÇÃO DO CORTE)
  const [openBairro, setOpenBairro] = useState(false);
  const [openTipo, setOpenTipo] = useState(false);
  const [openCidade, setOpenCidade] = useState(false);

  const bairros = ["Todos", "Centro", "São Cristóvão", "Santa Rosa", "Cidade Nova", "Rocio"];

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      
      {/* === HERO SECTION (CAPA) === */}
      <section className="relative h-[500px] md:h-[600px] flex items-center justify-center">
        <Image 
          src="https://res.cloudinary.com/drrajudle/image/upload/v1771258467/imoveis-porto-iguacu/hero-bg.jpg" // Coloque uma imagem bonita de fundo aqui ou deixe essa
          alt="Background" 
          fill 
          className="object-cover brightness-50"
          priority
        />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-4 drop-shadow-lg">
            Valorize seu patrimônio
          </h1>
          <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto drop-shadow-md">
            Anuncie com quem é referência em Porto União e União da Vitória.
          </p>
        </div>
      </section>

      {/* === BUSCA (AQUI ESTAVA O ERRO) === */}
      <div className="max-w-6xl mx-auto px-4 relative z-30 -mt-24 mb-20">
        {/* REMOVIDO overflow-hidden DAQUI */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative">
          
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-gray-800">
              Encontre seu imóvel ideal
            </h2>
            <div className="h-1.5 w-16 bg-green-500 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            
            {/* FINALIDADE */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <DollarSign size={14} /> Finalidade
              </label>
              <div className="relative">
                <select 
                  value={finalidade}
                  onChange={(e) => setFinalidade(e.target.value)}
                  className="w-full bg-slate-50 font-bold text-gray-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
                >
                  <option>Comprar</option>
                  <option>Alugar</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* TIPO */}
            <div className="space-y-2 relative">
               <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Home size={14} /> Tipo
              </label>
              <button 
                onClick={() => setOpenTipo(!openTipo)}
                onBlur={() => setTimeout(() => setOpenTipo(false), 200)}
                className="w-full bg-slate-50 font-bold text-gray-800 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                {tipo} <ChevronDown size={16} className="text-gray-400" />
              </button>
              
              {openTipo && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl rounded-2xl mt-2 p-2 z-[60]">
                  {["Todos", "Casa", "Apartamento", "Terreno", "Comercial"].map((opt) => (
                    <div key={opt} onClick={() => { setTipo(opt); setOpenTipo(false); }} className="p-3 rounded-xl cursor-pointer text-sm font-bold hover:bg-green-50 text-gray-600 hover:text-green-700">
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CIDADE */}
            <div className="space-y-2 relative">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <MapPin size={14} /> Cidade
              </label>
              <button 
                onClick={() => setOpenCidade(!openCidade)}
                onBlur={() => setTimeout(() => setOpenCidade(false), 200)}
                className="w-full bg-slate-50 font-bold text-gray-800 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                {cidade} <ChevronDown size={16} className="text-gray-400" />
              </button>
               {openCidade && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl rounded-2xl mt-2 p-2 z-[60]">
                  {["Todos", "Porto União", "União da Vitória"].map((opt) => (
                    <div key={opt} onClick={() => { setCidade(opt); setOpenCidade(false); }} className="p-3 rounded-xl cursor-pointer text-sm font-bold hover:bg-green-50 text-gray-600 hover:text-green-700">
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BAIRRO (CORRIGIDO O CORTE) */}
            <div className="space-y-2 relative">
              <label className="flex items-center gap-2 text-xs font-bold text-green-600 uppercase tracking-wider">
                <MapPin size={14} /> Bairro
              </label>
              
              <button 
                onClick={() => setOpenBairro(!openBairro)}
                /* Delay para o clique funcionar */
                onBlur={() => setTimeout(() => setOpenBairro(false), 200)}
                className={`w-full font-bold text-gray-800 p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${openBairro ? 'bg-white border-green-500' : 'bg-slate-50 border-transparent'}`}
              >
                {bairro} 
                <ChevronDown size={16} className={`transition-transform ${openBairro ? 'rotate-180 text-green-500' : 'text-gray-400'}`} />
              </button>

              {/* MENU COM Z-INDEX ALTO E POSIÇÃO CORRETA */}
              {openBairro && (
                <div className="absolute top-[110%] left-0 w-full bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 z-[999]">
                  <div className="max-h-60 overflow-y-auto scrollbar-hide">
                    {bairros.map((b) => (
                      <div 
                        key={b}
                        onClick={() => { setBairro(b); setOpenBairro(false); }}
                        className={`p-3 rounded-xl cursor-pointer text-sm font-bold mb-1 flex justify-between items-center ${bairro === b ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {b}
                        {bairro === b && <Check size={16} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTÃO BUSCAR */}
          <div className="flex flex-col md:flex-row gap-4 items-center border-t border-gray-100 pt-6">
            <div className="flex-1 w-full md:w-auto flex items-center gap-4">
               <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Código:</span>
               <div className="relative w-full">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">#</span>
                  <input type="text" placeholder="Digite..." className="w-full border border-gray-200 rounded-xl py-3 pl-8 pr-4 font-bold text-gray-600 outline-none focus:border-green-500" />
               </div>
            </div>

            <Link 
              href={`/imoveis/${finalidade === 'Comprar' ? 'venda' : 'aluguel'}?tipo=${tipo}&cidade=${cidade}&bairro=${bairro}`}
              className="w-full md:w-auto bg-[#0f2e20] hover:bg-green-900 text-white font-bold py-4 px-12 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all"
            >
              <Search size={20} />
              BUSCAR
            </Link>
          </div>
        </div>
      </div>

      {/* === LISTAGEM DE DESTAQUES (Mantendo o que você já tinha) === */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-black text-gray-800 uppercase">Imóveis em Destaque</h2>
           <Link href="/imoveis/venda" className="text-green-700 font-bold text-sm uppercase flex items-center gap-1 hover:gap-2 transition-all">Ver Todos <ArrowRight size={16}/></Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {properties.map(property => (
             <div key={property.id} className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 group hover:shadow-2xl transition-all">
               <Link href={`/imovel/${property.id}`} className="relative block h-64 overflow-hidden">
                 <Image src={property.imagem} alt={property.titulo} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                 <div className="absolute top-4 left-4"><span className="bg-green-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{property.finalidade}</span></div>
                 <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl"><p className="text-sm font-black text-gray-900">{property.preco}</p></div>
               </Link>
               <div className="p-6">
                 <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{property.titulo}</h3>
                 <p className="text-xs text-gray-500 font-bold uppercase mb-4 flex items-center gap-1"><MapPin size={12}/> {property.bairro}, {property.cidade}</p>
                 <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-50">
                    <div className="text-center"><BedDouble size={16} className="mx-auto text-gray-400 mb-1"/><span className="text-xs font-bold text-gray-700">{property.quartos}</span></div>
                    <div className="text-center"><Bath size={16} className="mx-auto text-gray-400 mb-1"/><span className="text-xs font-bold text-gray-700">{property.banheiros}</span></div>
                    <div className="text-center"><Car size={16} className="mx-auto text-gray-400 mb-1"/><span className="text-xs font-bold text-gray-700">{property.vagas}</span></div>
                    <div className="text-center"><Maximize size={16} className="mx-auto text-gray-400 mb-1"/><span className="text-xs font-bold text-gray-700">{property.area}m²</span></div>
                 </div>
                 <Link href={`/imovel/${property.id}`} className="mt-4 w-full bg-slate-50 hover:bg-[#0f2e20] text-[#0f2e20] hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-xs uppercase">
                   Ver Detalhes <ArrowRight size={14}/>
                 </Link>
               </div>
             </div>
           ))}
        </div>
      </section>
    </main>
  );
}