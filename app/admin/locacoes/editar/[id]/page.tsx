"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface ImovelOpcao {
  id: number;
  titulo: string;
  codigo: string;
  cidade: string;
  bairro: string;
}

export default function EditarLocacaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [imoveis, setImoveis] = useState<ImovelOpcao[]>([]);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [formData, setFormData] = useState({
    imovel_id: "",
    locatario_nome: "",
    locatario_cpf: "",
    locatario_email: "",
    locatario_telefone: "",
    valor_aluguel: "",
    dia_vencimento: "10",
    data_inicio: "",
    data_fim: "",
    status: "ativo",
    observacoes: "",
  });

  useEffect(() => {
    fetch("/api/imoveis").then((res) => res.json()).then((data) => setImoveis(Array.isArray(data) ? data : []));

    fetch(`/api/admin/locacoes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          imovel_id: String(data.imovel_id || ""),
          locatario_nome: data.locatario_nome || "",
          locatario_cpf: data.locatario_cpf || "",
          locatario_email: data.locatario_email || "",
          locatario_telefone: data.locatario_telefone || "",
          valor_aluguel: String(data.valor_aluguel || ""),
          dia_vencimento: String(data.dia_vencimento || "10"),
          data_inicio: data.data_inicio ? String(data.data_inicio).slice(0, 10) : "",
          data_fim: data.data_fim ? String(data.data_fim).slice(0, 10) : "",
          status: data.status || "ativo",
          observacoes: data.observacoes || "",
        });
      })
      .finally(() => setCarregando(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/locacoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push(`/admin/locacoes/${id}`);
      } else {
        const err = await res.json();
        alert("Erro ao salvar: " + (err.error || "Tente novamente"));
      }
    } catch {
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (carregando) return (
    <div className="text-center py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-green-700" size={40} />
      <p className="text-gray-500 font-bold">Carregando contrato...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto pb-20 px-4">
      <div className="flex items-center gap-4 mb-8 pt-10">
        <Link href={`/admin/locacoes/${id}`} className="p-3 bg-white hover:bg-gray-100 rounded-2xl shadow-sm text-gray-500 transition-all border border-gray-100">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Editar Locação</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Imóvel e Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Imóvel</label>
              <select name="imovel_id" required value={formData.imovel_id} onChange={handleChange}
                className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]">
                <option value="">Selecione...</option>
                {imoveis.map((im) => (
                  <option key={im.id} value={im.id}>
                    {im.codigo ? `#${im.codigo} — ` : ""}{im.titulo} ({im.bairro}, {im.cidade})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Status do contrato</label>
              <select name="status" value={formData.status} onChange={handleChange}
                className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]">
                <option value="ativo">Ativo</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Locatário</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nome completo</label>
              <input name="locatario_nome" required value={formData.locatario_nome} onChange={handleChange}
                className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">CPF</label>
              <input name="locatario_cpf" required value={formData.locatario_cpf} onChange={handleChange}
                className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Telefone</label>
              <input name="locatario_telefone" value={formData.locatario_telefone} onChange={handleChange}
                className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">E-mail</label>
              <input name="locatario_email" type="email" value={formData.locatario_email} onChange={handleChange}
                className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Contrato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Valor do aluguel (R$)</label>
              <input name="valor_aluguel" type="number" step="0.01" required value={formData.valor_aluguel} onChange={handleChange}
                className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Dia de vencimento</label>
              <input name="dia_vencimento" type="number" min="1" max="28" required value={formData.dia_vencimento} onChange={handleChange}
                className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Início do contrato</label>
              <input name="data_inicio" type="date" value={formData.data_inicio} onChange={handleChange}
                className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Fim do contrato</label>
              <input name="data_fim" type="date" value={formData.data_fim} onChange={handleChange}
                className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Observações</label>
              <textarea name="observacoes" rows={4} value={formData.observacoes} onChange={handleChange}
                className="w-full bg-gray-50 border-none p-4 rounded-xl font-medium focus:ring-2 focus:ring-[#0f2e20]" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#0f2e20] text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all uppercase tracking-widest text-sm">
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} Salvar Alterações
        </button>
      </form>
    </div>
  );
}
