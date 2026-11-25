// Comprovante assinado (HMAC) do pedido de envio. Liga a confirmação ao pedido original
// sem guardar nada no banco: o servidor só aceita confirmar o que ele mesmo autorizou.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { TipoDocumento, Vinculo } from "./documentos";

export interface DadosEnvio {
  chave: string;
  nome: string;
  tamanho: number;
  tipo: TipoDocumento;
  vinculo: Vinculo;
  usuario: string;
  expira: number; // epoch em ms
}

function segredo() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET não configurado.");
  return `envio-documento:${s}`;
}

function assinar(corpo: string) {
  return createHmac("sha256", segredo()).update(corpo).digest("base64url");
}

export function criarTokenEnvio(dados: Omit<DadosEnvio, "expira">, validadeMs = 15 * 60 * 1000): string {
  const corpo = Buffer.from(JSON.stringify({ ...dados, expira: Date.now() + validadeMs })).toString("base64url");
  return `${corpo}.${assinar(corpo)}`;
}

export function lerTokenEnvio(token: unknown, usuario: string): DadosEnvio | null {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [corpo, assinatura] = token.split(".");
  const esperado = Buffer.from(assinar(corpo));
  const recebido = Buffer.from(assinatura || "");
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;
  try {
    const dados = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")) as DadosEnvio;
    if (dados.expira < Date.now() || dados.usuario !== usuario) return null;
    return dados;
  } catch {
    return null;
  }
}
