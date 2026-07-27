"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Loader2, KeyRound, Home, Eye, AlertTriangle, Sparkles } from "lucide-react";
import BoletoView from "@/components/BoletoView";

interface Boleto {
  id: number;
  referencia: string;
  valor: number;
  vencimento: string;
  status: string;
  linha_digitavel: string;
  codigo_barras: string;
}

interface Contrato {
  id: number;
  imovel_titulo: string;
  imovel_endereco: string;
  imovel_cidade: string;
  imovel_bairro: string;
  imovel_imagem_url: string;
  locatario_nome: string;
  locatario_cpf: string;
  valor_aluguel: number;
  dia_vencimento: number;
  status: string;
  boletos: Boleto[];
}

function maskCpf(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarData(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function AreaClientePage() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [erro, setErro] = useState("");
  const [boletoAberto, setBoletoAberto] = useState<{ boleto: Boleto; contrato: Contrato } | null>(null);

  const consultar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/area-cliente/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro ao consultar. Tente novamente.");
        setContratos([]);
      } else {
        setContratos(data.contratos || []);
      }
      setBuscou(true);
    } catch {
      setErro("Erro de conexão. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return (
    <main className="min-h-screen bg-[#f8f7f4] font-sans">

      {/* HERO */}
      <section className="relative bg-[#0f2e20] pb-16 pt-40 overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle, #4ade80 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center text-white">
          <p className="text-green-400 font-black uppercase tracking-[0.3em] text-xs mb-3">Área do Cliente</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-3">Consulte seus boletos de aluguel</h1>
          <p className="text-green-200 text-sm font-medium">Informe o CPF cadastrado no seu contrato de locação para ver seu imóvel e seus boletos.</p>
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section className="max-w-2xl mx-auto px-4 -mt-10 relative z-10 mb-4">
        <form onSubmit={consultar} className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-8 flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              required
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-green-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#0f2e20] hover:bg-black text-white font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />} Consultar
          </button>
        </form>
      </section>

      {/* RESULTADOS */}
      <section className="max-w-2xl mx-auto px-4 pb-24 space-y-6">

        {erro && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-bold">
            <AlertTriangle size={18} /> {erro}
          </div>
        )}

        {buscou && !erro && contratos.length === 0 && (
          <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
            <Home className="mx-auto text-gray-300 mb-4" size={40} />
            <h3 className="text-lg font-bold text-gray-600">Nenhum contrato encontrado para este CPF</h3>
            <p className="text-gray-400 mt-2 text-sm px-6">Verifique se o CPF foi digitado corretamente ou entre em contato com a imobiliária.</p>
          </div>
        )}

        {contratos.map((contrato) => (
          <div key={contrato.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 p-6 border-b border-gray-100">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                {contrato.imovel_imagem_url ? (
                  <Image src={contrato.imovel_imagem_url} alt={contrato.imovel_titulo} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><Home size={24} /></div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{contrato.imovel_titulo || "Imóvel"}</p>
                <p className="text-gray-500 text-xs">{contrato.imovel_bairro}, {contrato.imovel_cidade}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase text-white ${contrato.status === "ativo" ? "bg-green-600" : "bg-gray-500"}`}>
                {contrato.status}
              </span>
            </div>

            <div className="p-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Boletos</p>
              {contrato.boletos.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum boleto disponível ainda para este contrato.</p>
              ) : (
                <div className="space-y-2">
                  {contrato.boletos.map((b) => {
                    const atrasado = b.status === "pendente" && new Date(b.vencimento) < hoje;
                    return (
                      <div key={b.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">Aluguel {b.referencia}</p>
                          <p className="text-xs text-gray-500">Vencimento {formatarData(b.vencimento)} · {Number(b.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase text-white
                            ${b.status === "pago" ? "bg-green-600" : atrasado ? "bg-red-600" : "bg-yellow-500"}`}>
                            {b.status === "pago" ? "Pago" : atrasado ? "Atrasado" : "Pendente"}
                          </span>
                          <button
                            onClick={() => setBoletoAberto({ boleto: b, contrato })}
                            className="flex items-center gap-1 bg-[#0f2e20] hover:bg-black text-white text-[11px] font-bold px-3 py-2 rounded-lg transition-all"
                          >
                            <Eye size={13} /> Ver
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {contratos.length > 0 && (
          <p className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Sparkles size={13} /> Ambiente de demonstração: os boletos exibidos são ilustrativos e não devem ser pagos.
          </p>
        )}
      </section>

      {boletoAberto && (
        <BoletoView
          referencia={boletoAberto.boleto.referencia}
          valor={boletoAberto.boleto.valor}
          vencimento={boletoAberto.boleto.vencimento}
          status={boletoAberto.boleto.status}
          linhaDigitavel={boletoAberto.boleto.linha_digitavel}
          codigoBarras={boletoAberto.boleto.codigo_barras}
          locatarioNome={boletoAberto.contrato.locatario_nome}
          locatarioCpf={boletoAberto.contrato.locatario_cpf}
          imovelTitulo={boletoAberto.contrato.imovel_titulo}
          imovelEndereco={`${boletoAberto.contrato.imovel_endereco || ""}, ${boletoAberto.contrato.imovel_bairro} — ${boletoAberto.contrato.imovel_cidade}`}
          onFechar={() => setBoletoAberto(null)}
        />
      )}
    </main>
  );
}
