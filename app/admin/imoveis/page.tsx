"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, Plus, Power, Loader2 } from "lucide-react";

export default function AdminImoveisPage() {
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImoveis = async () => {
    try {
      const res = await fetch("/api/imoveis");
      const data = await res.json();
      setImoveis(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImoveis(); }, []);

  // ALTERAR STATUS (ATIVO/INATIVO)
  const toggleStatus = async (imovel: any) => {
    try {
      const res = await fetch(`/api/imoveis/${imovel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...imovel, ativo: !imovel.ativo })
      });
      if (res.ok) fetchImoveis();
    } catch (error) {
      alert("Erro ao mudar status");
    }
  };

  // DELETAR
  const handleExcluir = async (id: number) => {
    if (!confirm("Isso excluirá o imóvel e todas as suas fotos permanentemente. Confirmar?")) return;
    
    try {
      const res = await fetch(`/api/imoveis/${id}`, { method: "DELETE" });
      if (res.ok) {
        setImoveis(prev => prev.filter(im => im.id !== id));
      }
    } catch (error) {
      alert("Erro ao excluir");
    }
  };

  if (loading) return <div className="text-center py-20"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Meus Imóveis</h1>
        <Link href="/admin/imoveis/novo" className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all"><Plus size={20} /> Novo</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 font-bold text-gray-500 uppercase text-[10px] tracking-widest">
            <tr>
              <th className="p-4">Img</th>
              <th className="p-4">Título</th>
              <th className="p-4">Valor</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {imoveis.map((im) => (
              <tr key={im.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="w-12 h-12 relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <Image src={im.imagem_url} fill className="object-cover" alt="" />
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-bold text-gray-800">{im.titulo}</span>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">{im.tipo} • {im.finalidade}</div>
                </td>
                <td className="p-4 font-bold text-green-700">R$ {Number(im.preco).toLocaleString('pt-BR')}</td>
                <td className="p-4 text-center">
                  <button onClick={() => toggleStatus(im)} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${im.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <Power size={10} className="inline mr-1" /> {im.ativo ? "ATIVO" : "INATIVO"}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/imoveis/editar/${im.id}`} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Edit size={18} /></Link>
                    <button onClick={() => handleExcluir(im.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}