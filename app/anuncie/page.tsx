"use client";

import Image from "next/image";
import { UploadCloud, User, MapPin, Home, DollarSign, CheckCircle2, ArrowRight, Camera } from "lucide-react";

export default function AnunciePage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* === HERO SECTION (Topo com Foto de Chaves/Negócio) === */}
      <section className="relative h-[350px] w-full flex items-center justify-center">
        <div className="absolute inset-0">
          <Image 
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1920" 
            alt="Anuncie seu imóvel" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#0f2e20]/90 mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Valorize seu patrimônio
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto font-light">
            Anuncie com quem é referência em Porto União e União da Vitória.
          </p>
        </div>
      </section>

      {/* === CONTEÚDO (Dividido em 2 colunas) === */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* === COLUNA ESQUERDA: BENEFÍCIOS (Venda o seu peixe) === */}
          <div className="flex-1 space-y-6 pt-10 lg:pt-20">
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Por que anunciar conosco?</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-green-100 p-3 rounded-xl h-fit text-green-700">
                    <Camera size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Fotos Profissionais</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Nós produzimos o material visual do seu imóvel para que ele se destaque nos portais e redes sociais.
                    </p>
                  </div>
                </div>

                <div className="w-full h-px bg-gray-100"></div>

                <div className="flex gap-4">
                  <div className="bg-green-100 p-3 rounded-xl h-fit text-green-700">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Segurança Jurídica</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Análise rigorosa de crédito e contratos elaborados por especialistas para garantir seu recebimento.
                    </p>
                  </div>
                </div>

                <div className="w-full h-px bg-gray-100"></div>

                <div className="flex gap-4">
                  <div className="bg-green-100 p-3 rounded-xl h-fit text-green-700">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Avaliação Justa</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Avaliamos seu imóvel com base no mercado real para vender ou alugar no menor tempo possível.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Box de Ajuda */}
            <div className="bg-[#0f2e20] text-white p-8 rounded-2xl shadow-lg relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-green-400/30"></div>
              <h3 className="text-xl font-bold mb-2">Prefere falar pelo WhatsApp?</h3>
              <p className="text-green-100 text-sm mb-4">Envie as fotos e informações direto para nosso time comercial.</p>
              <div className="flex items-center gap-2 font-bold text-green-300 group-hover:text-white transition-colors">
                Chamar no Zap <ArrowRight size={18} />
              </div>
            </div>

          </div>

          {/* === COLUNA DIREITA: O FORMULÁRIO (A Estrela) === */}
          <div className="flex-[1.5]">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100">
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Cadastrar Imóvel
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Preencha os dados abaixo e entraremos em contato para agendar as fotos.</p>
              </div>

              <form className="space-y-8">
                
                {/* ETAPA 1: DADOS PESSOAIS */}
                <div>
                  <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User size={14} /> Seus Dados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 group-focus-within:text-green-600">Nome Completo</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="Seu nome" />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 group-focus-within:text-green-600">Telefone / WhatsApp</label>
                      <input type="text" className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="(00) 00000-0000" />
                    </div>
                    <div className="group md:col-span-2">
                      <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 group-focus-within:text-green-600">Email (Opcional)</label>
                      <input type="email" className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="seu@email.com" />
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-gray-100"></div>

                {/* ETAPA 2: DADOS DO IMÓVEL */}
                <div>
                  <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Home size={14} /> Sobre o Imóvel
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">Finalidade</label>
                      <select className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-green-500 focus:bg-white transition-all cursor-pointer">
                        <option>Quero Vender</option>
                        <option>Quero Alugar</option>
                      </select>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">Tipo</label>
                      <select className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-green-500 focus:bg-white transition-all cursor-pointer">
                        <option>Casa</option>
                        <option>Apartamento</option>
                        <option>Terreno</option>
                        <option>Comercial</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 group-focus-within:text-green-600">Endereço do Imóvel</label>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" className="w-full pl-10 p-3 bg-slate-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="Rua, Número, Bairro..." />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 group-focus-within:text-green-600">Valor Pretendido (R$)</label>
                        <input type="text" className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="0,00" />
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 group-focus-within:text-green-600">Área Aprox. (m²)</label>
                        <input type="text" className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="000" />
                      </div>
                    </div>

                     <div className="group">
                      <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 group-focus-within:text-green-600">Descrição / Detalhes</label>
                      <textarea rows={3} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-green-500 focus:bg-white transition-all resize-none" placeholder="Ex: Possui móveis planejados, churrasqueira, aceita permuta..."></textarea>
                    </div>
                  </div>
                </div>

                {/* BOTÃO DE ENVIO */}
                <button type="button" className="w-full bg-[#0f2e20] hover:bg-green-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-green-900/20 transition-all transform active:scale-95 flex items-center justify-center gap-3 text-lg">
                  Enviar Imóvel para Avaliação <ArrowRight size={20} />
                </button>

                <p className="text-center text-xs text-gray-400 mt-4">
                  Seus dados estão seguros. Ao enviar, você concorda com nossa política de privacidade.
                </p>

              </form>
            </div>
          </div>

        </div>
      </div>

    </main>
  );
}