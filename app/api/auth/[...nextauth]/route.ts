import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";

// Separamos as opções para podermos importar em outros lugares (como na API do CRM)
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        const user = credentials?.username?.toLowerCase() || "";
        const pass = credentials?.password || "";

        // 1. Verifica se é a conta Admin Master (no arquivo .env)
        if (
          user === process.env.ADMIN_USER?.toLowerCase() &&
          pass === process.env.ADMIN_PASSWORD
        ) {
          return { id: "admin", name: "Admin Porto Iguaçu", email: "admin@portoiguacu.com", role: "admin" };
        }

        // 2. Se não for admin, procura na tabela de corretores
        try {
          const dbUser = await query("SELECT * FROM usuarios WHERE username = $1", [user]);
          
          if (dbUser.rows.length > 0) {
            const corretor = dbUser.rows[0];
            
            // PRIMEIRO ACESSO: Se a senha for nula no banco, a senha digitada se torna a senha oficial
            if (!corretor.password) {
              await query("UPDATE usuarios SET password = $1 WHERE username = $2", [pass, user]);
              return { id: corretor.id.toString(), name: corretor.nome, email: `${user}@portoiguacu.com`, role: "corretor" };
            }
            
            // ACESSOS FUTUROS: Verifica se a senha digitada bate com a que está salva
            if (corretor.password === pass) {
              return { id: corretor.id.toString(), name: corretor.nome, email: `${user}@portoiguacu.com`, role: "corretor" };
            }
          }
        } catch (error) {
          console.error("Erro na autenticação:", error);
        }

        return null; // Retorna nulo se tudo falhar (login incorreto)
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        session.user.name = token.name;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };