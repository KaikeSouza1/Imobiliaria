import Link from "next/link";
import { LayoutDashboard, Home, PlusCircle, LogOut, Settings } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Proteção básica no lado do servidor
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0f2e20] text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-green-800">
          <h2 className="text-xl font-bold">Admin Porto</h2>
          <p className="text-xs text-green-300">Gerenciamento</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-800 transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin/imoveis" className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-800 transition-colors">
            <Home size={20} /> Meus Imóveis
          </Link>
          <Link href="/admin/imoveis/novo" className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-800 transition-colors">
            <PlusCircle size={20} /> Cadastrar Imóvel
          </Link>
        </nav>

        <div className="p-4 border-t border-green-800">
           {/* Botão de Sair (precisa ser Client Component ou link api/auth/signout) */}
           <Link href="/api/auth/signout" className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-600/20 text-red-200 hover:text-red-100 transition-colors">
            <LogOut size={20} /> Sair do Sistema
          </Link>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 ml-64 p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[500px] p-8">
          {children}
        </div>
      </main>

    </div>
  );
}