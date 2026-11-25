"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FormCliente from "@/components/clientes/FormCliente";

function Novo() {
  const papel = useSearchParams().get("papel");
  return <FormCliente papelInicial={papel === "proprietario" ? "proprietario" : "inquilino"} />;
}

export default function NovoClientePage() {
  return (
    <Suspense>
      <Novo />
    </Suspense>
  );
}
