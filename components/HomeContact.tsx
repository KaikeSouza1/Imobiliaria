import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default function HomeContact() {
  return (
    <div className="w-full font-sans">
      
      {/* === PARTE 1: FUNDO VERDE PREMIUM COM FORMULÁRIO === */}
      <div className="relative bg-[#0f2e20] text-white py-20 px-4 overflow-hidden">
        
        {/* Textura sutil de fundo */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0JyBoZWlnaHQ9JzQnIHZpZXdCb3g9JzAgMCA0IDQnPjxwYXRoIGZpbGw9JyNmZmZmZmYnIGZpbGwtb3BhY2l0eT0nMC4wNScgZD0nTTEgM2gxdjFIMVptMiAwaDF2MUgzWicvPjwvc3ZnPg==')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-900/30 rounded-full blur-[120px] pointer-events-none -z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Lado Esquerdo: Textos Institucionais */}
          <div className="flex-1 space-y-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-light mb-6 leading-tight">
                Por que a Imobiliária<br/>
                <span className="font-extrabold text-green-400">Porto Iguaçu é a escolha perfeita?</span>
              </h2>
              <div className="w-24 h-1.5 bg-green-500 rounded-full"></div>
            </div>

            <div className="space-y-10">
              <div className="flex gap-4 items-start group">
                <span className="text-green-500 font-bold text-xl opacity-50 group-hover:opacity-100 transition-opacity">01.</span>
                <div>
                  <h4 className="text-xl font-bold mb-3 group-hover:text-green-400 transition-colors">Atendimento Personalizado</h4>
                  <p className="text-green-100/80 text-sm leading-relaxed max-w-md font-medium">
                    Entendemos que cada cliente é único e oferecemos soluções sob medida para atender às suas necessidades específicas.
                  </p>
                </div>
              </div>
              
              <div className="w-full h-px bg-green-800/50"></div>

              <div className="flex gap-4 items-start group">
                <span className="text-green-500 font-bold text-xl opacity-50 group-hover:opacity-100 transition-opacity">02.</span>
                <div>
                  <h4 className="text-xl font-bold mb-3 group-hover:text-green-400 transition-colors">Conhecimento Local Profundo</h4>
                  <p className="text-green-100/80 text-sm leading-relaxed max-w-md font-medium">
                    Nossa equipe é composta por moradores locais que conhecem cada bairro como a palma de suas mãos.
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-green-800/50"></div>

              <div className="flex gap-4 items-start group">
                <span className="text-green-500 font-bold text-xl opacity-50 group-hover:opacity-100 transition-opacity">03.</span>
                <div>
                  <h4 className="text-xl font-bold mb-3 group-hover:text-green-400 transition-colors">Compromisso Com A Excelência</h4>
                  <p className="text-green-100/80 text-sm leading-relaxed max-w-md font-medium">
                    Nosso objetivo é superar as expectativas em cada interação, garantindo uma experiência imobiliária sem igual.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito: Formulário Flutuante */}
          <div className="flex-1 w-full max-w-lg bg-white rounded-2xl p-8 lg:p-10 text-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-20 lg:-mt-10 border border-gray-100">
            <h3 className="text-2xl font-extrabold mb-8 text-gray-900 flex items-center gap-2">
              Solicite um contato
              <span className="h-1.5 w-12 bg-green-500 rounded-full block ml-2"></span>
            </h3>
            
            <form className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Tipo de consulta</label>
                <select className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:border-green-500 focus:bg-white transition-all appearance-none cursor-pointer">
                  <option>Quero Comprar um Imóvel</option>
                  <option>Quero Alugar um Imóvel</option>
                  <option>Quero Anunciar meu Imóvel</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Seu Nome</label>
                  <input type="text" placeholder="Nome completo" className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:border-green-500 focus:bg-white transition-all placeholder:text-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Email/Telefone</label>
                  <input type="text" placeholder="Contato principal" className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:border-green-500 focus:bg-white transition-all placeholder:text-gray-300" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Mensagem (Opcional)</label>
                 <textarea placeholder="Olá, gostaria de mais informações sobre..." rows={3} className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 text-sm font-bold outline-none focus:border-green-500 focus:bg-white transition-all placeholder:text-gray-300 resize-none"></textarea>
              </div>

              <div className="flex items-start gap-3 pt-2 group cursor-pointer">
                <div className="mt-0.5">
                   <input type="checkbox" id="terms" className="accent-green-600 w-4 h-4 cursor-pointer" />
                </div>
                <label htmlFor="terms" className="text-xs text-gray-500 font-medium cursor-pointer group-hover:text-green-600 transition-colors">
                  Concordo em compartilhar meus dados para contato comercial da imobiliária.
                </label>
              </div>

              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all transform active:scale-95 uppercase text-sm tracking-wider mt-6 shadow-lg hover:shadow-green-600/30 flex items-center justify-center gap-2">
                Enviar solicitação <Mail size={18}/>
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* === PARTE 2: ENDEREÇO E MAPA === */}
      <div className="bg-white py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full text-green-700">
              <MapPin size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">Nosso Endereço</h4>
              <p className="text-gray-500 font-medium mt-1 max-w-md leading-relaxed">
                R. Benjamin Constant, 369 - Centro<br/>
                União da Vitória - PR, 84600-285
              </p>
            </div>
          </div>
          <div className="flex gap-4">
             <Link href="tel:+5542999755493" className="flex items-center gap-2 bg-green-50 text-green-700 px-5 py-3 rounded-full font-bold hover:bg-green-100 transition-colors">
               <Phone size={18}/> (42) 99975-5493
             </Link>
          </div>
        </div>
        
        {/* MAPA GOOGLE */}
        <div className="w-full h-[450px] bg-gray-100 relative grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out border-y border-gray-200">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2128.0664594080977!2d-51.09044290282608!3d-26.23026456078563!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94e661aa428738af%3A0xbdf19ded7ab1f209!2sIMOBILIARIA%20PORTO%20IGUA%C3%87U!5e0!3m2!1spt-BR!2sbr!4v1771248868686!5m2!1spt-BR!2sbr" 
            width="100%" 
            height="450" 
            style={{border:0}} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
          ></iframe>
        </div>
      </div>
    </div>
  );
}