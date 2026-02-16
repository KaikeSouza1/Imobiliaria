import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        // Verifica se o usuário e senha batem com o .env
        if (
          credentials?.username === process.env.ADMIN_USER &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "1", name: "Admin Porto Iguaçu", email: "admin@portoiguacu.com" };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login", // Nossa página customizada de login
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };