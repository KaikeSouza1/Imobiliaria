export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Visão Geral</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card Estatística 1 */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h3 className="text-blue-800 font-bold text-sm uppercase">Total de Imóveis</h3>
          <p className="text-4xl font-extrabold text-blue-900 mt-2">12</p>
        </div>
        
        {/* Card Estatística 2 */}
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <h3 className="text-green-800 font-bold text-sm uppercase">Imóveis Ativos</h3>
          <p className="text-4xl font-extrabold text-green-900 mt-2">10</p>
        </div>

        {/* Card Estatística 3 */}
        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
          <h3 className="text-orange-800 font-bold text-sm uppercase">Contatos Pendentes</h3>
          <p className="text-4xl font-extrabold text-orange-900 mt-2">5</p>
        </div>
      </div>

      <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
        <p className="text-gray-500">Bem-vindo ao seu painel. Use o menu lateral para gerenciar os imóveis.</p>
      </div>
    </div>
  );
}