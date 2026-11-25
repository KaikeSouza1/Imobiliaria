// Gera os PDFs de exemplo de todos os modelos (dados fictícios) para conferência visual.
// Uso: npx tsx scripts/gerar-exemplos-modelos.ts <pasta-de-saida>
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { MODELOS } from "../lib/modelos";
import { gerarPdf } from "../lib/modelos/gerar-pdf";
import { EXEMPLOS, EMPRESA_TESTE } from "../tests/fixtures/modelos";

async function main() {
  const saida = process.argv[2] || "exemplos-modelos";
  mkdirSync(saida, { recursive: true });
  for (const m of MODELOS) {
    const arquivo = join(saida, `${m.id}.pdf`);
    writeFileSync(arquivo, await gerarPdf(m, EXEMPLOS[m.id], EMPRESA_TESTE));
    console.log("gerado:", arquivo);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
