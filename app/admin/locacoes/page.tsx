"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Loader2, KeyRound, Wallet, FileText, CalendarClock, Search, X, Eye, Edit,
  SlidersHorizontal, Archive, Paperclip, ChevronLeft, ChevronRight, Home, User,
} from "lucide-react";
import { STATUS_CONTRATO, ROTULO_STATUS } from "@/lib/contratos";
import { formatarData, formatarMoeda } from "@/lib/texto";

interface ContratoLista {
  id: number;
  codigo: string | null;
  status: string;
  origem: string;
  valor_aluguel: number;
  data_inicio: string | null;
  data_fim: string | null;
  finalidade: string | null;
  numero_pasta: string | null;
  inquilino_nome: string | null;
  proprietario_nome: string | null;
  imovel_id: number | null;
  imovel_codigo: string | null;
  imovel_titulo: string | null;
  imovel_endereco: string | null;
  imovel_bairro: string | null;
  imovel_cidade: string | null;
  imovel_codigo_legado: string | null;
  imovel_endereco_legado: string | null;
  proximo_reajuste: string | null;
  total_documentos: number;
}

interface Resposta {
  itens: ContratoLista[];
  total: number;
  pagina: number;
  paginas: number;
  resumo?: { total: number; ativos: number; receita_mensal: number; reajustes_30_dias: number };
}

const COR_STATUS: Record<string, string> = { ativo: "bg-green-600", encerrado: "bg-gray-500", rescindido: "bg-red-600" };
const FILTROS_VAZIOS = { q: "", codigo: "", status: "", finalidade: "", reajuste_de: "", reajuste_ate: "" };

const CLASSE_INPUT = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all";
const CLASSE_LABEL = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block";

function chip(ativo: boolean) {
  return `px-4 py-2 rounded-xl text-xs font-bold transition-all border ${ativo
    ? "bg-[#0f2e20] text-white border-[#0f2e20] shadow-sm"
    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`;
}

export default function ContratosPage() {
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState<Resposta | null>(null);
  const [resumo, setResumo] = useState<Resposta["resumo"]>();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const buscar = useCallback(async (f: typeof FILTROS_VAZIOS, p: number, comResumo: boolean) => {
    setCarregando(true);
    setErro("");
    try {
      const params = new URLSearchParams({ pagina: String(p) });
      Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
      if (comResumo) params.set("resumo", "1");
      const res = await fetch(`/api/admin/locacoes?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar contratos");
      setDados(data);
      if (data.resumo) setResumo(data.resumo);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao buscar contratos");
    } finally {
      setCarregando(false);
    }
  }, []);

  // Busca com pequeno atraso enquanto digita.
  useEffect(() => {
    const t = setTimeout(() => buscar(filtros, pagina, !resumo), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, pagina, buscar]);

  const set = (campo: keyof typeof FILTROS_VAZIOS, valor: string) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPagina(1);
  };
  const temFiltros = Object.values(filtros).some(Boolean);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-1 h-8 bg-green-600 rounded-full"></div>
            Contratos de Locação
          </h1>
          <p className="text-gray-500 text-sm mt-1 ml-7">Contratos, inquilinos, proprietários e documentos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/locacoes/novo?legado=1"
            className="bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
            <Archive size={18} /> Contrato Antigo
          </Link>
          <Link href="/admin/locacoes/novo"
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95">
            <Plus size={20} strokeWidth={3} /> Novo Contrato
          </Link>
        </div>
      </div>

      {/* ESTATÍSTICAS */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200">
            <FileText className="text-blue-700 mb-2" size={24} />
            <p className="text-3xl font-black text-blue-900">{resumo.total}</p>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Contratos</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl border border-green-200">
            <KeyRound className="text-green-700 mb-2" size={24} />
            <p className="text-3xl font-black text-green-900">{resumo.ativos}</p>
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Ativos</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-2xl border border-emerald-200">
            <Wallet className="text-emerald-700 mb-2" size={24} />
            <p className="text-2xl font-black text-emerald-900">{formatarMoeda(resumo.receita_mensal)}</p>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Aluguéis ativos / mês</p>
          </div>
          <button type="button" onClick={() => {
              const hoje = new Date();
              const ate = new Date(hoje.getTime() + 30 * 86400000);
              const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
              setFiltros({ ...FILTROS_VAZIOS, status: "ativo", reajuste_de: iso(hoje), reajuste_ate: iso(ate) });
              setPagina(1);
            }}
            className="text-left bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-2xl border border-orange-200 hover:shadow-md transition-all">
            <CalendarClock className="text-orange-700 mb-2" size={24} />
            <p className="text-3xl font-black text-orange-900">{resumo.reajustes_30_dias}</p>
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Reajustes em 30 dias</p>
          </button>
        </div>
      )}

      {/* BUSCA E FILTROS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700 font-black text-sm uppercase tracking-wider">
            <SlidersHorizontal size={16} className="text-green-600" />
            Busca e Filtros
            {dados && (
              <span className="bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {dados.total} resultado{dados.total !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {temFiltros && (
            <button onClick={() => { setFiltros(FILTROS_VAZIOS); setPagina(1); }}
              className="flex items-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
              <X size={14} /> Limpar tudo
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className={CLASSE_LABEL}>Buscar</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={filtros.q} onChange={(e) => set("q", e.target.value)} className={`${CLASSE_INPUT} pl-9`}
                  placeholder="Inquilino, proprietário, endereço, código ou pasta..." />
                {filtros.q && (
                  <button onClick={() => set("q", "")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                )}
              </div>
            </div>
            <div>
              <label className={CLASSE_LABEL}>Código (contrato ou imóvel)</label>
              <input value={filtros.codigo} onChange={(e) => set("codigo", e.target.value)} className={CLASSE_INPUT} placeholder="Ex: CT-00012" />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-5">
            <div>
              <label className={CLASSE_LABEL}>Status</label>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => set("status", "")} className={chip(!filtros.status)}>Todos</button>
                {STATUS_CONTRATO.map((s) => (
                  <button key={s} onClick={() => set("status", s)} className={chip(filtros.status === s)}>{ROTULO_STATUS[s]}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={CLASSE_LABEL}>Finalidade</label>
              <div className="flex gap-2 flex-wrap">
                {[["", "Todas"], ["residencial", "Residencial"], ["comercial", "Comercial"]].map(([v, r]) => (
                  <button key={v} onClick={() => set("finalidade", v)} className={chip(filtros.finalidade === v)}>{r}</button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className={CLASSE_LABEL}>Próximo reajuste entre</label>
              <div className="flex items-center gap-2">
                <input type="date" value={filtros.reajuste_de} onChange={(e) => set("reajuste_de", e.target.value)} className={CLASSE_INPUT} />
                <span className="text-gray-400 text-xs font-bold">e</span>
                <input type="date" value={filtros.reajuste_ate} onChange={(e) => set("reajuste_ate", e.target.value)} className={CLASSE_INPUT} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA */}
      {erro ? (
        <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-200 text-red-700 font-bold">{erro}</div>
      ) : !dados && carregando ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-green-700" size={40} />
          <p className="text-gray-500 font-bold">Carregando contratos...</p>
        </div>
      ) : dados && dados.itens.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
          <KeyRound className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-600">{temFiltros ? "Nenhum contrato encontrado" : "Nenhum contrato cadastrado"}</h3>
          <p className="text-gray-400 mt-2 text-sm">{temFiltros ? "Tente outros critérios de busca." : 'Clique em "Novo Contrato" para começar.'}</p>
        </div>
      ) : dados && (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-opacity ${carregando ? "opacity-60" : ""}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 bg-gray-50/60">
                  <th className="py-3 px-5">Contrato</th>
                  <th className="py-3 px-4">Inquilino / Proprietário</th>
                  <th className="py-3 px-4">Imóvel</th>
                  <th className="py-3 px-4">Aluguel</th>
                  <th className="py-3 px-4">Próx. reajuste</th>
                  <th className="py-3 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {dados.itens.map((l) => {
                  const imovel = l.imovel_id
                    ? `${l.imovel_codigo ? `#${l.imovel_codigo} ` : ""}${l.imovel_titulo ?? ""}`
                    : l.imovel_codigo_legado ? `#${l.imovel_codigo_legado}` : "—";
                  const endereco = l.imovel_id
                    ? [l.imovel_endereco, l.imovel_bairro, l.imovel_cidade].filter(Boolean).join(", ")
                    : l.imovel_endereco_legado;
                  return (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-green-50/30 transition-colors align-top">
                      <td className="py-4 px-5">
                        <Link href={`/admin/locacoes/${l.id}`} className="font-black text-gray-900 hover:text-green-700">{l.codigo || `#${l.id}`}</Link>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-white ${COR_STATUS[l.status] ?? "bg-gray-500"}`}>
                            {ROTULO_STATUS[l.status as keyof typeof ROTULO_STATUS] ?? l.status}
                          </span>
                          {l.origem === "legado" && <span title="Contrato antigo" className="text-amber-600"><Archive size={12} /></span>}
                          {l.total_documentos > 0 && (
                            <span title="Documentos" className="text-[10px] font-bold text-gray-500 flex items-center gap-0.5"><Paperclip size={11} />{l.total_documentos}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-gray-800 flex items-center gap-1"><User size={12} className="text-gray-400" /> {l.inquilino_nome || "—"}</p>
                        <p className="text-xs text-gray-500 mt-1">Prop.: {l.proprietario_nome || "—"}</p>
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <p className="font-bold text-gray-800 truncate flex items-center gap-1"><Home size={12} className="text-gray-400 flex-shrink-0" /> {imovel}</p>
                        <p className="text-xs text-gray-500 truncate mt-1">{endereco || "—"}</p>
                      </td>
                      <td className="py-4 px-4 font-black text-green-700 whitespace-nowrap">{formatarMoeda(l.valor_aluguel)}</td>
                      <td className="py-4 px-4 text-gray-600 whitespace-nowrap">{formatarData(l.proximo_reajuste)}</td>
                      <td className="py-4 px-5">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/locacoes/${l.id}`} title="Detalhes"
                            className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-all"><Eye size={14} /></Link>
                          <Link href={`/admin/locacoes/editar/${l.id}`} title="Editar"
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all"><Edit size={14} /></Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {dados.paginas > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm">
              <span className="text-gray-500 font-medium">Página {dados.pagina} de {dados.paginas}</span>
              <div className="flex gap-2">
                <button disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-all"><ChevronLeft size={16} /></button>
                <button disabled={pagina >= dados.paginas} onClick={() => setPagina((p) => p + 1)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-all"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
