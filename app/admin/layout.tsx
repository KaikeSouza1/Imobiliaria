import Link from "next/link";
import { Home, PlusCircle, LogOut, Sparkles, MessageSquare } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

async function getNotificacoes() {
  try {
    const [resC, resA] = await Promise.all([
      query("SELECT COUNT(*) FROM contatos WHERE status = 'novo'"),
      query("SELECT COUNT(*) FROM anuncios WHERE status = 'novo'"),
    ]);
    return Number(resC.rows[0].count) + Number(resA.rows[0].count);
  } catch {
    return 0;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const totalNovos = await getNotificacoes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-green-50 font-sans flex">

      {/* SIDEBAR */}
      <aside className="w-72 bg-gradient-to-b from-[#0a1f16] to-[#0f2e20] text-white flex flex-col fixed h-full z-10 shadow-2xl">

        {/* LOGO */}
        <div className="p-8 border-b border-green-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Porto Iguaçu</h2>
              <p className="text-[10px] text-green-300 font-bold uppercase tracking-widest">Painel Admin</p>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 p-6 space-y-2">
          <Link
            href="/admin/imoveis"
            className="flex items-center gap-3 p-4 rounded-xl bg-green-700/30 hover:bg-green-700/50 transition-all text-white font-bold group"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
            <span>Meus Imóveis</span>
          </Link>

          <Link
            href="/admin/imoveis/novo"
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-all text-green-100 font-bold group"
          >
            <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
            <span>Cadastrar Novo</span>
          </Link>

          {/* LINK MENSAGENS COM BADGE */}
          <Link
            href="/admin/mensagens"
            className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-all text-green-100 font-bold group relative"
          >
            <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
            <span>Mensagens</span>
            {totalNovos > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                {totalNovos}
              </span>
            )}
          </Link>
        </nav>

        {/* FOOTER */}
        <div className="p-6 border-t border-green-800/50">
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 p-4 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-300 hover:text-red-200 transition-all font-bold"
          >
            <LogOut size={20} />
            <span>Sair do Sistema</span>
          </Link>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 ml-72 p-10">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}