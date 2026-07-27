"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit, Loader2, FileText, CheckCircle2, Circle,
  Eye, Trash2, Plus, Home, Sparkles, CalendarRange, Layers,
  Pencil, Save, X as XIcon, Paperclip, Upload, Download, File as FileIcon,
} from "lucide-react";
import BoletoView from "@/components/BoletoView";
import GerarBoletosPreviewModal, { ItemPreviewBoleto } from "@/components/GerarBoletosPreviewModal";
import { calcularVencimento, formatarReferencia, listarMesesEntre } from "@/lib/locacoes-datas";

interface Boleto {
  id: number;
  referencia: string;
  valor: number;
  vencimento: string;
  status: string;
  linha_digitavel: string;
  codigo_barras: string;
}

interface Anexo {
  id: number;
  nome_arquivo: string;
  url: string;
  tipo: string;
  tamanho: number;
  criado_em: string;
}

interface Locacao {
  id: number;
  imovel_id: number;
  imovel_titulo: string;
  imovel_endereco: string;
  imovel_cidade: string;
  imovel_bairro: string;
  locatario_nome: string;
  locatario_cpf: string;
  locatario_email: string;
  locatario_telefone: string;
  valor_aluguel: number;
  dia_vencimento: number;
  data_inicio: string;
  data_fim: string;
  status: string;
  observacoes: string;
  boletos: Boleto[];
  anexos: Anexo[];
}

function formatarCpf(cpf: string) {
  const d = (cpf || "").replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatarData(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatarTamanho(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DetalheLocacaoPage() {
  const params = useParams();
  const id = params.id as string;

  const [locacao, setLocacao] = useState<Locacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [boletoAberto, setBoletoAberto] = useState<Boleto | null>(null);

  const [preview, setPreview] = useState<{ titulo: string; itens: ItemPreviewBoleto[] } | null>(null);
  const [mostrarPeriodo, setMostrarPeriodo] = useState(false);
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");

  const [editandoBoletoId, setEditandoBoletoId] = useState<number | null>(null);
  const [edicaoVencimento, setEdicaoVencimento] = useState("");
  const [edicaoValor, setEdicaoValor] = useState("");

  const [enviandoAnexo, setEnviandoAnexo] = useState(false);

  const carregar = useCallback(async () => {
    const res = await fetch(`/api/admin/locacoes/${id}`);
    if (res.ok) setLocacao(await res.json());
  }, [id]);

  useEffect(() => {
    setLoading(true);
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  // ================== GERAÇÃO DE BOLETOS ==================

  const montarItensPreview = useCallback((dataInicioStr: string, dataFimStr: string): ItemPreviewBoleto[] => {
    if (!locacao) return [];
    const inicio = new Date(dataInicioStr);
    const fim = new Date(dataFimStr);
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime()) || inicio > fim) return [];

    const referenciasExistentes = new Set(locacao.boletos.map((b) => b.referencia));
    const meses = listarMesesEntre(inicio, fim);

    return meses.map(({ ano, mesIndex }) => {
      const referencia = formatarReferencia(ano, mesIndex);
      const vencimento = calcularVencimento(ano, mesIndex, locacao.dia_vencimento || 10);
      const jaExiste = referenciasExistentes.has(referencia);
      return {
        referencia,
        vencimento: vencimento.toISOString().slice(0, 10),
        valor: String(locacao.valor_aluguel),
        jaExiste,
        incluir: !jaExiste,
      };
    });
  }, [locacao]);

  const gerarProximoBoleto = async () => {
    if (!locacao) return;
    setGerando(true);
    try {
      const agora = new Date();
      let ano = agora.getFullYear();
      let mesIndex = agora.getMonth();
      if (locacao.boletos.length > 0) {
        const maisRecente = locacao.boletos.reduce((acc, b) => (new Date(b.vencimento) > new Date(acc.vencimento) ? b : acc), locacao.boletos[0]);
        const ultimoVenc = new Date(maisRecente.vencimento);
        ano = ultimoVenc.getFullYear();
        mesIndex = ultimoVenc.getMonth() + 1;
        if (mesIndex > 11) { mesIndex = 0; ano += 1; }
      }
      const referencia = formatarReferencia(ano, mesIndex);
      const vencimento = calcularVencimento(ano, mesIndex, locacao.dia_vencimento || 10).toISOString().slice(0, 10);

      const res = await fetch(`/api/admin/locacoes/${id}/boletos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: [{ referencia, vencimento, valor: locacao.valor_aluguel }] }),
      });
      if (res.ok) {
        await carregar();
      } else {
        const err = await res.json();
        alert("Erro ao gerar boleto: " + (err.error || "Tente novamente"));
      }
    } finally {
      setGerando(false);
    }
  };

  const abrirPreviewContratoInteiro = () => {
    if (!locacao?.data_inicio) {
      alert('Defina a "Data de início" do contrato em Editar Contrato para usar esta opção.');
      return;
    }
    const fim = locacao.data_fim ? String(locacao.data_fim).slice(0, 10) : hojeISO();
    const itens = montarItensPreview(String(locacao.data_inicio).slice(0, 10), fim);
    if (itens.length === 0) {
      alert("Nenhum mês encontrado no período do contrato.");
      return;
    }
    setPreview({ titulo: "Gerar boletos do contrato inteiro", itens });
  };

  const abrirPreviewPeriodo = () => {
    if (!periodoInicio || !periodoFim) {
      alert("Informe as duas datas do período.");
      return;
    }
    const itens = montarItensPreview(periodoInicio, periodoFim);
    if (itens.length === 0) {
      alert("Período inválido: a data final deve ser igual ou posterior à inicial.");
      return;
    }
    setPreview({ titulo: `Gerar boletos de ${formatarData(periodoInicio)} até ${formatarData(periodoFim)}`, itens });
    setMostrarPeriodo(false);
  };

  const confirmarGeracao = async (itens: { referencia: string; vencimento: string; valor: number }[]) => {
    const res = await fetch(`/api/admin/locacoes/${id}/boletos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itens }),
    });
    if (res.ok) {
      const data = await res.json();
      setPreview(null);
      await carregar();
      if (data.ignorados > 0) {
        alert(`${data.criados.length} boleto(s) gerado(s). ${data.ignorados} mês(es) já tinham boleto e foram ignorados.`);
      }
    } else {
      const err = await res.json();
      alert("Erro ao gerar boletos: " + (err.error || "Tente novamente"));
    }
  };

  // ================== AÇÕES SOBRE UM BOLETO ==================

  const alternarStatusBoleto = async (boleto: Boleto) => {
    const novoStatus = boleto.status === "pago" ? "pendente" : "pago";
    const res = await fetch(`/api/admin/locacoes/boletos/${boleto.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    if (res.ok) carregar();
  };

  const excluirBoleto = async (boletoId: number) => {
    if (!confirm("Excluir este boleto?")) return;
    const res = await fetch(`/api/admin/locacoes/boletos/${boletoId}`, { method: "DELETE" });
    if (res.ok) carregar();
  };

  const iniciarEdicaoBoleto = (b: Boleto) => {
    setEditandoBoletoId(b.id);
    setEdicaoVencimento(String(b.vencimento).slice(0, 10));
    setEdicaoValor(String(b.valor));
  };

  const cancelarEdicaoBoleto = () => setEditandoBoletoId(null);

  const salvarEdicaoBoleto = async (b: Boleto) => {
    const res = await fetch(`/api/admin/locacoes/boletos/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: b.status, vencimento: edicaoVencimento, valor: edicaoValor }),
    });
    if (res.ok) {
      setEditandoBoletoId(null);
      carregar();
    } else {
      const err = await res.json();
      alert("Erro ao salvar: " + (err.error || "Tente novamente"));
    }
  };

  // ================== ANEXOS ==================

  const enviarAnexos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setEnviandoAnexo(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("file", f));
      const res = await fetch(`/api/admin/locacoes/${id}/anexos`, { method: "POST", body: formData });
      if (res.ok) {
        await carregar();
      } else {
        const err = await res.json();
        alert("Erro ao enviar anexo: " + (err.error || "Tente novamente"));
      }
    } finally {
      setEnviandoAnexo(false);
    }
  };

  const excluirAnexo = async (anexoId: number) => {
    if (!confirm("Excluir este anexo?")) return;
    const res = await fetch(`/api/admin/locacoes/anexos/${anexoId}`, { method: "DELETE" });
    if (res.ok) carregar();
  };

  if (loading || !locacao) return (
    <div className="text-center py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-green-700" size={40} />
      <p className="text-gray-500 font-bold">Carregando contrato...</p>
    </div>
  );

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 space-y-8">

      <div className="flex items-center justify-between pt-10">
        <div className="flex items-center gap-4">
          <Link href="/admin/locacoes" className="p-3 bg-white hover:bg-gray-100 rounded-2xl shadow-sm text-gray-500 transition-all border border-gray-100">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{locacao.locatario_nome}</h1>
            <p className="text-gray-500 text-sm">Contrato #{locacao.id}</p>
          </div>
        </div>
        <Link
          href={`/admin/locacoes/editar/${locacao.id}`}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg"
        >
          <Edit size={16} /> Editar Contrato
        </Link>
      </div>

      {/* RESUMO DO CONTRATO */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Home size={12} /> Imóvel</p>
          <p className="font-bold text-gray-900">{locacao.imovel_titulo || "—"}</p>
          <p className="text-gray-500 text-sm">{locacao.imovel_endereco}, {locacao.imovel_bairro} — {locacao.imovel_cidade}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p>
          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white ${locacao.status === "ativo" ? "bg-green-600" : "bg-gray-500"}`}>
            {locacao.status}
          </span>
        </div>

        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-gray-100 pt-6">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CPF</p>
            <p className="font-bold text-gray-800 text-sm">{formatarCpf(locacao.locatario_cpf)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contato</p>
            <p className="font-bold text-gray-800 text-sm">{locacao.locatario_telefone || locacao.locatario_email || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor do Aluguel</p>
            <p className="font-black text-green-700 text-sm">{Number(locacao.valor_aluguel).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimento</p>
            <p className="font-bold text-gray-800 text-sm">Todo dia {locacao.dia_vencimento}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Início</p>
            <p className="font-bold text-gray-800 text-sm">{formatarData(locacao.data_inicio)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fim</p>
            <p className="font-bold text-gray-800 text-sm">{formatarData(locacao.data_fim)}</p>
          </div>
        </div>

        {locacao.observacoes && (
          <div className="md:col-span-3 border-t border-gray-100 pt-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Observações</p>
            <p className="text-gray-700 text-sm">{locacao.observacoes}</p>
          </div>
        )}
      </div>

      {/* BOLETOS */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <FileText size={16} className="text-green-600" /> Boletos
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={gerarProximoBoleto}
              disabled={gerando}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md disabled:opacity-60"
            >
              {gerando ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Próximo Boleto
            </button>
            <button
              onClick={abrirPreviewContratoInteiro}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
            >
              <Layers size={14} /> Contrato Inteiro
            </button>
            <button
              onClick={() => setMostrarPeriodo((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border
                ${mostrarPeriodo ? "bg-[#0f2e20] text-white border-[#0f2e20]" : "bg-white border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700"}`}
            >
              <CalendarRange size={14} /> Período Personalizado
            </button>
          </div>
        </div>

        <p className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
          <Sparkles size={13} /> Boletos de demonstração — código de barras e linha digitável são fictícios. Sempre que gerar mais de um boleto, você revisa as datas antes de confirmar.
        </p>

        {mostrarPeriodo && (
          <div className="flex flex-col sm:flex-row items-end gap-3 bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">De</label>
              <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)}
                className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm" />
            </div>
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Até</label>
              <input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)}
                className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm" />
            </div>
            <button onClick={abrirPreviewPeriodo} className="bg-[#0f2e20] hover:bg-black text-white font-bold px-5 py-3 rounded-xl text-sm transition-all w-full sm:w-auto">
              Revisar
            </button>
          </div>
        )}

        {locacao.boletos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-sm font-bold">Nenhum boleto gerado ainda para este contrato.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="py-3 pr-4">Referência</th>
                  <th className="py-3 pr-4">Vencimento</th>
                  <th className="py-3 pr-4">Valor</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {locacao.boletos.map((b) => {
                  const atrasado = b.status === "pendente" && new Date(b.vencimento) < hoje;
                  const editando = editandoBoletoId === b.id;
                  return (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-4 font-bold text-gray-800">Aluguel {b.referencia}</td>
                      <td className="py-3 pr-4 text-gray-600">
                        {editando ? (
                          <input type="date" value={edicaoVencimento} onChange={(e) => setEdicaoVencimento(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-bold" />
                        ) : formatarData(b.vencimento)}
                      </td>
                      <td className="py-3 pr-4 font-bold text-gray-800">
                        {editando ? (
                          <input type="number" step="0.01" value={edicaoValor} onChange={(e) => setEdicaoValor(e.target.value)}
                            className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-bold" />
                        ) : Number(b.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase text-white
                          ${b.status === "pago" ? "bg-green-600" : atrasado ? "bg-red-600" : "bg-yellow-500"}`}>
                          {b.status === "pago" ? "Pago" : atrasado ? "Atrasado" : "Pendente"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-2">
                          {editando ? (
                            <>
                              <button onClick={() => salvarEdicaoBoleto(b)} title="Salvar"
                                className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-all">
                                <Save size={14} />
                              </button>
                              <button onClick={cancelarEdicaoBoleto} title="Cancelar"
                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-all">
                                <XIcon size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setBoletoAberto(b)} title="Ver / Imprimir"
                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all">
                                <Eye size={14} />
                              </button>
                              <button onClick={() => iniciarEdicaoBoleto(b)} title="Editar data/valor"
                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => alternarStatusBoleto(b)} title={b.status === "pago" ? "Marcar como pendente" : "Marcar como pago"}
                                className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-all">
                                {b.status === "pago" ? <Circle size={14} /> : <CheckCircle2 size={14} />}
                              </button>
                              <button onClick={() => excluirBoleto(b.id)} title="Excluir"
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ANEXOS */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Paperclip size={16} className="text-green-600" /> Anexos e Documentos
          </h2>
          <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer
            ${enviandoAnexo ? "bg-gray-100 text-gray-400" : "bg-green-600 hover:bg-green-700 text-white shadow-md"}`}>
            {enviandoAnexo ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
            {enviandoAnexo ? "Enviando..." : "Enviar Arquivo"}
            <input type="file" multiple className="hidden" disabled={enviandoAnexo}
              onChange={(e) => { enviarAnexos(e.target.files); e.target.value = ""; }} />
          </label>
        </div>
        <p className="text-xs text-gray-400 mb-5">Contrato assinado em PDF, comprovantes, documentos do locatário — qualquer arquivo relacionado a esta locação.</p>

        {locacao.anexos.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-sm font-bold">Nenhum anexo enviado ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {locacao.anexos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-green-700 flex-shrink-0 border border-gray-100">
                  <FileIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{a.nome_arquivo}</p>
                  <p className="text-xs text-gray-500">{formatarTamanho(a.tamanho)} · {formatarData(a.criado_em)}</p>
                </div>
                <a href={a.url} target="_blank" rel="noopener noreferrer" title="Abrir/baixar"
                  className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all flex-shrink-0">
                  <Download size={14} />
                </a>
                <button onClick={() => excluirAnexo(a.id)} title="Excluir"
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {boletoAberto && (
        <BoletoView
          referencia={boletoAberto.referencia}
          valor={boletoAberto.valor}
          vencimento={boletoAberto.vencimento}
          status={boletoAberto.status}
          linhaDigitavel={boletoAberto.linha_digitavel}
          codigoBarras={boletoAberto.codigo_barras}
          locatarioNome={locacao.locatario_nome}
          locatarioCpf={locacao.locatario_cpf}
          imovelTitulo={locacao.imovel_titulo}
          imovelEndereco={`${locacao.imovel_endereco}, ${locacao.imovel_bairro} — ${locacao.imovel_cidade}`}
          onFechar={() => setBoletoAberto(null)}
        />
      )}

      {preview && (
        <GerarBoletosPreviewModal
          titulo={preview.titulo}
          itensIniciais={preview.itens}
          onFechar={() => setPreview(null)}
          onConfirmar={confirmarGeracao}
        />
      )}
    </div>
  );
}
