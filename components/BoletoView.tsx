"use client";

import { Printer, X } from "lucide-react";
import BoletoBarras from "./BoletoBarras";

interface BoletoViewProps {
  referencia: string;
  valor: number;
  vencimento: string;
  status: string;
  linhaDigitavel: string;
  codigoBarras: string;
  locatarioNome: string;
  locatarioCpf: string;
  imovelTitulo?: string;
  imovelEndereco?: string;
  onFechar?: () => void;
}

function formatarCpf(cpf: string) {
  const d = (cpf || "").replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function BoletoView({
  referencia, valor, vencimento, status, linhaDigitavel, codigoBarras,
  locatarioNome, locatarioCpf, imovelTitulo, imovelEndereco, onFechar,
}: BoletoViewProps) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const atrasado = status === "pendente" && new Date(vencimento) < hoje;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0 print:block print:static">
      <div className="w-full max-w-2xl my-8 print:my-0 print:max-w-none">

        <div className="flex justify-end gap-2 mb-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white text-gray-800 font-bold text-sm px-4 py-2 rounded-xl shadow-lg hover:bg-gray-100 transition-all"
          >
            <Printer size={16} /> Imprimir
          </button>
          {onFechar && (
            <button
              onClick={onFechar}
              className="flex items-center gap-2 bg-white/90 text-gray-600 font-bold text-sm px-4 py-2 rounded-xl shadow-lg hover:bg-white transition-all"
            >
              <X size={16} /> Fechar
            </button>
          )}
        </div>

        <div id="boleto-imprimir" className="relative bg-white rounded-2xl print:rounded-none shadow-2xl print:shadow-none overflow-hidden border border-gray-200">

          {/* MARCA D'ÁGUA — este boleto é só demonstração, não é cobrança real */}
          <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-10">
            <span className="text-red-600/20 text-4xl md:text-5xl font-black uppercase tracking-widest rotate-[-25deg] whitespace-nowrap">
              Demonstração — não pagável
            </span>
          </div>

          <div className="bg-[#0f2e20] text-white px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-black text-lg tracking-tight">Imobiliária Porto Iguaçu</p>
              <p className="text-green-300 text-[11px] font-bold uppercase tracking-widest">Boleto de Aluguel — Ambiente de Demonstração</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
              status === "pago" ? "bg-green-500 text-white" : atrasado ? "bg-red-500 text-white" : "bg-yellow-400 text-[#0f2e20]"
            }`}>
              {status === "pago" ? "Pago" : atrasado ? "Atrasado" : "Pendente"}
            </span>
          </div>

          <div className="p-6 space-y-5 text-gray-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pagador</p>
                <p className="font-bold">{locatarioNome}</p>
                <p className="text-gray-500 text-xs">CPF {formatarCpf(locatarioCpf)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Referência</p>
                <p className="font-bold">Aluguel {referencia}</p>
              </div>
              {imovelTitulo && (
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Imóvel</p>
                  <p className="font-bold">{imovelTitulo}</p>
                  {imovelEndereco && <p className="text-gray-500 text-xs">{imovelEndereco}</p>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-dashed border-gray-200 pt-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimento</p>
                <p className="font-black text-lg">{formatarData(vencimento)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</p>
                <p className="font-black text-lg">{Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 pt-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Linha digitável</p>
              <p className="font-mono text-sm font-bold tracking-wide bg-gray-50 px-3 py-2 rounded-lg">{linhaDigitavel}</p>
            </div>

            <div>
              <BoletoBarras codigo={codigoBarras} />
            </div>

            <p className="text-[10px] text-gray-400 text-center pt-2">
              Este boleto é meramente ilustrativo, gerado para fins de demonstração do sistema. Não representa uma cobrança real e não deve ser pago.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #boleto-imprimir, #boleto-imprimir * { visibility: visible; }
          #boleto-imprimir { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
