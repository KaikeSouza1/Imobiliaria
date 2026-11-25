"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { TIPOS_DOCUMENTO, ROTULO_TIPO_DOCUMENTO, TAMANHO_MAXIMO_TEXTO, type TipoDocumento, type Vinculo } from "@/lib/documentos";
import { enviarDocumento, type ResultadoEnvio } from "@/lib/enviar-documento";

// Seleção do tipo + escolha de um ou mais PDFs. Mostra o resultado de cada arquivo.
export default function EnvioDocumentos({
  vinculo,
  tipoInicial = "contrato_assinado",
  onConcluido,
  desabilitado,
}: {
  vinculo: Partial<Vinculo>;
  tipoInicial?: TipoDocumento;
  onConcluido?: () => void;
  desabilitado?: boolean;
}) {
  const [tipo, setTipo] = useState<TipoDocumento>(tipoInicial);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [resultados, setResultados] = useState<ResultadoEnvio[]>([]);
  const entrada = useRef<HTMLInputElement>(null);

  const enviar = async (lista: FileList | null) => {
    if (!lista || lista.length === 0) return;
    setResultados([]);
    const feitos: ResultadoEnvio[] = [];
    for (const arquivo of Array.from(lista)) {
      setEnviando(arquivo.name);
      try {
        feitos.push(await enviarDocumento(arquivo, vinculo, tipo));
      } catch {
        feitos.push({ ok: false, nome: arquivo.name, erro: `Erro inesperado ao enviar "${arquivo.name}".` });
      }
      setResultados([...feitos]);
    }
    setEnviando(null);
    if (feitos.some((r) => r.ok)) onConcluido?.();
  };

  const bloqueado = desabilitado || !!enviando;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDocumento)} disabled={bloqueado}
          className="bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-xs font-bold outline-none focus:border-green-500">
          {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{ROTULO_TIPO_DOCUMENTO[t]}</option>)}
        </select>
        <label className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all
          ${bloqueado ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white shadow-md cursor-pointer"}`}>
          {enviando ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
          {enviando ? `Enviando ${enviando}...` : "Anexar PDF"}
          <input ref={entrada} type="file" accept="application/pdf,.pdf" multiple className="hidden" disabled={bloqueado}
            onChange={(e) => { enviar(e.target.files); e.target.value = ""; }} />
        </label>
        <span className="text-[11px] text-gray-400">Somente PDF, até {TAMANHO_MAXIMO_TEXTO} cada.</span>
      </div>

      {resultados.length > 0 && (
        <div className="space-y-1.5" role="status">
          {resultados.map((r, i) => (
            <div key={`${r.nome}-${i}`}
              className={`flex items-start gap-2 text-xs font-medium rounded-xl px-3 py-2 border
                ${r.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>
              {r.ok ? <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
              <span className="flex-1">{r.ok ? `"${r.nome}" anexado.` : r.erro}</span>
              <button type="button" onClick={() => setResultados((rs) => rs.filter((_, j) => j !== i))} className="opacity-60 hover:opacity-100">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
