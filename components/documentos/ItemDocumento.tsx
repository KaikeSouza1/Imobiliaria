"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Eye, Download, Trash2, Loader2 } from "lucide-react";
import { ROTULO_TIPO_DOCUMENTO, formatarTamanho, type TipoDocumento } from "@/lib/documentos";

export interface DocumentoResumo {
  id: number;
  tipo: string;
  nome_original: string;
  tamanho: number;
  incluido_por: string;
  incluido_em: string;
  locacao_id?: number | null;
  contrato_codigo?: string | null;
  inquilino_nome?: string | null;
}

// Linha de documento com visualizar, baixar e excluir (com confirmação).
export default function ItemDocumento({
  doc,
  mostrarContrato,
  onExcluido,
}: {
  doc: DocumentoResumo;
  mostrarContrato?: boolean;
  onExcluido?: (id: number) => void;
}) {
  const [excluindo, setExcluindo] = useState(false);

  const excluir = async () => {
    if (!confirm(`Excluir o documento "${doc.nome_original}"?\n\nEle deixa de aparecer no sistema, mas fica guardado no histórico.`)) return;
    setExcluindo(true);
    try {
      const res = await fetch(`/api/admin/documentos/${doc.id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) onExcluido?.(doc.id);
      else alert(d.error || "Não foi possível excluir o documento.");
    } finally {
      setExcluindo(false);
    }
  };

  const base = `/api/admin/documentos/${doc.id}/arquivo`;

  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-600 flex-shrink-0 border border-gray-100">
        <FileText size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm truncate" title={doc.nome_original}>{doc.nome_original}</p>
        <p className="text-xs text-gray-500 truncate">
          {ROTULO_TIPO_DOCUMENTO[doc.tipo] ?? doc.tipo} · {formatarTamanho(doc.tamanho)} ·{" "}
          {new Date(doc.incluido_em).toLocaleDateString("pt-BR")} · {doc.incluido_por}
          {mostrarContrato && doc.locacao_id && (
            <>
              {" · "}
              <Link href={`/admin/locacoes/${doc.locacao_id}`} className="font-bold text-green-700 hover:underline">
                {doc.contrato_codigo || `Contrato #${doc.locacao_id}`}
              </Link>
              {doc.inquilino_nome ? ` (${doc.inquilino_nome})` : ""}
            </>
          )}
        </p>
      </div>
      <a href={`${base}?modo=ver`} target="_blank" rel="noopener noreferrer" title="Visualizar"
        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all flex-shrink-0"><Eye size={14} /></a>
      <a href={`${base}?modo=baixar`} title="Baixar"
        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all flex-shrink-0"><Download size={14} /></a>
      <button onClick={excluir} disabled={excluindo} title="Excluir"
        className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all flex-shrink-0 disabled:opacity-50">
        {excluindo ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}
