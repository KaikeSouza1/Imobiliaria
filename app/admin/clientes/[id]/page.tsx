"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit, Trash2, Loader2, User, MapPin, Phone, FileText, Home, Paperclip, CheckCircle2, Search,
} from "lucide-react";
import EnvioDocumentos from "@/components/documentos/EnvioDocumentos";
import ItemDocumento, { type DocumentoResumo } from "@/components/documentos/ItemDocumento";
import type { ClienteCarregado } from "@/components/clientes/FormCliente";
import { enderecoCompleto } from "@/lib/clientes";
import { ROTULO_STATUS } from "@/lib/contratos";
import { formatarCpfCnpj, formatarData, formatarMoeda } from "@/lib/texto";

interface ContratoDoCliente {
  id: number;
  codigo: string | null;
  status: string;
  valor_aluguel: number;
  data_inicio: string | null;
  data_fim: string | null;
  papel: "inquilino" | "proprietario";
  inquilino_nome: string | null;
  proprietario_nome: string | null;
  imovel_codigo: string | null;
  imovel_titulo: string | null;
  imovel_endereco: string | null;
}

interface ImovelDoCliente { id: number; codigo: string | null; titulo: string; tipo: string; endereco: string | null; bairro: string | null; cidade: string | null; status: string | null }

interface Painel extends ClienteCarregado {
  criado_em: string;
  contratos: ContratoDoCliente[];
  imoveis: ImovelDoCliente[];
  documentos: DocumentoResumo[];
}

const COR_STATUS: Record<string, string> = { ativo: "bg-green-600", encerrado: "bg-gray-500", rescindido: "bg-red-600" };

function Campo({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{rotulo}</p>
      <p className="font-bold text-gray-800 text-sm mt-0.5 break-words">{valor || "—"}</p>
    </div>
  );
}

function PainelCliente() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const sp = useSearchParams();
  const [c, setC] = useState<Painel | null>(null);
  const [erro, setErro] = useState("");
  const [versao, setVersao] = useState(0);
  const [aviso, setAviso] = useState(sp.get("salvo") === "1" ? "Cliente salvo com sucesso." : "");

  useEffect(() => {
    let ativo = true;
    fetch(`/api/admin/clientes/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!ativo) return;
        if (r.ok) setC(d);
        else setErro(d.error || "Erro ao carregar cliente");
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
    if (!c) return;
    if (!confirm(`Excluir o cadastro de ${c.nome}?\n\nOs dados pessoais serão apagados definitivamente.`)) return;
    const r = await fetch(`/api/admin/clientes/${id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (r.ok) router.push("/admin/clientes");
    else alert(d.error || "Não foi possível excluir.");
  };

  if (erro) return (
    <div className="text-center py-20">
      <p className="text-gray-600 font-bold">{erro}</p>
      <Link href="/admin/clientes" className="text-green-700 font-bold text-sm mt-4 inline-block">Voltar para clientes</Link>
    </div>
  );
  if (!c) return (
    <div className="text-center py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-green-700" size={40} />
      <p className="text-gray-500 font-bold">Carregando cliente...</p>
    </div>
  );

  const endereco = enderecoCompleto(c);

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 space-y-6">
      {aviso && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-2xl px-5 py-3 text-sm font-bold mt-6" role="status">
          <CheckCircle2 size={16} /> {aviso}
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-6">
        <div className="flex items-start gap-4">
          <Link href="/admin/clientes" className="p-3 bg-white hover:bg-gray-100 rounded-2xl shadow-sm text-gray-500 transition-all border border-gray-100">
            <ArrowLeft size={24} />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {c.codigo && <span className="text-xs font-black text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">{c.codigo}</span>}
              {c.eh_inquilino && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-800">Inquilino</span>}
              {c.eh_proprietario && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-800">Proprietário</span>}
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{c.nome}</h1>
            <p className="text-gray-500 text-sm">{[c.cpf_cnpj && formatarCpfCnpj(c.cpf_cnpj), c.telefone, c.email].filter(Boolean).join(" · ") || "Sem documento ou contato"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/busca?cliente_id=${c.id}`} title="Ver na busca global"
            className="px-4 py-3 bg-white border border-gray-200 hover:bg-green-50 text-gray-700 rounded-xl font-bold text-sm flex items-center gap-2"><Search size={16} /></Link>
          <Link href={`/admin/clientes/${c.id}/editar`}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg"><Edit size={16} /> Editar</Link>
          <button onClick={excluir} title="Excluir cadastro" className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold text-sm"><Trash2 size={16} /></button>
        </div>
      </div>

      {/* DADOS PESSOAIS E ENDEREÇO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><User size={16} className="text-green-600" /> Dados pessoais</h2>
          <div className="grid grid-cols-2 gap-5">
            <Campo rotulo={c.cpf_cnpj && c.cpf_cnpj.length === 14 ? "CNPJ" : "CPF"} valor={c.cpf_cnpj && formatarCpfCnpj(c.cpf_cnpj)} />
            <Campo rotulo="RG" valor={c.rg} />
            <Campo rotulo="Nascimento" valor={c.data_nascimento && formatarData(c.data_nascimento)} />
            <Campo rotulo="Estado civil" valor={c.estado_civil} />
            <Campo rotulo="Profissão" valor={c.profissao} />
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><MapPin size={16} className="text-green-600" /> Contato e endereço</h2>
          <div className="grid grid-cols-2 gap-5">
            <Campo rotulo="Telefone" valor={c.telefone && <span className="flex items-center gap-1"><Phone size={12} /> {c.telefone}</span>} />
            <Campo rotulo="E-mail" valor={c.email} />
            <div className="col-span-2"><Campo rotulo="Endereço" valor={endereco} /></div>
          </div>
          {c.observacoes && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Observações</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{c.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* CONTRATOS */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <FileText size={16} className="text-green-600" /> Contratos ({c.contratos.length})
        </h2>
        {c.contratos.length === 0 ? (
          <p className="text-sm text-gray-400 font-medium bg-gray-50 rounded-xl px-4 py-6 text-center">Nenhum contrato vinculado.</p>
        ) : (
          <div className="space-y-2">
            {c.contratos.map((k) => (
              <Link key={k.id} href={`/admin/locacoes/${k.id}`}
                className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 bg-gray-50 hover:bg-green-50 rounded-xl px-4 py-3 transition-colors">
                <div className="md:w-36 flex items-center gap-2">
                  <span className="font-black text-gray-900 text-sm">{k.codigo || `#${k.id}`}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white ${COR_STATUS[k.status] ?? "bg-gray-500"}`}>
                    {ROTULO_STATUS[k.status as keyof typeof ROTULO_STATUS] ?? k.status}
                  </span>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg w-fit ${k.papel === "inquilino" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                  {k.papel === "inquilino" ? `Inquilino · prop. ${k.proprietario_nome || "—"}` : `Proprietário · inq. ${k.inquilino_nome || "—"}`}
                </span>
                <span className="flex-1 text-xs text-gray-600 truncate">
                  {[k.imovel_codigo && `#${k.imovel_codigo}`, k.imovel_titulo, k.imovel_endereco].filter(Boolean).join(" — ")}
                </span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{formatarData(k.data_inicio)} a {formatarData(k.data_fim)}</span>
                <span className="text-sm font-black text-green-700 whitespace-nowrap">{formatarMoeda(k.valor_aluguel)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* IMÓVEIS (proprietário) */}
      {(c.eh_proprietario || c.imoveis.length > 0) && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Home size={16} className="text-green-600" /> Imóveis deste proprietário ({c.imoveis.length})
          </h2>
          {c.imoveis.length === 0 ? (
            <p className="text-sm text-gray-400 font-medium bg-gray-50 rounded-xl px-4 py-6 text-center">
              Nenhum imóvel do site vinculado. O vínculo é feito automaticamente ao cadastrar um contrato com este proprietário.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {c.imoveis.map((i) => (
                <Link key={i.id} href={`/admin/busca?imovel_id=${i.id}`} className="bg-gray-50 hover:bg-green-50 rounded-xl px-4 py-3 transition-colors">
                  <p className="font-bold text-sm text-gray-900 truncate">{i.codigo ? `#${i.codigo} — ` : ""}{i.titulo}</p>
                  <p className="text-xs text-gray-500 truncate">{[i.endereco, i.bairro, i.cidade].filter(Boolean).join(", ")}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DOCUMENTOS PESSOAIS */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Paperclip size={16} className="text-green-600" /> Documentos pessoais ({c.documentos.length})
        </h2>
        <div className="mb-5">
          <EnvioDocumentos vinculo={{ cliente_id: c.id }} tipoInicial="documento_pessoal" onConcluido={() => setVersao((v) => v + 1)} />
        </div>
        {c.documentos.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-600 font-bold">Nenhum documento pessoal anexado.</p>
            <p className="text-gray-400 text-sm mt-1">RG, CPF, comprovante de renda ou de residência, em PDF.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {c.documentos.map((d) => <ItemDocumento key={d.id} doc={d} onExcluido={() => setVersao((v) => v + 1)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PainelClientePage() {
  return (
    <Suspense>
      <PainelCliente />
    </Suspense>
  );
}
