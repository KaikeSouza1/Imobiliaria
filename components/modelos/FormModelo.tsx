"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Eye, Save, AlertCircle, CheckCircle2, Plus, Trash2, X, FileText } from "lucide-react";
import type { ResumoModelo } from "@/lib/modelos";
import type { Campo, Debito, Valores } from "@/lib/modelos/tipos";
import { camposVisiveis } from "@/lib/modelos/tipos";

const CLASSE_INPUT = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-green-500 focus:bg-white transition-all";
const CLASSE_LABEL = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block";
const LARGURA: Record<string, string> = { inteira: "col-span-6", metade: "col-span-6 md:col-span-3", terco: "col-span-6 md:col-span-2" };

function EditorDebitos({ valor, onChange }: { valor: Debito[]; onChange: (d: Debito[]) => void }) {
  const lista = valor.length ? valor : [];
  const atualizar = (i: number, campo: keyof Debito, v: string) =>
    onChange(lista.map((d, j) => (j === i ? { ...d, [campo]: campo === "valor" ? Number(v) : v } : d)));
  const total = lista.reduce((s, d) => s + (Number(d.valor) || 0), 0);
  return (
    <div className="space-y-2">
      {lista.length === 0 && <p className="text-xs text-gray-400">Nenhum débito. Clique em &quot;Adicionar débito&quot;.</p>}
      {lista.map((d, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <input value={d.descricao} onChange={(e) => atualizar(i, "descricao", e.target.value)} className={`${CLASSE_INPUT} col-span-4`} placeholder="Aluguel" />
          <input type="date" value={d.vencimento} onChange={(e) => atualizar(i, "vencimento", e.target.value)} className={`${CLASSE_INPUT} col-span-4`} aria-label="Vencimento" />
          <input type="number" step="0.01" min="0" value={d.valor || ""} onChange={(e) => atualizar(i, "valor", e.target.value)} className={`${CLASSE_INPUT} col-span-3`} placeholder="Valor R$" />
          <button type="button" onClick={() => onChange(lista.filter((_, j) => j !== i))} className="col-span-1 p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Remover"><Trash2 size={16} /></button>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={() => onChange([...lista, { descricao: "Aluguel", vencimento: "", valor: 0 }])}
          className="flex items-center gap-1 text-xs font-bold text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg"><Plus size={14} /> Adicionar débito</button>
        {lista.length > 0 && <span className="text-sm font-black text-gray-700">Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>}
      </div>
    </div>
  );
}

function CampoForm({ campo, valor, onChange }: { campo: Campo; valor: Valores[string]; onChange: (v: Valores[string]) => void }) {
  const rotulo = `${campo.rotulo}${campo.obrigatorio ? " *" : ""}`;
  if (campo.tipo === "booleano") {
    return (
      <label className="col-span-6 flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
        <input type="checkbox" checked={valor === true} onChange={(e) => onChange(e.target.checked)} className="rounded" /> {campo.rotulo}
      </label>
    );
  }
  return (
    <div className={LARGURA[campo.largura ?? "metade"]}>
      <label className={CLASSE_LABEL}>{rotulo}</label>
      {campo.tipo === "debitos" ? (
        <EditorDebitos valor={Array.isArray(valor) ? (valor as Debito[]) : []} onChange={onChange} />
      ) : campo.tipo === "select" ? (
        <select value={String(valor ?? "")} onChange={(e) => onChange(e.target.value)} className={CLASSE_INPUT}>
          {campo.opcoes?.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
        </select>
      ) : campo.tipo === "textarea" ? (
        <textarea rows={3} value={String(valor ?? "")} onChange={(e) => onChange(e.target.value)} className={CLASSE_INPUT} placeholder={campo.placeholder} />
      ) : (
        <input
          type={campo.tipo === "data" ? "date" : campo.tipo === "moeda" || campo.tipo === "percentual" || campo.tipo === "inteiro" ? "number" : "text"}
          step={campo.tipo === "moeda" ? "0.01" : campo.tipo === "percentual" ? "0.5" : undefined}
          min={campo.tipo === "moeda" || campo.tipo === "percentual" || campo.tipo === "inteiro" ? 0 : undefined}
          value={String(valor ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={CLASSE_INPUT}
          placeholder={campo.placeholder}
        />
      )}
      {campo.ajuda && <p className="text-[11px] text-gray-400 mt-1">{campo.ajuda}</p>}
    </div>
  );
}

export interface DestinoSalvar {
  locacao_id?: number;
  cliente_id?: number;
  imovel_id?: number;
}

// Formulário de um modelo: seções por grupo, dados já preenchidos, prévia do PDF e botão de salvar.
export default function FormModelo({
  modelo, origem, destino, onSalvo, onCancelar,
}: {
  modelo: ResumoModelo;
  /** parâmetros enviados a /preencher */
  origem: Record<string, string>;
  destino: DestinoSalvar;
  onSalvo: (doc: { id: number; nome_original: string }) => void;
  onCancelar: () => void;
}) {
  const [valores, setValores] = useState<Valores>({});
  const [contexto, setContexto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erros, setErros] = useState<string[]>([]);
  const [acao, setAcao] = useState<"previa" | "salvar" | null>(null);
  const [previaUrl, setPreviaUrl] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    const p = new URLSearchParams(origem);
    fetch(`/api/admin/modelos/${modelo.id}/preencher?${p}`)
      .then(async (r) => {
        const d = await r.json();
        if (!ativo) return;
        if (!r.ok) setErros([d.error || "Não foi possível carregar os dados."]);
        else { setValores(d.valores); setContexto(d.contexto); }
      })
      .catch(() => ativo && setErros(["Erro de conexão com o servidor."]))
      .finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelo.id]);

  useEffect(() => () => { if (previaUrl) URL.revokeObjectURL(previaUrl); }, [previaUrl]);

  const visiveis = useMemo(() => camposVisiveis(modelo.campos, valores), [modelo.campos, valores]);
  const grupos = useMemo(() => {
    const mapa = new Map<string, Campo[]>();
    for (const c of visiveis) mapa.set(c.grupo, [...(mapa.get(c.grupo) ?? []), c]);
    return [...mapa.entries()];
  }, [visiveis]);

  const set = (id: string, v: Valores[string]) => setValores((x) => ({ ...x, [id]: v }));

  const enviar = async (a: "previa" | "salvar") => {
    setErros([]);
    setAcao(a);
    try {
      const res = await fetch(`/api/admin/modelos/${modelo.id}/gerar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valores, acao: a, ...destino }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErros(d.erros || [d.error || "Não foi possível gerar o documento."]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (a === "previa") {
        const blob = await res.blob();
        setPreviaUrl(URL.createObjectURL(blob));
      } else {
        onSalvo(await res.json());
      }
    } catch {
      setErros(["Erro de conexão com o servidor."]);
    } finally {
      setAcao(null);
    }
  };

  if (carregando) return (
    <div className="text-center py-16 flex flex-col items-center gap-3">
      <Loader2 className="animate-spin text-green-700" size={32} />
      <p className="text-gray-500 font-bold text-sm">Carregando dados...</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-24">
      {contexto && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-2.5 text-xs font-bold">
          <CheckCircle2 size={14} /> Campos preenchidos automaticamente a partir de: {contexto}. Confira e complete o que faltar.
        </div>
      )}
      {erros.length > 0 && (
        <div className="flex gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-medium" role="alert">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <ul className="space-y-1">{erros.map((er) => <li key={er}>{er}</li>)}</ul>
        </div>
      )}

      {grupos.map(([grupo, campos]) => (
        <div key={grupo} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">{grupo}</h2>
          <div className="grid grid-cols-6 gap-3">
            {campos.map((c) => <CampoForm key={c.id} campo={c} valor={valores[c.id]} onChange={(v) => set(c.id, v)} />)}
          </div>
        </div>
      ))}

      <div className="fixed bottom-0 left-72 right-0 z-10 bg-white/90 backdrop-blur border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-10 py-3 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancelar} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-all">Cancelar</button>
          <button type="button" onClick={() => enviar("previa")} disabled={!!acao}
            className="bg-white border border-gray-200 hover:border-green-400 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-60">
            {acao === "previa" ? <Loader2 className="animate-spin" size={16} /> : <Eye size={16} />} Ver prévia
          </button>
          <button type="button" onClick={() => enviar("salvar")} disabled={!!acao}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all disabled:opacity-60">
            {acao === "salvar" ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Gerar PDF e salvar
          </button>
        </div>
      </div>

      {previaUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" role="dialog" aria-label="Prévia do documento">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <p className="font-black text-sm text-gray-800 flex items-center gap-2"><FileText size={16} className="text-green-600" /> Prévia: {modelo.titulo}</p>
              <button onClick={() => setPreviaUrl(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="Fechar"><X size={18} /></button>
            </div>
            <iframe src={previaUrl} title="Prévia" className="flex-1 w-full" />
            <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-100">
              <button onClick={() => setPreviaUrl(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100">Voltar e corrigir</button>
              <button onClick={() => { setPreviaUrl(null); enviar("salvar"); }}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"><Save size={16} /> Está certo, salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
