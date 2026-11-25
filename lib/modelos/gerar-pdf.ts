// Desenha os blocos de um modelo em PDF (A4, logo no topo, numeração de páginas). Só usar no servidor.
import pdfmake from "pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { type Bloco, type Modelo, type Valores, type Empresa, partesMarcadas } from "./tipos";
import { LOGO_PNG_BASE64 } from "./recursos/logo";

let configurado = false;
function configurar() {
  if (configurado) return;
  const vfs = vfsFonts as unknown as Record<string, string>;
  const fonte = (nome: string) => Buffer.from(vfs[nome], "base64");
  pdfmake.setFonts({
    Roboto: {
      normal: fonte("Roboto-Regular.ttf"),
      bold: fonte("Roboto-Medium.ttf"),
      italics: fonte("Roboto-Italic.ttf"),
      bolditalics: fonte("Roboto-MediumItalic.ttf"),
    },
  });
  // Documentos só usam o que está no próprio código: nada de buscar arquivo local ou URL externa.
  pdfmake.setUrlAccessPolicy(() => false);
  pdfmake.setLocalAccessPolicy(() => false);
  configurado = true;
}

const TAMANHO = 11;

// Hífen dentro de palavra ("Ressalta-se", "e-mail") vira hífen inseparável: sem isso o texto justificado
// quebra/espaça a palavra e sai "Ressalta- se".
function semQuebraNoHifen(t: string) {
  return t.replace(/(\p{L})-(\p{L})/gu, "$1‑$2");
}

function texto(t: string) {
  return partesMarcadas(t).map((p) => {
    const text = semQuebraNoHifen(p.texto);
    return p.negrito ? { text, bold: true } : { text };
  });
}

function linhaAssinatura(nome: string, linhas: string[] = []): Content {
  return {
    stack: [
      { text: "__________________________________", alignment: "center", bold: true },
      { text: nome, alignment: "center", bold: true },
      ...linhas.map((l) => ({ text: l, alignment: "center" as const, bold: true })),
    ],
    unbreakable: true,
  };
}

function desenhar(b: Bloco): Content {
  switch (b.t) {
    case "titulo":
      return { text: b.texto, bold: true, fontSize: 13, alignment: "center", margin: [0, 0, 0, 10] };
    case "subtitulo":
      return { text: b.texto, bold: true, fontSize: 12, alignment: "center", margin: [0, -6, 0, 10] };
    case "clausula":
      return { text: b.texto, bold: true, margin: [0, 6, 0, 4] };
    case "p":
      return { text: texto(b.texto), alignment: b.alinhamento ?? "justify", margin: [0, 0, 0, 7] };
    case "lista":
      return { ul: b.itens.map((i) => ({ text: texto(i), alignment: "justify" as const })), margin: [12, 0, 0, 7] };
    case "tabela":
      return {
        table: {
          widths: ["*", 110],
          body: [
            ...b.linhas.map(([a, c]) => [{ text: a }, { text: c, alignment: "right" as const }]),
            ...(b.total ? [[{ text: b.total[0], bold: true }, { text: b.total[1], bold: true, alignment: "right" as const }]] : []),
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 2, 0, 9],
      };
    case "assinaturas":
      if (b.ladoALado) {
        return { columns: b.pessoas.map((p) => linhaAssinatura(p.nome, p.linhas)), columnGap: 20, margin: [0, 45, 0, 0] };
      }
      return { stack: b.pessoas.map((p) => ({ ...(linhaAssinatura(p.nome, p.linhas) as object), margin: [0, 45, 0, 0] })) as Content[] };
    case "espaco":
      return { text: "", margin: [0, b.altura ?? 10, 0, 0] };
  }
}

export function definicaoPdf(modelo: Modelo, valores: Valores, empresa: Empresa): TDocumentDefinitions {
  return {
    pageSize: "A4",
    pageMargins: modelo.logo ? [48, 105, 48, 50] : [48, 50, 48, 50],
    info: { title: modelo.titulo, author: empresa.nome_curto, creator: "Sistema Porto Iguaçu" },
    defaultStyle: { font: "Roboto", fontSize: TAMANHO, lineHeight: 1.15 },
    header: modelo.logo
      ? { image: `data:image/png;base64,${LOGO_PNG_BASE64}`, width: 120, alignment: "center", margin: [0, 18, 0, 0] }
      : undefined,
    footer: (pagina: number, total: number) =>
      total > 1 ? { text: `Página ${pagina} de ${total}`, alignment: "center", fontSize: 8, color: "#666666", margin: [0, 18, 0, 0] } : null,
    content: modelo.montar(valores, empresa).map(desenhar),
  };
}

export async function gerarPdf(modelo: Modelo, valores: Valores, empresa: Empresa): Promise<Buffer> {
  configurar();
  const buffer = await pdfmake.createPdf(definicaoPdf(modelo, valores, empresa)).getBuffer();
  return Buffer.from(buffer);
}
