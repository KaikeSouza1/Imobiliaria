"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import FormCliente, { type ClienteCarregado } from "@/components/clientes/FormCliente";

export default function EditarClientePage() {
  const { id } = useParams() as { id: string };
  const [cliente, setCliente] = useState<ClienteCarregado | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/admin/clientes/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Erro ao carregar cliente");
        setCliente(d);
      })
      .catch((e) => setErro(e.message));
  }, [id]);

  if (erro) return (
    <div className="text-center py-20">
      <p className="text-gray-600 font-bold">{erro}</p>
      <Link href="/admin/clientes" className="text-green-700 font-bold text-sm mt-4 inline-block">Voltar para clientes</Link>
    </div>
  );
  if (!cliente) return (
    <div className="text-center py-20 flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-green-700" size={40} />
      <p className="text-gray-500 font-bold">Carregando cliente...</p>
    </div>
  );
  return <FormCliente cliente={cliente} />;
}
