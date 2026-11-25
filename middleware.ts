import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { podeUsarModuloContratos, rotaDoModuloContratos } from "@/lib/permissoes";

export default withAuth(
  // Módulo de contratos: só os usuários liberados em lib/permissoes.ts.
  function middleware(req) {
    const caminho = req.nextUrl.pathname;
    if (!rotaDoModuloContratos(caminho)) return NextResponse.next();

    const token = req.nextauth.token as { username?: string } | null;
    if (!token) {
      // Rotas de API respondem 401 em JSON (as próprias rotas também conferem a sessão).
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    if (!podeUsarModuloContratos(token.username)) {
      if (caminho.startsWith("/api/")) {
        return NextResponse.json({ error: "Você não tem acesso a este módulo." }, { status: 403 });
      }
      const destino = new URL("/admin/imoveis", req.url);
      destino.searchParams.set("sem_acesso", "contratos");
      return NextResponse.redirect(destino);
    }
    return NextResponse.next();
  },
  {
    // Redireciona para /login se não estiver logado
    pages: {
      signIn: "/login",
    },
    callbacks: {
      // APIs do módulo passam adiante sem token para responder 401 em JSON; as telas exigem login.
      authorized: ({ token, req }) => !!token || req.nextUrl.pathname.startsWith("/api/"),
    },
  }
);

export const config = {
  // Protege tudo que estiver dentro de /admin e /crm, e as APIs do módulo de contratos
  matcher: [
    "/admin/:path*",
    "/crm/:path*",
    "/api/admin/locacoes/:path*",
    "/api/admin/clientes/:path*",
    "/api/admin/documentos/:path*",
    "/api/admin/busca/:path*",
  ],
};
