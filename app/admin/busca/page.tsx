"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, X, SlidersHorizontal, Loader2, User, Home, FileText, Paperclip, Archive,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowRight,
} from "lucide-react";
import { STATUS_CONTRATO, rotuloStatus } from "@/lib/contratos";
import { formatarData, formatarMoeda } from "@/lib/texto";

interface Contrato {
  id: number;
  codigo: string | null;
  status: string;
  origem: string;
  tipo: "locacao" | "venda";
  valor_venda: number | null;
  valor_aluguel: number;
  data_inicio: string | null;
  data_fim: string | null;
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

interface Cliente { id: number; codigo: string | null; nome: string; documento: string; telefone: string | null; eh_inquilino: boolean; eh_proprietario: boolean; total_contratos: number }
interface Imovel { id: number; codigo: string | null; titulo: string; endereco: string | null; bairro: string | null; cidade: string | null; total_contratos: number }
type Foco =
  | { tipo: "cliente"; id: number; codigo: string | null; nome: string; telefone: string | null; eh_inquilino: boolean; eh_proprietario: boolean }
  | { tipo: "imovel"; id: number; codigo: string | null; titulo: string; endereco: string | null; bairro: string | null; cidade: string | null }
  | null;

interface Resposta {
  contratos: { itens: Contrato[]; total: number; pagina: number; paginas: number };
  clientes: Cliente[];
  imoveis: Imovel[];
  foco: Foco;
}

const CAMPOS = ["q", "inquilino", "proprietario", "codigo", "endereco", "tipo", "status", "reajuste_de", "reajuste_ate", "cliente_id", "imovel_id"] as const;
type Campo = (typeof CAMPOS)[number];
type Filtros = Record<Campo, string>;
const AVANCADOS: Campo[] = ["inquilino", "proprietario", "codigo", "endereco", "tipo", "status", "reajuste_de", "reajuste_ate"];

const COR_STATUS: Record<string, string> = { ativo: "bg-green-600", encerrado: "bg-gray-500", rescindido: "bg-red-600" };
const CLASSE_INPUT = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all";
const CLASSE_LABEL = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block";

function lerFiltros(sp: URLSearchParams): Filtros {
  return Object.fromEntries(CAMPOS.map((c) => [c, sp.get(c) || ""])) as Filtros;
}

function Busca() {
  const router = useRouter();
  const sp = useSearchParams();
  const [filtros, setFiltros] = useState<Filtros>(() => lerFiltros(sp));
  const [pagina, setPagina] = useState(Number(sp.get("pagina")) || 1);
  const [avancado, setAvancado] = useState(() => AVANCADOS.some((c) => sp.get(c)));
  const [dados, setDados] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // A caixa do topo navega para cá com ?q=; acompanha mudanças na URL.
  const qDaUrl = sp.get("q") || "";
  const [qAnterior, setQAnterior] = useState(qDaUrl);
  if (qDaUrl !== qAnterior) {
    setQAnterior(qDaUrl);
    if (qDaUrl !== filtros.q.trim()) {
      setFiltros(lerFiltros(sp));
      setPagina(1);
    }
  }

  const algumFiltro = CAMPOS.some((c) => filtros[c].trim());

  useEffect(() => {
    let ativo = true;
    const t = setTimeout(async () => {
      const params = new URLSearchParams();
      CAMPOS.forEach((c) => filtros[c].trim() && params.set(c, filtros[c].trim()));
      if (pagina > 1) params.set("pagina", String(pagina));
      router.replace(`/admin/busca${params.size ? `?${params}` : ""}`, { scroll: false });
      if (!CAMPOS.some((c) => filtros[c].trim())) { setDados(null); return; }

      setCarregando(true);
      setErro("");
      try {
        const r = await fetch(`/api/admin/busca?${params}`);
        const d = await r.json();
        if (!ativo) return;
        if (!r.ok) throw new Error(d.error || "Erro na busca");
        setDados(d);
      } catch (e) {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro na busca");
      } finally {
        if (ativo) setCarregando(false);
      }
    }, 300);
    return () => { ativo = false; clearTimeout(t); };
  }, [filtros, pagina, router]);

  const set = (c: Campo, v: string) => { setFiltros((f) => ({ ...f, [c]: v })); setPagina(1); };
  const focar = (c: "cliente_id" | "imovel_id", id: number) => {
    setFiltros({ ...(Object.fromEntries(CAMPOS.map((k) => [k, ""])) as Filtros), [c]: String(id) });
    setPagina(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const limpar = () => { setFiltros(Object.fromEntries(CAMPOS.map((k) => [k, ""])) as Filtros); setPagina(1); };

  const foco = dados?.foco;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-1 h-8 bg-green-600 rounded-full"></div>
          Busca Global
        </h1>
        <p className="text-gray-500 text-sm mt-1 ml-7">Digite o que você sabe: nome do inquilino ou do proprietário, código, endereço ou nº da pasta.</p>
      </div>

      {/* CRITÉRIOS: sempre visíveis */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={filtros.q} onChange={(e) => set("q", e.target.value)} autoFocus
              className="w-full pl-12 pr-10 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base font-bold outline-none focus:border-green-500 focus:bg-white transition-all"
              placeholder="Ex.: Maria Silva, Rua das Flores, CT-00012, pasta 7..." />
            {filtros.q && (
              <button onClick={() => set("q", "")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16} /></button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setAvancado((v) => !v)} className="flex items-center gap-2 text-xs font-black text-gray-600 uppercase tracking-wider hover:text-green-700">
              <SlidersHorizontal size={14} className="text-green-600" /> Filtros avançados {avancado ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {algumFiltro && (
              <button onClick={limpar} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                <X size={14} /> Limpar tudo
              </button>
            )}
          </div>

          {avancado && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
              <div><label className={CLASSE_LABEL}>Nome do inquilino</label><input value={filtros.inquilino} onChange={(e) => set("inquilino", e.target.value)} className={CLASSE_INPUT} /></div>
              <div><label className={CLASSE_LABEL}>Nome do proprietário</label><input value={filtros.proprietario} onChange={(e) => set("proprietario", e.target.value)} className={CLASSE_INPUT} /></div>
              <div><label className={CLASSE_LABEL}>Código (contrato ou imóvel)</label><input value={filtros.codigo} onChange={(e) => set("codigo", e.target.value)} className={CLASSE_INPUT} /></div>
              <div><label className={CLASSE_LABEL}>Endereço do imóvel</label><input value={filtros.endereco} onChange={(e) => set("endereco", e.target.value)} className={CLASSE_INPUT} /></div>
              <div>
                <label className={CLASSE_LABEL}>Tipo de contrato</label>
                <select value={filtros.tipo} onChange={(e) => set("tipo", e.target.value)} className={CLASSE_INPUT}>
                  <option value="">Locação e venda</option>
                  <option value="locacao">Somente locação</option>
                  <option value="venda">Somente venda</option>
                </select>
              </div>
              <div>
                <label className={CLASSE_LABEL}>Status</label>
                <select value={filtros.status} onChange={(e) => set("status", e.target.value)} className={CLASSE_INPUT}>
                  <option value="">Todos</option>
                  {STATUS_CONTRATO.map((s) => <option key={s} value={s}>{filtros.tipo ? rotuloStatus(s, filtros.tipo) : `${rotuloStatus(s, "locacao")} / ${rotuloStatus(s, "venda")}`}</option>)}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className={CLASSE_LABEL}>Próximo reajuste entre</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={filtros.reajuste_de} onChange={(e) => set("reajuste_de", e.target.value)} className={CLASSE_INPUT} />
                  <span className="text-gray-400 text-xs font-bold">e</span>
                  <input type="date" value={filtros.reajuste_ate} onChange={(e) => set("reajuste_ate", e.target.value)} className={CLASSE_INPUT} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOCO EM UMA PESSOA OU IMÓVEL */}
      {foco && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
          {foco.tipo === "cliente" ? <User className="text-green-700" size={20} /> : <Home className="text-green-700" size={20} />}
          <div className="flex-1">
            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">
              {foco.tipo === "cliente" ? "Todos os contratos desta pessoa" : "Histórico de contratos deste imóvel"}
            </p>
            <p className="font-black text-gray-900">
              {foco.tipo === "cliente"
                ? `${foco.nome}${foco.codigo ? ` · ${foco.codigo}` : ""}`
                : `${foco.codigo ? `#${foco.codigo} — ` : ""}${foco.titulo}`}
            </p>
            {foco.tipo === "imovel" && <p className="text-xs text-gray-500">{[foco.endereco, foco.bairro, foco.cidade].filter(Boolean).join(", ")}</p>}
          </div>
          <button onClick={limpar} className="text-xs font-bold text-gray-500 hover:bg-white px-3 py-1.5 rounded-lg">Nova busca</button>
        </div>
      )}

      {/* RESULTADOS */}
      {!algumFiltro ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
          <Search className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-600">Comece digitando acima</h3>
          <p className="text-gray-400 mt-2 text-sm">Não precisa de acento nem do nome completo: &quot;joao silv&quot; encontra &quot;João da Silva&quot;.</p>
        </div>
      ) : erro ? (
        <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-200 text-red-700 font-bold">{erro}</div>
      ) : !dados ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-green-700" size={36} />
          <p className="text-gray-500 font-bold">Buscando...</p>
        </div>
      ) : (
        <div className={`space-y-8 transition-opacity ${carregando ? "opacity-60" : ""}`}>
          {/* PESSOAS E IMÓVEIS ENCONTRADOS */}
          {(dados.clientes.length > 0 || dados.imoveis.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dados.clientes.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Pessoas</p>
                  <div className="space-y-1">
                    {dados.clientes.map((c) => (
                      <button key={c.id} onClick={() => focar("cliente_id", c.id)}
                        className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors">
                        <User size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">{c.nome}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {[c.eh_inquilino && "Inquilino", c.eh_proprietario && "Proprietário", c.codigo, c.documento].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{c.total_contratos} contrato{c.total_contratos !== 1 ? "s" : ""}</span>
                        <ArrowRight size={14} className="text-gray-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {dados.imoveis.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Imóveis</p>
                  <div className="space-y-1">
                    {dados.imoveis.map((i) => (
                      <button key={i.id} onClick={() => focar("imovel_id", i.id)}
                        className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors">
                        <Home size={16} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">{i.codigo ? `#${i.codigo} — ` : ""}{i.titulo}</p>
                          <p className="text-xs text-gray-500 truncate">{[i.endereco, i.bairro, i.cidade].filter(Boolean).join(", ")}</p>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{i.total_contratos} contrato{i.total_contratos !== 1 ? "s" : ""}</span>
                        <ArrowRight size={14} className="text-gray-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTRATOS */}
          <div>
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText size={14} className="text-green-600" /> Contratos
              <span className="bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{dados.contratos.total}</span>
            </p>

            {dados.contratos.itens.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-600 font-bold">Nenhum contrato encontrado.</p>
                <p className="text-gray-400 text-sm mt-1">Tente parte do nome, só o sobrenome ou o código sem o prefixo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dados.contratos.itens.map((c) => {
                  const imovel = c.imovel_id
                    ? `${c.imovel_codigo ? `#${c.imovel_codigo} — ` : ""}${c.imovel_titulo ?? ""}`
                    : c.imovel_codigo_legado ? `#${c.imovel_codigo_legado}` : "Imóvel não informado";
                  const endereco = c.imovel_id
                    ? [c.imovel_endereco, c.imovel_bairro, c.imovel_cidade].filter(Boolean).join(", ")
                    : c.imovel_endereco_legado;
                  return (
                    <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-green-200 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="md:w-44 flex-shrink-0">
                          <Link href={`/admin/locacoes/${c.id}`} className="font-black text-gray-900 hover:text-green-700">{c.codigo || `#${c.id}`}</Link>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${c.tipo === "venda" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>{c.tipo === "venda" ? "Venda" : "Locação"}</span>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-white ${COR_STATUS[c.status] ?? "bg-gray-500"}`}>
                              {rotuloStatus(c.status, c.tipo)}
                            </span>
                            {c.origem === "legado" && <span title="Contrato antigo" className="text-amber-600"><Archive size={12} /></span>}
                          </div>
                          {c.numero_pasta && <p className="text-[11px] text-gray-500 mt-1">Pasta física {c.numero_pasta}</p>}
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.tipo === "venda" ? "Comprador · Vendedor" : "Inquilino · Proprietário"}</p>
                            <p className="font-bold text-gray-800 text-sm truncate">{c.inquilino_nome || "—"}</p>
                            <p className="text-xs text-gray-500 truncate">{c.proprietario_nome || (c.tipo === "venda" ? "Vendedor não informado" : "Proprietário não informado")}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Imóvel</p>
                            <p className="font-bold text-gray-800 text-sm truncate">{imovel}</p>
                            <p className="text-xs text-gray-500 truncate">{endereco || "—"}</p>
                          </div>
                        </div>
                        <div className="md:text-right flex-shrink-0">
                          <p className="font-black text-green-700 text-sm">{formatarMoeda(c.tipo === "venda" ? c.valor_venda : c.valor_aluguel)}</p>
                          <p className="text-[11px] text-gray-500">{formatarData(c.data_inicio)} a {formatarData(c.data_fim)}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Link href={`/admin/locacoes/${c.id}`}
                            className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-bold text-xs transition-all">Detalhes</Link>
                          <Link href={`/admin/locacoes/${c.id}?aba=documentos`}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs transition-all flex items-center gap-1">
                            <Paperclip size={12} /> {c.total_documentos}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {dados.contratos.paginas > 1 && (
              <div className="flex items-center justify-between pt-4 text-sm">
                <span className="text-gray-500 font-medium">Página {dados.contratos.pagina} de {dados.contratos.paginas}</span>
                <div className="flex gap-2">
                  <button disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronLeft size={16} /></button>
                  <button disabled={pagina >= dados.contratos.paginas} onClick={() => setPagina((p) => p + 1)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuscaGlobalPage() {
  return (
    <Suspense>
      <Busca />
    </Suspense>
  );
}
