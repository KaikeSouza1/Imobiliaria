"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, FileSignature, Key, Bell, Gavel, Building2, Handshake, ChevronRight } from "lucide-react";
import FormModelo from "@/components/modelos/FormModelo";
import SeletorCliente, { type ValorCliente } from "@/components/contratos/SeletorCliente";
import SeletorContrato, { type ContratoOpcao } from "@/components/contratos/SeletorContrato";
import type { ResumoModelo } from "@/lib/modelos";

const ICONES: Record<string, React.ElementType> = {
  contrato_locacao: FileSignature,
  termo_entrega_chaves: Key,
  notificacao_falta_pagamento: Bell,
  notificacao_extrajudicial: Gavel,
  administracao_locacao: Building2,
  intermediacao_venda: Handshake,
};

function Gerar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [modelos, setModelos] = useState<ResumoModelo[] | null>(null);
  const [erro, setErro] = useState("");

  const modeloId = sp.get("modelo");
  const locacaoId = Number(sp.get("locacao_id")) || undefined;
  const clienteId = Number(sp.get("cliente_id")) || undefined;
  const imovelId = Number(sp.get("imovel_id")) || undefined;
  const documentoId = Number(sp.get("documento_id")) || undefined;

  const [contrato, setContrato] = useState<ContratoOpcao | null>(null);
  const [proprietario, setProprietario] = useState<ValorCliente>(null);

  useEffect(() => {
    fetch("/api/admin/modelos")
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setModelos(d) : setErro(d.error || "Erro ao carregar modelos")))
      .catch(() => setErro("Erro de conexão com o servidor."));
  }, []);

  const modelo = modelos?.find((m) => m.id === modeloId);
  const ir = (params: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && p.set(k, String(v)));
    router.push(`/admin/documentos/gerar?${p}`);
  };
  const contexto = { locacao_id: locacaoId, cliente_id: clienteId, imovel_id: imovelId, documento_id: documentoId };

  if (erro) return <p className="text-center py-20 text-gray-600 font-bold">{erro}</p>;
  if (!modelos) return (
    <div className="text-center py-20 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-green-700" size={40} /></div>
  );

  // Passo 1: escolher o modelo
  if (!modelo) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/documentos" className="p-2.5 bg-white hover:bg-gray-100 rounded-xl shadow-sm text-gray-500 border border-gray-100"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Gerar documento</h1>
            <p className="text-gray-500 text-sm">Escolha o modelo. O PDF fica guardado no contrato ou no cadastro da pessoa.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modelos.map((m) => {
            const Icone = ICONES[m.id] ?? FileText;
            return (
              <button key={m.id} onClick={() => ir({ modelo: m.id, ...contexto })}
                className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:border-green-300 transition-all group">
                <div className="w-11 h-11 rounded-xl bg-green-50 text-green-700 flex items-center justify-center mb-3 group-hover:bg-green-100"><Icone size={22} /></div>
                <p className="font-black text-gray-900">{m.titulo}</p>
                <p className="text-xs text-gray-500 mt-1">{m.descricao}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mt-3 flex items-center gap-1">
                  {m.vinculo === "locacao" ? "A partir de um contrato" : "A partir de um proprietário"} <ChevronRight size={12} />
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Passo 2: escolher o contrato / proprietário (se ainda não veio na URL)
  const precisaContrato = modelo.vinculo === "locacao" && !locacaoId;
  const precisaProprietario = modelo.vinculo === "proprietario" && !clienteId;
  const voltarPara = locacaoId ? `/admin/locacoes/${locacaoId}?aba=documentos` : clienteId ? `/admin/clientes/${clienteId}` : "/admin/documentos";

  if (precisaContrato || precisaProprietario) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => ir({})} className="p-2.5 bg-white hover:bg-gray-100 rounded-xl shadow-sm text-gray-500 border border-gray-100"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{modelo.titulo}</h1>
            <p className="text-gray-500 text-sm">{precisaContrato ? "De qual contrato é este documento?" : "Para qual proprietário?"}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          {precisaContrato ? (
            <SeletorContrato autoFoco onEscolher={(c) => { setContrato(c); ir({ modelo: modelo.id, locacao_id: c.id }); }} />
          ) : (
            <SeletorCliente papel="proprietario" valor={proprietario}
              onChange={(v) => { setProprietario(v); if (v?.modo === "existente") ir({ modelo: modelo.id, cliente_id: v.id }); }} />
          )}
          {contrato && <p className="text-xs text-gray-400">Abrindo {contrato.codigo}...</p>}
        </div>
      </div>
    );
  }

  // Passo 3: formulário
  const origem: Record<string, string> = {};
  if (locacaoId) origem.locacao_id = String(locacaoId);
  if (clienteId) origem.cliente_id = String(clienteId);
  if (imovelId) origem.imovel_id = String(imovelId);
  if (documentoId) origem.documento_id = String(documentoId);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href={voltarPara} className="p-2.5 bg-white hover:bg-gray-100 rounded-xl shadow-sm text-gray-500 border border-gray-100"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">{modelo.titulo}</h1>
          <p className="text-gray-500 text-sm">Preencha os campos, confira a prévia e salve. Campos com * são obrigatórios.</p>
        </div>
      </div>
      <FormModelo
        key={`${modelo.id}-${locacaoId}-${clienteId}-${documentoId}`}
        modelo={modelo}
        origem={origem}
        destino={{ locacao_id: locacaoId, cliente_id: clienteId, imovel_id: imovelId }}
        onCancelar={() => router.push(voltarPara)}
        onSalvo={() => router.push(locacaoId ? `/admin/locacoes/${locacaoId}?aba=documentos&gerado=1` : `/admin/clientes/${clienteId}?gerado=1`)}
      />
    </div>
  );
}

export default function GerarDocumentoPage() {
  return (
    <Suspense>
      <Gerar />
    </Suspense>
  );
}
