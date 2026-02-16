import Image from "next/image";
import { CheckCircle2, Award, Users, TrendingUp } from "lucide-react";

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      
      {/* === HERO SECTION (Topo) === */}
      <section className="relative h-[400px] w-full flex items-center justify-center">
        {/* Imagem de Fundo (Escritório ou Cidade) */}
        <div className="absolute inset-0">
          <Image 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920" 
            alt="Escritório Porto Iguaçu" 
            fill 
            className="object-cover"
          />
          {/* Película Verde Escura */}
          <div className="absolute inset-0 bg-[#0f2e20]/90 mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
            Quem Somos
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto font-light">
            Conheça a história e os valores que movem a Imobiliária Porto Iguaçu.
          </p>
        </div>
      </section>

      {/* === CONTEÚDO PRINCIPAL === */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Lado Esquerdo: Imagem Institucional */}
          <div className="flex-1 relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl group">
            <Image 
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800" 
              alt="Consultoria Imobiliária" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Box Flutuante */}
            <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur p-6 rounded-xl shadow-lg max-w-xs border-l-4 border-green-600">
              <p className="text-gray-800 font-bold text-lg">"Juntos prosperamos mais."</p>
              <p className="text-green-600 text-sm mt-1">Filosofia Porto Iguaçu</p>
            </div>
          </div>

          {/* Lado Direito: O Texto Refinado */}
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Tradição e excelência nas <span className="text-green-600">Gêmeas do Iguaçu</span>
            </h2>
            
            <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
              <p>
                A <strong className="text-gray-900">Imobiliária Porto Iguaçu</strong> é referência absoluta no mercado imobiliário regional. Com um histórico íntegro e repleto de ótimas oportunidades, construímos nossa reputação baseada em solidez e confiança.
              </p>
              <p>
                Mais do que intermediar negócios, oferecemos uma <span className="text-green-700 font-medium">consultoria completa</span>. Nossa vasta experiência permite entregar a cada cliente um atendimento verdadeiramente personalizado, onde cada detalhe é pensado para garantir a sua satisfação.
              </p>
              <p>
                Atuamos com dinamismo e profissionalismo ímpares, transformando a complexidade do mercado em processos simples, seguros e transparentes. É essa dedicação que nos torna uma empresa diferenciada e especial.
              </p>
            </div>

            <div className="pt-4">
              <button className="bg-[#0f2e20] text-white px-8 py-4 rounded-full font-bold hover:bg-green-800 transition-all shadow-lg hover:shadow-green-900/20 transform hover:-translate-y-1">
                Fale com um especialista
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* === DESTAQUES DE VALORES (Grid) === */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-700 mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Award size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Histórico Íntegro</h3>
              <p className="text-gray-500 text-sm">
                Anos de atuação pautados pela ética e respeito em cada negociação realizada.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-700 mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Segurança Total</h3>
              <p className="text-gray-500 text-sm">
                Transparência e honestidade são os pilares que sustentam todos os nossos contratos.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-700 mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Atendimento VIP</h3>
              <p className="text-gray-500 text-sm">
                Consultoria personalizada para entender e atender exatamente o que você busca.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-700 mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ótimos Negócios</h3>
              <p className="text-gray-500 text-sm">
                As melhores oportunidades de investimento da região passam por aqui.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* === FAIXA FINAL === */}
      <section className="bg-[#0f2e20] py-16 text-center text-white px-4">
        <h2 className="text-3xl font-bold mb-4">Venha nos conhecer e usufruir de nossos serviços!</h2>
        <p className="text-green-200 text-lg mb-8">Estamos prontos para realizar o seu sonho.</p>
        <div className="inline-block border-b-2 border-green-500 pb-1 text-2xl font-light italic">
          "Juntos prosperamos mais"
        </div>
      </section>

    </main>
  );
}