"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import FormContrato, { type ContratoCarregado } from "@/components/contratos/FormContrato";

export default function EditarContratoPage() {
  const { id } = useParams() as { id: string };
  const [contrato, setContrato] = useState<ContratoCarregado | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/admin/locacoes/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Erro ao carregar contrato");
        setContrato(d);
      })
      .catch((e) => setErro(e.message));
  }, [id]);

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

  return <FormContrato contrato={contrato} />;
}
