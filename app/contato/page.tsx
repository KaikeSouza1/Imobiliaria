"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Instagram, Send, MessageCircle, Clock } from "lucide-react";

export default function ContatoPage() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* === HERO SECTION === */}
      <section className="relative h-[300px] w-full flex items-center justify-center">
        <div className="absolute inset-0">
          <Image 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920" 
            alt="Atendimento" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#0f2e20]/90 mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Fale Conosco
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto font-light">
            Estamos prontos para atender você. Escolha o canal de sua preferência.
          </p>
        </div>
      </section>

      {/* === CONTEÚDO PRINCIPAL === */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
          
          {/* === COLUNA ESQUERDA: INFORMAÇÕES DE CONTATO === */}
          <div className="bg-[#0f2e20] text-white p-10 lg:p-14 lg:w-2/5 flex flex-col justify-between relative overflow-hidden">
            {/* Efeito de Fundo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div>
              <h2 className="text-2xl font-bold mb-6">Informações de Contato</h2>
              <p className="text-green-100 mb-10 leading-relaxed">
                Tem alguma dúvida sobre um imóvel ou quer agendar uma visita? Nossa equipe está à disposição para ajudar você a realizar o melhor negócio.
              </p>

              <div className="space-y-8">
                {/* Endereço */}
                <div className="flex gap-4 items-start">
                  <MapPin className="text-green-400 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-lg">Nosso Escritório</h3>
                    <p className="text-green-100/80 text-sm mt-1">
                      R. Benjamin Constant, 369 - Centro<br/>
                      União da Vitória - PR, 84600-285
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4 items-start">
                  <Mail className="text-green-400 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-lg">Email</h3>
                    <p className="text-green-100/80 text-sm mt-1">contato@imobiliariaportoiguacu.com.br</p>
                  </div>
                </div>

                {/* Horário */}
                <div className="flex gap-4 items-start">
                  <Clock className="text-green-400 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="font-bold text-lg">Horário de Atendimento</h3>
                    <p className="text-green-100/80 text-sm mt-1">
                      Segunda a Sexta: 08:30 às 18:30h<br/>
                      Sábado: 09:00 às 12:00h
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Redes Sociais (Botões Grandes) */}
            <div className="mt-12 space-y-4">
              <p className="text-sm font-bold uppercase tracking-wider text-green-400 mb-4">Canais Diretos</p>
              
              <Link 
                href="https://api.whatsapp.com/send/?phone=5542998439975&text&type=phone_number&app_absent=0" 
                target="_blank"
                className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-400 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/30 w-full"
              >
                <MessageCircle size={20} />
                Chamar no WhatsApp
              </Link>

              <Link 
                href="https://www.instagram.com/imobportoiguacu/" 
                target="_blank"
                className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-xl font-bold transition-all border border-white/10 w-full"
              >
                <Instagram size={20} />
                Siga no Instagram
              </Link>
            </div>
          </div>

          {/* === COLUNA DIREITA: FORMULÁRIO === */}
          <div className="p-10 lg:p-14 lg:w-3/5 bg-white">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Envie uma mensagem</h2>
            <p className="text-gray-500 text-sm mb-8">Preencha o formulário abaixo e entraremos em contato o mais breve possível.</p>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Nome Completo</label>
                  <input type="text" className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="Seu nome" />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Telefone</label>
                  <input type="text" className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="(00) 00000-0000" />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Email</label>
                <input type="email" className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="seu@email.com" />
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Assunto</label>
                <select className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:bg-white transition-all cursor-pointer text-gray-600">
                  <option>Tenho interesse em um imóvel</option>
                  <option>Quero colocar meu imóvel para alugar/vender</option>
                  <option>Dúvidas financeiras/contratuais</option>
                  <option>Outros assuntos</option>
                </select>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Mensagem</label>
                <textarea rows={4} className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:bg-white transition-all resize-none" placeholder="Escreva sua mensagem aqui..."></textarea>
              </div>

              <button className="w-full bg-[#0f2e20] hover:bg-green-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2">
                Enviar Mensagem <Send size={18} />
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* === SEÇÃO DO MAPA (Full Width) === */}
      <section className="mt-20">
        <div className="text-center mb-8 px-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <MapPin className="text-green-600" /> Onde nos encontrar
          </h2>
          <p className="text-gray-500 mt-2">Venha tomar um café conosco em nosso escritório.</p>
        </div>
        
        <div className="w-full h-[450px] bg-gray-200 grayscale hover:grayscale-0 transition-all duration-700">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2128.0664594080977!2d-51.09044290282608!3d-26.23026456078563!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94e661aa428738af%3A0xbdf19ded7ab1f209!2sIMOBILIARIA%20PORTO%20IGUA%C3%87U!5e0!3m2!1spt-BR!2sbr!4v1771248868686!5m2!1spt-BR!2sbr" 
            width="100%" 
            height="100%" 
            style={{border:0}} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>

    </main>
  );
}