"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import FormContrato from "@/components/contratos/FormContrato";

function NovoContrato() {
  const sp = useSearchParams();
  return <FormContrato legadoInicial={sp.get("legado") === "1"} tipoInicial={sp.get("tipo") === "venda" ? "venda" : "locacao"} />;
}

export default function NovoContratoPage() {
  return (
    <Suspense>
      <NovoContrato />
    </Suspense>
  );
}
