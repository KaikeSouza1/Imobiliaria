// Ajudantes de sessão e requisição para as rotas de API.
import type { Session } from "next-auth";

export function usuarioDaSessao(session: Session | null): string | null {
  const u = session?.user as { username?: string; name?: string | null } | undefined;
  return (u?.username || u?.name || null)?.toString().toLowerCase() ?? null;
}

export function ipDaRequisicao(req: Request): string | null {
  const encaminhado = req.headers.get("x-forwarded-for");
  return (encaminhado ? encaminhado.split(",")[0] : req.headers.get("x-real-ip"))?.trim() || null;
}
