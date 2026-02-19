import { TrendingUp, Percent, ArrowRight, BarChart3, Clock } from "lucide-react";

// Função para buscar dados da API do Banco Central do Brasil
async function fetchIndice(codigoSerie: number) {
  try {
    // Busca o último valor disponível na série temporal do BCB
    // revalidate: 86400 faz o Next.js guardar em cache por 24 horas (não sobrecarrega a API)
    const res = await fetch(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigoSerie}/dados/ultimos/1`,
      { next: { revalidate: 86400 } }
    );
    const data = await res.json();
    return data[0]; // Retorna no formato: { data: "DD/MM/YYYY", valor: "X.XX" }
  } catch (error) {
    console.error(`Erro ao buscar índice ${codigoSerie}:`, error);
    return { data: "Indisponível", valor: "0.00" };
  }
}

export const metadata = {
  title: "Índices Econômicos | Imobiliária Porto Iguaçu",
  description: "Acompanhe os principais índices econômicos e indicadores do mercado imobiliário: IGPM, INCC, IPCA, Selic, entre outros.",
};

export default async function IndicesPage() {
  // Fazemos todas as requisições ao mesmo tempo para ser mais rápido
  // Códigos oficiais do SGS Banco Central:
  const [ipca, igpm, incc, selic, tr, poupanca] = await Promise.all([
    fetchIndice(433),  // IPCA - Variação mensal
    fetchIndice(189),  // IGP-M - Variação mensal
    fetchIndice(192),  // INCC-M - Variação mensal
    fetchIndice(432),  // Taxa Selic - Meta (a.a.)
    fetchIndice(226),  // TR - Taxa Referencial (mensal)
    fetchIndice(195),  // Rendimento Poupança (mensal)
  ]);

  const indices = [
    {
      nome: "IPCA",
      descricao: "Índice Nacional de Preços ao Consumidor Amplo. É a inflação oficial do país.",
      valor: ipca.valor,
      data: ipca.data,
      tipo: "% ao mês",
      icone: <BarChart3 className="text-blue-500" size={32} />
    },
    {
      nome: "IGP-M",
      descricao: "Índice Geral de Preços - Mercado. Muito utilizado para reajuste de contratos de aluguel.",
      valor: igpm.valor,
      data: igpm.data,
      tipo: "% ao mês",
      icone: <TrendingUp className="text-orange-500" size={32} />
    },
    {
      nome: "INCC-M",
      descricao: "Índice Nacional de Custo da Construção. Reajusta parcelas de imóveis comprados na planta.",
      valor: incc.valor,
      data: incc.data,
      tipo: "% ao mês",
      icone: <BarChart3 className="text-yellow-600" size={32} />
    },
    {
      nome: "Taxa Selic",
      descricao: "Taxa básica de juros da economia brasileira, definida pelo COPOM.",
      valor: selic.valor,
      data: selic.data,
      tipo: "% ao ano",
      icone: <Percent className="text-purple-500" size={32} />
    },
    {
      nome: "TR",
      descricao: "Taxa Referencial. Utilizada para correção de financiamentos imobiliários (SFH).",
      valor: tr.valor,
      data: tr.data,
      tipo: "% ao mês",
      icone: <Percent className="text-teal-500" size={32} />
    },
    {
      nome: "Poupança",
      descricao: "Rendimento base da caderneta de poupança no último período.",
      valor: poupanca.valor,
      data: poupanca.data,
      tipo: "% ao mês",
      icone: <ArrowRight className="text-green-500" size={32} />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabeçalho da Página */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-[#0f2e20] mb-4">
            Índices Econômicos
          </h1>
          <p className="text-gray-600 text-lg">
            Acompanhe os principais indicadores do mercado financeiro e imobiliário atualizados diretamente da base do Banco Central do Brasil.
          </p>
        </div>

        {/* Grid de Índices */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {indices.map((indice, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {indice.icone}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                  <Clock size={12} />
                  Ref: {indice.data}
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">{indice.nome}</h2>
              <p className="text-gray-500 text-sm mb-6 flex-grow">
                {indice.descricao}
              </p>

              <div className="mt-auto pt-4 border-t border-gray-100 flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#0f2e20]">
                  {indice.valor}
                </span>
                <span className="text-gray-500 font-semibold">
                  {indice.tipo}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-gray-400">
          <p>* Dados consultados em tempo real através da API de Dados Abertos do Banco Central do Brasil.</p>
          <p>Os valores referem-se às últimas divulgações oficiais de cada índice.</p>
        </div>

      </div>
    </div>
  );
}