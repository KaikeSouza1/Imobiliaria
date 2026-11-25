"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import FormContrato from "@/components/contratos/FormContrato";

function NovoContrato() {
  const legado = useSearchParams().get("legado") === "1";
  return <FormContrato legadoInicial={legado} />;
}

export default function NovoContratoPage() {
  return (
    <Suspense>
      <NovoContrato />
    </Suspense>
  );
}
