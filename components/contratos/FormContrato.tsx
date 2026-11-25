"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Search, X, Home, AlertCircle, Archive, User, Hash, CalendarRange } from "lucide-react";
import SeletorCliente, { type ValorCliente } from "./SeletorCliente";
import { STATUS_CONTRATO, ROTULO_STATUS, finalidadePorTipo } from "@/lib/contratos";
import { normalizarBusca } from "@/lib/texto";

interface ImovelOpcao {
  id: number;
  titulo: string;
  codigo: string | null;
  tipo: string;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  preco: number;
  proprietario_id: number | null;
}

// Dados do contrato como vêm de GET /api/admin/locacoes/[id]
export interface ContratoCarregado {
  id: number;
  codigo: string | null;
  origem: "sistema" | "legado";
  status: string;
  imovel_id: number | null;
  imovel_codigo_legado: string | null;
  imovel_endereco_legado: string | null;
  inq_id: number | null;
  inq_nome: string | null;
  inq_codigo: string | null;
  prop_id: number | null;
  prop_nome: string | null;
  prop_codigo: string | null;
  locatario_nome: string | null;
  locatario_cpf: string | null;
  locatario_email: string | null;
  locatario_telefone: string | null;
  valor_aluguel: number | string;
  dia_vencimento: number;
  data_inicio: string | null;
  data_fim: string | null;
  data_entrega_chaves: string | null;
  periodo_reajuste_meses: number;
  corretor_responsavel: string | null;
  finalidade: string | null;
  numero_pasta: string | null;
  observacoes: string | null;
}

// Mesmo padrão visual dos filtros da listagem: cartões compactos e campos de altura média.
const CLASSE_CARD = "bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4";
const CLASSE_TITULO = "text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2";
const CLASSE_INPUT = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-green-500 focus:bg-white transition-all";
const CLASSE_LABEL = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block";

const dataCurta = (v: string | null | undefined) => (v ? String(v).slice(0, 10) : "");

function clienteInicial(id: number | null, nome: string | null, codigo: string | null): ValorCliente {
  return id && nome ? { modo: "existente", id, nome, codigo: codigo || undefined } : null;
}

export default function FormContrato({ contrato, legadoInicial }: { contrato?: ContratoCarregado; legadoInicial?: boolean }) {
  const router = useRouter();
  const editando = !!contrato;

  const [imoveis, setImoveis] = useState<ImovelOpcao[]>([]);
  const [corretores, setCorretores] = useState<{ username: string; nome: string }[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);

  const [origem, setOrigem] = useState<"sistema" | "legado">(contrato?.origem ?? (legadoInicial ? "legado" : "sistema"));
  const [imovelForaDoSite, setImovelForaDoSite] = useState(
    !!contrato && !contrato.imovel_id && !!(contrato.imovel_codigo_legado || contrato.imovel_endereco_legado)
  );
  const [buscaImovel, setBuscaImovel] = useState("");

  const [inquilino, setInquilino] = useState<ValorCliente>(() => {
    if (!contrato) return null;
    const existente = clienteInicial(contrato.inq_id, contrato.inq_nome, contrato.inq_codigo);
    if (existente) return existente;
    // Contrato anterior ao módulo: só tem os campos locatario_*. Ao salvar, vira um cliente.
    return contrato.locatario_nome
      ? { modo: "novo", nome: contrato.locatario_nome, cpf_cnpj: contrato.locatario_cpf || "", telefone: contrato.locatario_telefone || "", email: contrato.locatario_email || "" }
      : null;
  });
  const [proprietario, setProprietario] = useState<ValorCliente>(() =>
    contrato ? clienteInicial(contrato.prop_id, contrato.prop_nome, contrato.prop_codigo) : null
  );

  const [form, setForm] = useState({
    codigo: contrato?.codigo ?? "",
    status: contrato?.status ?? "ativo",
    imovel_id: contrato?.imovel_id ? String(contrato.imovel_id) : "",
    imovel_codigo_legado: contrato?.imovel_codigo_legado ?? "",
    imovel_endereco_legado: contrato?.imovel_endereco_legado ?? "",
    valor_aluguel: contrato ? String(contrato.valor_aluguel ?? "") : "",
    dia_vencimento: String(contrato?.dia_vencimento ?? 10),
    data_inicio: dataCurta(contrato?.data_inicio),
    data_fim: dataCurta(contrato?.data_fim),
    data_entrega_chaves: dataCurta(contrato?.data_entrega_chaves),
    periodo_reajuste_meses: String(contrato?.periodo_reajuste_meses ?? 12),
    corretor_responsavel: contrato?.corretor_responsavel ?? "",
    finalidade: contrato?.finalidade ?? "",
    numero_pasta: contrato?.numero_pasta ?? "",
    observacoes: contrato?.observacoes ?? "",
  });

  useEffect(() => {
    fetch("/api/imoveis").then((r) => r.json()).then((d) => setImoveis(Array.isArray(d) ? d : []));
    fetch("/api/admin/locacoes/opcoes").then((r) => r.json()).then((d) => setCorretores(d.corretores || []));
  }, []);

  const set = (campo: keyof typeof form, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));
  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    set(e.target.name as keyof typeof form, e.target.value);

  const imovelSelecionado = imoveis.find((i) => String(i.id) === form.imovel_id);

  const imoveisFiltrados = useMemo(() => {
    const t = normalizarBusca(buscaImovel);
    if (t.length < 2) return [];
    return imoveis
      .filter((i) => normalizarBusca(`${i.codigo} ${i.titulo} ${i.endereco} ${i.bairro} ${i.cidade}`).includes(t))
      .slice(0, 8);
  }, [imoveis, buscaImovel]);

  const escolherImovel = async (im: ImovelOpcao) => {
    setBuscaImovel("");
    setForm((f) => ({
      ...f,
      imovel_id: String(im.id),
      finalidade: f.finalidade || finalidadePorTipo(im.tipo),
      valor_aluguel: f.valor_aluguel || (im.preco ? String(im.preco) : ""),
    }));
    // Se o imóvel já tem proprietário cadastrado, já sugere no contrato.
    if (!proprietario && im.proprietario_id) {
      const r = await fetch(`/api/admin/clientes/sugestoes?id=${im.proprietario_id}`);
      if (r.ok) {
        const c = await r.json();
        setProprietario({ modo: "existente", id: c.id, nome: c.nome, documento: c.documento, codigo: c.codigo || undefined });
      }
    }
  };

  const montarCliente = (v: ValorCliente, chaveId: string, chaveNovo: string) =>
    v?.modo === "existente"
      ? { [chaveId]: v.id }
      : v?.modo === "novo"
        ? { [chaveNovo]: { nome: v.nome, cpf_cnpj: v.cpf_cnpj, telefone: v.telefone, email: v.email } }
        : {};

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErros([]);
    setSalvando(true);
    try {
      const corpo = {
        ...form,
        origem,
        imovel_id: imovelForaDoSite ? "" : form.imovel_id,
        imovel_codigo_legado: imovelForaDoSite ? form.imovel_codigo_legado : "",
        imovel_endereco_legado: imovelForaDoSite ? form.imovel_endereco_legado : "",
        ...montarCliente(inquilino, "inquilino_id", "novo_inquilino"),
        ...montarCliente(proprietario, "proprietario_id", "novo_proprietario"),
      };
      const res = await fetch(editando ? `/api/admin/locacoes/${contrato!.id}` : "/api/admin/locacoes", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErros(data.erros || [data.error || "Não foi possível salvar. Tente novamente."]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      router.push(`/admin/locacoes/${editando ? contrato!.id : data.id}?salvo=1`);
    } catch {
      setErros(["Erro de conexão com o servidor."]);
    } finally {
      setSalvando(false);
    }
  };

  const legado = origem === "legado";
  const voltar = editando ? `/admin/locacoes/${contrato!.id}` : "/admin/locacoes";

  return (
    <form onSubmit={salvar} noValidate className="max-w-6xl mx-auto pb-28 space-y-6">
      {/* CABEÇALHO: título à esquerda, tipo de contrato e ações à direita */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={voltar} className="p-2.5 bg-white hover:bg-gray-100 rounded-xl shadow-sm text-gray-500 transition-all border border-gray-100">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              {editando ? `Editar contrato ${contrato!.codigo ?? ""}` : legado ? "Cadastrar contrato antigo" : "Novo contrato"}
            </h1>
            <p className="text-gray-500 text-sm">
              {legado
                ? "Só código, inquilino e imóvel são obrigatórios. O PDF pode ser anexado depois."
                : "Campos com * são obrigatórios."}
            </p>
          </div>
        </div>
        {!editando && (
          <div className="inline-flex bg-gray-100 p-1 rounded-xl self-start lg:self-auto">
            {(["sistema", "legado"] as const).map((o) => (
              <button key={o} type="button" onClick={() => setOrigem(o)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2
                  ${origem === o ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {o === "sistema" ? <><Save size={14} /> Contrato novo</> : <><Archive size={14} /> Contrato antigo</>}
              </button>
            ))}
          </div>
        )}
      </div>

      {erros.length > 0 && (
        <div className="flex gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-medium" role="alert">
          <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          <ul className="space-y-1">{erros.map((er) => <li key={er}>{er}</li>)}</ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUNA PRINCIPAL: imóvel e partes */}
        <div className="lg:col-span-2 space-y-6">
          <div className={CLASSE_CARD}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className={CLASSE_TITULO}><Home size={14} className="text-green-600" /> Imóvel{!legado ? " *" : ""}</h2>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 cursor-pointer">
                <input type="checkbox" checked={imovelForaDoSite} onChange={(e) => setImovelForaDoSite(e.target.checked)} className="rounded" />
                Não está cadastrado no site
              </label>
            </div>

            {imovelForaDoSite ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={CLASSE_LABEL}>Código do imóvel</label>
                  <input name="imovel_codigo_legado" value={form.imovel_codigo_legado} onChange={handle} className={CLASSE_INPUT} />
                </div>
                <div className="md:col-span-2">
                  <label className={CLASSE_LABEL}>Endereço</label>
                  <input name="imovel_endereco_legado" value={form.imovel_endereco_legado} onChange={handle} className={CLASSE_INPUT}
                    placeholder="Rua, número, bairro, cidade" />
                </div>
                {!legado && (
                  <p className="md:col-span-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Contrato novo precisa de um imóvel cadastrado. Use esta opção só para contratos antigos.
                  </p>
                )}
              </div>
            ) : imovelSelecionado ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-green-700 border border-green-100"><Home size={16} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{imovelSelecionado.codigo ? `#${imovelSelecionado.codigo} — ` : ""}{imovelSelecionado.titulo}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {[imovelSelecionado.endereco, imovelSelecionado.bairro, imovelSelecionado.cidade].filter(Boolean).join(", ")}
                  </p>
                </div>
                <button type="button" onClick={() => set("imovel_id", "")}
                  className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Trocar</button>
              </div>
            ) : (
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={buscaImovel} onChange={(e) => setBuscaImovel(e.target.value)} className={`${CLASSE_INPUT} pl-9`}
                  placeholder={imoveis.length ? "Buscar por código, título ou endereço..." : "Carregando imóveis..."} />
                {buscaImovel && (
                  <button type="button" onClick={() => setBuscaImovel("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>
                )}
                {buscaImovel.trim().length >= 2 && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                    {imoveisFiltrados.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">Nenhum imóvel encontrado.</p>}
                    {imoveisFiltrados.map((im) => (
                      <button key={im.id} type="button" onClick={() => escolherImovel(im)}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-50">
                        <p className="font-bold text-sm text-gray-900">{im.codigo ? `#${im.codigo} — ` : ""}{im.titulo}</p>
                        <p className="text-xs text-gray-500">{[im.endereco, im.bairro, im.cidade].filter(Boolean).join(", ")}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <span className={`${CLASSE_LABEL} mb-0`}>Finalidade</span>
              <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                {[["", "Não informada"], ["residencial", "Residencial"], ["comercial", "Comercial"]].map(([v, r]) => (
                  <button key={v} type="button" onClick={() => set("finalidade", v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                      ${form.finalidade === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className={CLASSE_CARD}>
              <h2 className={CLASSE_TITULO}><User size={14} className="text-green-600" /> Inquilino *</h2>
              <SeletorCliente papel="inquilino" valor={inquilino} onChange={setInquilino} obrigatorio />
            </div>
            <div className={CLASSE_CARD}>
              <h2 className={CLASSE_TITULO}><User size={14} className="text-orange-500" /> Proprietário</h2>
              <SeletorCliente papel="proprietario" valor={proprietario} onChange={setProprietario} />
            </div>
          </div>

          <div className={CLASSE_CARD}>
            <h2 className={CLASSE_TITULO}>Observações</h2>
            <textarea name="observacoes" rows={3} value={form.observacoes} onChange={handle}
              className={`${CLASSE_INPUT} font-medium`} placeholder="Detalhes adicionais do contrato..." />
          </div>
        </div>

        {/* COLUNA LATERAL: identificação, prazos e valores */}
        <div className="space-y-6">
          <div className={CLASSE_CARD}>
            <h2 className={CLASSE_TITULO}><Hash size={14} className="text-green-600" /> Identificação</h2>
            <div>
              <label className={CLASSE_LABEL}>Código do contrato{legado ? " *" : ""}</label>
              <input name="codigo" value={form.codigo} onChange={handle} className={CLASSE_INPUT}
                placeholder={legado ? "Como está na lista" : "Automático se vazio"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={CLASSE_LABEL}>Status</label>
                <select name="status" value={form.status} onChange={handle} className={CLASSE_INPUT}>
                  {STATUS_CONTRATO.map((s) => <option key={s} value={s}>{ROTULO_STATUS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className={CLASSE_LABEL}>Pasta física</label>
                <input name="numero_pasta" value={form.numero_pasta} onChange={handle} className={CLASSE_INPUT} placeholder="Ex: 12" />
              </div>
            </div>
            <div>
              <label className={CLASSE_LABEL}>Corretor responsável</label>
              <select name="corretor_responsavel" value={form.corretor_responsavel} onChange={handle} className={CLASSE_INPUT}>
                <option value="">Não definido</option>
                {corretores.map((c) => <option key={c.username} value={c.username}>{c.nome}</option>)}
                {form.corretor_responsavel && !corretores.some((c) => c.username === form.corretor_responsavel) && (
                  <option value={form.corretor_responsavel}>{form.corretor_responsavel}</option>
                )}
              </select>
            </div>
          </div>

          <div className={CLASSE_CARD}>
            <h2 className={CLASSE_TITULO}><CalendarRange size={14} className="text-green-600" /> Prazos e valores</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={CLASSE_LABEL}>Valor do aluguel (R$){!legado ? " *" : ""}</label>
                <input name="valor_aluguel" type="number" step="0.01" min="0" value={form.valor_aluguel} onChange={handle} className={CLASSE_INPUT} placeholder="0,00" />
              </div>
              <div>
                <label className={CLASSE_LABEL}>Início{!legado ? " *" : ""}</label>
                <input name="data_inicio" type="date" value={form.data_inicio} onChange={handle} className={CLASSE_INPUT} />
              </div>
              <div>
                <label className={CLASSE_LABEL}>Término</label>
                <input name="data_fim" type="date" value={form.data_fim} onChange={handle} className={CLASSE_INPUT} />
              </div>
              <div>
                <label className={CLASSE_LABEL}>Entrega das chaves</label>
                <input name="data_entrega_chaves" type="date" value={form.data_entrega_chaves} onChange={handle} className={CLASSE_INPUT} />
              </div>
              <div>
                <label className={CLASSE_LABEL}>Vencimento (dia)</label>
                <input name="dia_vencimento" type="number" min="1" max="31" value={form.dia_vencimento} onChange={handle} className={CLASSE_INPUT} />
              </div>
              <div className="col-span-2">
                <label className={CLASSE_LABEL}>Reajuste a cada (meses)</label>
                <input name="periodo_reajuste_meses" type="number" min="1" max="120" value={form.periodo_reajuste_meses} onChange={handle} className={CLASSE_INPUT} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE AÇÕES FIXA NO RODAPÉ (área de conteúdo, ao lado do menu) */}
      <div className="fixed bottom-0 left-72 right-0 z-10 bg-white/90 backdrop-blur border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-10 py-3 flex items-center justify-end gap-3">
          <Link href={voltar} className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-all">Cancelar</Link>
          <button type="submit" disabled={salvando}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all disabled:opacity-60">
            {salvando ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} {editando ? "Salvar alterações" : "Cadastrar contrato"}
          </button>
        </div>
      </div>
    </form>
  );
}
