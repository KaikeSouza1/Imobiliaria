// Envio de PDF pelo navegador em 3 passos: pedir URL, enviar direto ao R2, confirmar.
import { conferirArquivoNoNavegador, type TipoDocumento, type Vinculo } from "./documentos";

export type ResultadoEnvio = { ok: true; nome: string } | { ok: false; nome: string; erro: string };

async function erroDe(res: Response, padrao: string) {
  const d = await res.json().catch(() => ({}));
  return (d as { error?: string }).error || padrao;
}

export async function enviarDocumento(arquivo: File, vinculo: Partial<Vinculo>, tipo: TipoDocumento): Promise<ResultadoEnvio> {
  const nome = arquivo.name;
  const problema = await conferirArquivoNoNavegador(arquivo);
  if (problema) return { ok: false, nome, erro: problema };

  const pedido = await fetch("/api/admin/documentos/envio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...vinculo, tipo, nome, tamanho: arquivo.size }),
  });
  if (!pedido.ok) return { ok: false, nome, erro: await erroDe(pedido, "Não foi possível preparar o envio.") };
  const { url, token } = await pedido.json();

  try {
    const put = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: arquivo });
    if (!put.ok) return { ok: false, nome, erro: `Falha ao enviar "${nome}" (${put.status}). Tente de novo.` };
  } catch {
    return { ok: false, nome, erro: `Falha de conexão ao enviar "${nome}". Verifique a internet e tente de novo.` };
  }

  const confirmacao = await fetch("/api/admin/documentos/confirmar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!confirmacao.ok) return { ok: false, nome, erro: await erroDe(confirmacao, "Não foi possível registrar o documento.") };
  return { ok: true, nome };
}
