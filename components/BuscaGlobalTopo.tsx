"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

// Caixa de busca global, exibida no topo do painel (quando o módulo de contratos estiver liberado).
export default function BuscaGlobalTopo() {
  const router = useRouter();
  const [termo, setTermo] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const t = termo.trim();
        router.push(t ? `/admin/busca?q=${encodeURIComponent(t)}` : "/admin/busca");
      }}
      className="relative w-full max-w-xl"
    >
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        aria-label="Busca global de contratos"
        placeholder="Buscar contrato, inquilino, proprietário, endereço..."
        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium shadow-sm outline-none focus:border-green-500 transition-all"
      />
    </form>
  );
}
