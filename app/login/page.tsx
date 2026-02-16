"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      username: user,
      password: pass,
      redirect: false,
    });

    if (res?.error) {
      setError("Usuário ou senha incorretos!");
    } else {
      router.push("/admin"); // Redireciona para o painel
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f2e20]">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Área Restrita</h1>
          <p className="text-gray-500 text-sm">Painel Administrativo Porto Iguaçu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Usuário</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:border-green-600 outline-none"
                placeholder="Seu usuário"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:border-green-600 outline-none"
                placeholder="Sua senha"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all">
            ENTRAR NO PAINEL
          </button>
        </form>
      </div>
    </div>
  );
}