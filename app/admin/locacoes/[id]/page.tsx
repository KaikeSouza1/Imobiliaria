"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit, Loader2, Home, User, KeyRound, CalendarClock, CalendarRange,
  Briefcase, Building2, FileText, Paperclip, CheckCircle2, Trash2, Archive, Phone,
} from "lucide-react";
import EnvioDocumentos from "@/components/documentos/EnvioDocumentos";
import ItemDocumento from "@/components/documentos/ItemDocumento";
import { ROTULO_STATUS, type StatusContrato } from "@/lib/contratos";
import { formatarData, formatarMoeda, mesesEntre, descreverPrazo, formatarCpfCnpj } from "@/lib/texto";

interface Documento {
  id: number;
  tipo: string;
  nome_original: string;
  tamanho: number;
  incluido_por: string;
  incluido_em: string;
}

interface Contrato {
  id: number;
  codigo: string | null;
  status: StatusContrato;
  origem: "sistema" | "legado";
  valor_aluguel: number;
  dia_vencimento: number;
  data_inicio: string | null;
  data_fim: string | null;
  data_entrega_chaves: string | null;
  periodo_reajuste_meses: number;
  proximo_reajuste_calculado: string | null;
  finalidade: string | null;
  numero_pasta: string | null;
  observacoes: string | null;
  corretor_responsavel: string | null;
  corretor_nome: string | null;
  imovel_id: number | null;
  imovel_codigo: string | null;
  imovel_titulo: string | null;
  imovel_tipo: string | null;
  imovel_endereco: string | null;
  imovel_bairro: string | null;
  imovel_cidade: string | null;
  imovel_codigo_legado: string | null;
  imovel_endereco_legado: string | null;
  locatario_nome: string | null;
  locatario_cpf: string | null;
  locatario_telefone: string | null;
  locatario_email: string | null;
  inq_nome: string | null;
  inq_codigo: string | null;
  inq_cpf_cnpj: string | null;
  inq_telefone: string | null;
  inq_email: string | null;
  prop_nome: string | null;
  prop_codigo: string | null;
  prop_cpf_cnpj: string | null;
  prop_telefone: string | null;
  prop_email: string | null;
  documentos: Documento[];
}

const COR_STATUS: Record<string, string> = {
  ativo: "bg-green-600",
  encerrado: "bg-gray-500",
  rescindido: "bg-red-600",
};

function Campo({ rotulo, valor, icone: Icone }: { rotulo: string; valor: React.ReactNode; icone?: React.ElementType }) {
  return (
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
        {Icone && <Icone size={12} />} {rotulo}
      </p>
      <p className="font-bold text-gray-800 text-sm mt-0.5">{valor || "—"}</p>
    </div>
  );
}

function CartaoPessoa({ titulo, nome, codigo, documento, telefone, email }: {
  titulo: string; nome: string | null; codigo: string | null; documento: string | null; telefone: string | null; email: string | null;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 space-y-1">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><User size={12} /> {titulo}</p>
      {nome ? (
        <>
          <p className="font-bold text-gray-900">{nome}</p>
          <p className="text-xs text-gray-500">{[codigo, documento ? formatarCpfCnpj(documento) : null].filter(Boolean).join(" · ")}</p>
          {(telefone || email) && (
            <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={11} /> {[telefone, email].filter(Boolean).join(" · ")}</p>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400 font-medium">Não informado</p>
      )}
    </div>
  );
}

function DetalheContrato() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const parametros = useSearchParams();
  const salvo = parametros.get("salvo") === "1";

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [erro, setErro] = useState("");
  const [versao, setVersao] = useState(0); // muda para recarregar após anexar/excluir
  const [aba, setAba] = useState<"dados" | "documentos">(parametros.get("aba") === "documentos" ? "documentos" : "dados");
  const [aviso, setAviso] = useState(salvo ? "Contrato salvo com sucesso." : "");

  useEffect(() => {
    let ativo = true;
    fetch(`/api/admin/locacoes/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!ativo) return;
        if (res.ok) setContrato(data);
        else setErro(data.error || "Erro ao carregar contrato");
      })
      .catch(() => ativo && setErro("Erro de conexão com o servidor."));
    return () => { ativo = false; };
  }, [id, versao]);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const excluir = async () => {
    if (!contrato) return;
    if (!confirm(`Excluir o contrato ${contrato.codigo ?? ""}? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/admin/locacoes/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) router.push("/admin/locacoes");
    else alert(data.error || "Erro ao excluir contrato.");
  };

  if (erro) return (
    <div className="text-center py-20">
      <p className="text-gray-600 font-bold">{erro}</p>
      <Link href="/admin/locacoes" className="text-green-700 font-bold text-sm mt-4 inline-block">Voltar para contratos</Link>
    </div>
  );

  if (!contrato) return (
    <div className="text-center py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-green-700" size={40} />
      <p className="text-gray-500 font-bold">Carregando contrato...</p>
    </div>
  );

  const c = contrato;
  const inquilinoNome = c.inq_nome || c.locatario_nome;
  const imovelDescricao = c.imovel_id
    ? `${c.imovel_codigo ? `#${c.imovel_codigo} — ` : ""}${c.imovel_titulo ?? ""}`
    : c.imovel_codigo_legado ? `#${c.imovel_codigo_legado}` : "Imóvel não informado";
  const enderecoCompleto = c.imovel_id
    ? [c.imovel_endereco, c.imovel_bairro, c.imovel_cidade].filter(Boolean).join(", ")
    : c.imovel_endereco_legado;
  const prazoMeses = mesesEntre(c.data_inicio, c.data_fim);

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 space-y-6">

      {aviso && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-2xl px-5 py-3 text-sm font-bold mt-6" role="status">
          <CheckCircle2 size={16} /> {aviso}
        </div>
      )}

      {/* CABEÇALHO: código, inquilino, imóvel, status, endereço */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-6">
        <div className="flex items-start gap-4">
          <Link href="/admin/locacoes" className="p-3 bg-white hover:bg-gray-100 rounded-2xl shadow-sm text-gray-500 transition-all border border-gray-100">
            <ArrowLeft size={24} />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                {c.codigo || `#${c.id}`}
              </span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase text-white ${COR_STATUS[c.status] ?? "bg-gray-500"}`}>
                {ROTULO_STATUS[c.status] ?? c.status}
              </span>
              {c.origem === "legado" && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Archive size={11} /> Contrato antigo
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{inquilinoNome}</h1>
            <p className="text-gray-700 text-sm font-bold flex items-center gap-1"><Home size={14} /> {imovelDescricao}</p>
            <p className="text-gray-500 text-sm">{enderecoCompleto || "Endereço não informado"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/locacoes/editar/${c.id}`}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg">
            <Edit size={16} /> Editar
          </Link>
          <button onClick={excluir} title="Excluir contrato"
            className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold text-sm transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex gap-2 border-b border-gray-200">
        {([["dados", "Dados do Contrato", FileText], ["documentos", `Documentos (${c.documentos.length})`, Paperclip]] as const).map(([v, r, I]) => (
          <button key={v} onClick={() => setAba(v)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-all
              ${aba === v ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <I size={16} /> {r}
          </button>
        ))}
      </div>

      {aba === "dados" ? (
        <div className="space-y-6">
          {/* PRAZOS */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Prazos</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Campo rotulo="Tempo total" valor={descreverPrazo(prazoMeses)} icone={CalendarRange} />
              <Campo rotulo="Início" valor={formatarData(c.data_inicio)} />
              <Campo rotulo="Término" valor={formatarData(c.data_fim)} />
              <Campo rotulo="Entrega das chaves" valor={formatarData(c.data_entrega_chaves)} icone={KeyRound} />
              <Campo rotulo="Reajuste" valor={`A cada ${c.periodo_reajuste_meses} ${c.periodo_reajuste_meses === 1 ? "mês" : "meses"}`} icone={CalendarClock} />
              <Campo rotulo="Próximo reajuste" valor={formatarData(c.proximo_reajuste_calculado)} />
              <Campo rotulo="Valor do aluguel" valor={<span className="text-green-700 font-black">{formatarMoeda(c.valor_aluguel)}</span>} />
              <Campo rotulo="Vencimento" valor={`Todo dia ${c.dia_vencimento}`} />
            </div>
          </div>

          {/* RESPONSÁVEIS E IMÓVEL */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Responsável e imóvel</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Campo rotulo="Corretor responsável" valor={c.corretor_nome || c.corretor_responsavel} icone={Briefcase} />
              <Campo rotulo="Finalidade" valor={c.finalidade ? c.finalidade[0].toUpperCase() + c.finalidade.slice(1) : null} icone={Building2} />
              <Campo rotulo="Tipo do imóvel" valor={c.imovel_tipo} />
              <Campo rotulo="Pasta física" valor={c.numero_pasta} icone={Archive} />
            </div>
          </div>

          {/* PARTES */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Partes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CartaoPessoa titulo="Inquilino" nome={inquilinoNome} codigo={c.inq_codigo}
                documento={c.inq_cpf_cnpj || c.locatario_cpf} telefone={c.inq_telefone || c.locatario_telefone} email={c.inq_email || c.locatario_email} />
              <CartaoPessoa titulo="Proprietário" nome={c.prop_nome} codigo={c.prop_codigo}
                documento={c.prop_cpf_cnpj} telefone={c.prop_telefone} email={c.prop_email} />
            </div>
          </div>

          {c.observacoes && (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Observações</h2>
              <p className="text-gray-700 text-sm whitespace-pre-line">{c.observacoes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Paperclip size={16} className="text-green-600" /> Documentos do contrato
          </h2>
          <div className="mb-6">
            <EnvioDocumentos vinculo={{ locacao_id: c.id }} onConcluido={() => setVersao((v) => v + 1)} />
          </div>

          {c.documentos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Paperclip className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-gray-600 font-bold">Nenhum documento anexado a este contrato.</p>
              <p className="text-gray-400 text-sm mt-1">Use &quot;Anexar PDF&quot; acima para incluir o contrato assinado, vistorias ou comprovantes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {c.documentos.map((d) => (
                <ItemDocumento key={d.id} doc={d} onExcluido={() => setVersao((v) => v + 1)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DetalheContratoPage() {
  return (
    <Suspense>
      <DetalheContrato />
    </Suspense>
  );
}
