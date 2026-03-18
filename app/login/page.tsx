"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("/admin");
  const router = useRouter();

  useEffect(() => {
    // Pega a URL de onde o usuário tentou acessar (seja /crm ou /admin)
    const searchParams = new URLSearchParams(window.location.search);
    const url = searchParams.get("callbackUrl");
    if (url) setCallbackUrl(url);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const res = await signIn("credentials", {
      username: user,
      password: pass,
      redirect: false,
    });

    if (res?.error) {
      setError("Usuário ou senha incorretos!");
    } else {
      router.push(callbackUrl); // Leva o corretor para o CRM ou o Admin para o Admin
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a1f16] relative overflow-hidden p-4">
      {/* Elementos visuais de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[120px]"></div>

      <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/20 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Acesso Restrito</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Imobiliária Porto Iguaçu</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-xs font-semibold mb-6 flex gap-3 leading-relaxed">
          <span className="text-lg">💡</span>
          <p><strong>Corretores:</strong> No seu 1º acesso, a senha que você digitar será salva automaticamente como a sua senha definitiva.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Usuário</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
              <input 
                type="text" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full pl-12 p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white text-slate-700 font-semibold outline-none transition-all"
                placeholder="Ex: anna"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
              <input 
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full pl-12 p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white text-slate-700 font-semibold outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center font-bold animate-pulse">{error}</p>}

          <button className="w-full bg-[#0f2e20] hover:bg-emerald-900 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] uppercase tracking-widest text-xs mt-2">
            Entrar no Sistema
          </button>
        </form>
      </div>
    </div>
  );
}