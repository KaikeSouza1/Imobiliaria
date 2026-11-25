"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, X, Users, UserCheck, Home, Loader2, ChevronLeft, ChevronRight, SlidersHorizontal, Eye, Edit } from "lucide-react";

interface ClienteLista {
  id: number;
  codigo: string | null;
  nome: string;
  documento: string;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
  uf: string | null;
  eh_inquilino: boolean;
  eh_proprietario: boolean;
  total_contratos: number;
  total_imoveis: number;
}

interface Resposta {
  itens: ClienteLista[];
  total: number;
  pagina: number;
  paginas: number;
  resumo?: { total: number; inquilinos: number; proprietarios: number };
}

function chip(ativo: boolean) {
  return `px-4 py-2 rounded-xl text-xs font-bold transition-all border ${ativo
    ? "bg-[#0f2e20] text-white border-[#0f2e20] shadow-sm"
    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`;
}

export default function ClientesPage() {
  const [busca, setBusca] = useState("");
  const [papel, setPapel] = useState("");
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState<Resposta | null>(null);
  const [resumo, setResumo] = useState<Resposta["resumo"]>();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    const t = setTimeout(async () => {
      setCarregando(true);
      try {
        const p = new URLSearchParams({ pagina: String(pagina) });
        if (busca.trim()) p.set("q", busca.trim());
        if (papel) p.set("papel", papel);
        if (!resumo) p.set("resumo", "1");
        const r = await fetch(`/api/admin/clientes?${p}`);
        const d = await r.json();
        if (!ativo) return;
        if (r.ok) {
          setDados(d);
          if (d.resumo) setResumo(d.resumo);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }, 300);
    return () => { ativo = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, papel, pagina]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-1 h-8 bg-green-600 rounded-full"></div>
            Clientes
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-7">Inquilinos e proprietários: dados pessoais, documentos e endereços</p>
        </div>
        <Link href="/admin/clientes/novo"
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95">
          <Plus size={20} strokeWidth={3} /> Novo Cliente
        </Link>
      </div>

      {resumo && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200">
            <Users className="text-blue-700 mb-2" size={24} />
            <p className="text-3xl font-black text-blue-900">{resumo.total}</p>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Clientes</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl border border-green-200">
            <UserCheck className="text-green-700 mb-2" size={24} />
            <p className="text-3xl font-black text-green-900">{resumo.inquilinos}</p>
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Inquilinos</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-2xl border border-orange-200">
            <Home className="text-orange-700 mb-2" size={24} />
            <p className="text-3xl font-black text-orange-900">{resumo.proprietarios}</p>
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Proprietários</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700 font-black text-sm uppercase tracking-wider">
            <SlidersHorizontal size={16} className="text-green-600" /> Busca e Filtros
            {dados && <span className="bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{dados.total} resultado{dados.total !== 1 ? "s" : ""}</span>}
          </div>
          {(busca || papel) && (
            <button onClick={() => { setBusca(""); setPapel(""); setPagina(1); }}
              className="flex items-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
              <X size={14} /> Limpar tudo
            </button>
          )}
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
              className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all"
              placeholder="Nome, código, CPF/CNPJ ou cidade..." />
          </div>
          <div className="flex gap-2">
            {[["", "Todos"], ["inquilino", "Inquilinos"], ["proprietario", "Proprietários"]].map(([v, r]) => (
              <button key={v} onClick={() => { setPapel(v); setPagina(1); }} className={chip(papel === v)}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      {!dados && carregando ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-green-700" size={40} />
          <p className="text-gray-500 font-bold">Carregando clientes...</p>
        </div>
      ) : dados && dados.itens.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-600">{busca || papel ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</h3>
          <p className="text-gray-400 mt-2 text-sm">{busca || papel ? "Tente outros critérios." : 'Clique em "Novo Cliente" ou cadastre direto no contrato.'}</p>
        </div>
      ) : dados && (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-opacity ${carregando ? "opacity-60" : ""}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/60">
                  <th className="py-3 px-5">Cliente</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Cidade</th>
                  <th className="py-3 px-4">Vínculos</th>
                  <th className="py-3 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {dados.itens.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-green-50/30 transition-colors">
                    <td className="py-4 px-5">
                      <Link href={`/admin/clientes/${c.id}`} className="font-black text-gray-900 hover:text-green-700">{c.nome}</Link>
                      <p className="text-xs text-gray-500">{[c.codigo, c.documento].filter(Boolean).join(" · ")}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {c.eh_inquilino && <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-100 text-green-800">Inquilino</span>}
                        {c.eh_proprietario && <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-100 text-orange-800">Proprietário</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-xs">{c.telefone || c.email || "—"}</td>
                    <td className="py-4 px-4 text-gray-600 text-xs">{[c.cidade, c.uf].filter(Boolean).join("/") || "—"}</td>
                    <td className="py-4 px-4 text-gray-600 text-xs whitespace-nowrap">
                      {c.total_contratos} contrato{c.total_contratos !== 1 ? "s" : ""}
                      {c.total_imoveis > 0 && ` · ${c.total_imoveis} imóve${c.total_imoveis !== 1 ? "is" : "l"}`}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/clientes/${c.id}`} title="Abrir" className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"><Eye size={14} /></Link>
                        <Link href={`/admin/clientes/${c.id}/editar`} title="Editar" className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"><Edit size={14} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dados.paginas > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm">
              <span className="text-gray-500 font-medium">Página {dados.pagina} de {dados.paginas}</span>
              <div className="flex gap-2">
                <button disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronLeft size={16} /></button>
                <button disabled={pagina >= dados.paginas} onClick={() => setPagina((p) => p + 1)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
