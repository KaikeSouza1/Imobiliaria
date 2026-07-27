"use client";

import { useState } from "react";
import { X, Loader2, CalendarCheck2 } from "lucide-react";

export interface ItemPreviewBoleto {
  referencia: string;
  vencimento: string; // yyyy-mm-dd
  valor: string;
  jaExiste: boolean;
  incluir: boolean;
}

interface Props {
  titulo: string;
  itensIniciais: ItemPreviewBoleto[];
  onFechar: () => void;
  onConfirmar: (itens: { referencia: string; vencimento: string; valor: number }[]) => Promise<void>;
}

const NOMES_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function rotuloReferencia(referencia: string) {
  const [mes, ano] = referencia.split("/");
  const idx = parseInt(mes, 10) - 1;
  return `${NOMES_MES[idx] ?? mes}/${ano}`;
}

export default function GerarBoletosPreviewModal({ titulo, itensIniciais, onFechar, onConfirmar }: Props) {
  const [itens, setItens] = useState<ItemPreviewBoleto[]>(itensIniciais);
  const [enviando, setEnviando] = useState(false);

  const atualizarItem = (index: number, campo: "vencimento" | "valor" | "incluir", valor: string | boolean) => {
    setItens((prev) => prev.map((it, i) => (i === index ? { ...it, [campo]: valor } : it)));
  };

  const selecionados = itens.filter((it) => it.incluir && !it.jaExiste);

  const confirmar = async () => {
    if (selecionados.length === 0) return;
    setEnviando(true);
    try {
      await onConfirmar(
        selecionados.map((it) => ({
          referencia: it.referencia,
          vencimento: it.vencimento,
          valor: parseFloat(it.valor) || 0,
        }))
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-black text-gray-900 text-lg">{titulo}</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Revise as datas de vencimento e os valores antes de confirmar. Nada é salvo até você clicar em "Confirmar Geração".
            </p>
          </div>
          <button onClick={onFechar} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {itens.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">Nenhum mês encontrado neste período.</p>
          )}
          {itens.map((item, i) => (
            <div
              key={item.referencia}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                ${item.jaExiste ? "bg-gray-50 border-gray-100 opacity-50"
                  : item.incluir ? "bg-white border-gray-200 shadow-sm" : "bg-gray-50 border-gray-100 opacity-50"}`}
            >
              <input
                type="checkbox"
                checked={item.incluir && !item.jaExiste}
                disabled={item.jaExiste}
                onChange={(e) => atualizarItem(i, "incluir", e.target.checked)}
                className="w-4 h-4 accent-green-600 flex-shrink-0"
              />
              <div className="w-16 flex-shrink-0">
                <p className="font-black text-gray-800 text-sm">{rotuloReferencia(item.referencia)}</p>
                {item.jaExiste && <p className="text-[9px] text-gray-400 font-bold uppercase">Já existe</p>}
              </div>
              <input
                type="date"
                value={item.vencimento}
                disabled={item.jaExiste || !item.incluir}
                onChange={(e) => atualizarItem(i, "vencimento", e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-green-500 disabled:opacity-50"
              />
              <input
                type="number"
                step="0.01"
                value={item.valor}
                disabled={item.jaExiste || !item.incluir}
                onChange={(e) => atualizarItem(i, "valor", e.target.value)}
                className="w-28 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-green-500 disabled:opacity-50"
              />
            </div>
          ))}
        </div>

        <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-between gap-4 flex-shrink-0">
          <p className="text-xs text-gray-500 font-bold">
            {selecionados.length} boleto{selecionados.length !== 1 ? "s" : ""} ser{selecionados.length !== 1 ? "ão" : "á"} gerado{selecionados.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <button onClick={onFechar} className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm transition-all">
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={enviando || selecionados.length === 0}
              className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {enviando ? <Loader2 className="animate-spin" size={16} /> : <CalendarCheck2 size={16} />} Confirmar Geração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
