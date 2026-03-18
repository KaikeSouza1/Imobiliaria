import { withAuth } from "next-auth/middleware";

export default withAuth({
  // Redireciona para /login se não estiver logado
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protege tudo que estiver dentro de /admin e /crm
  matcher: ["/admin/:path*", "/crm/:path*"],
};