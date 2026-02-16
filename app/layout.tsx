import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer"; // Importando o Footer novo

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pedroso Imóveis",
  description: "Encontre o imóvel dos seus sonhos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <Header />
        {children}
        <Footer /> {/* Aqui está ele! No final de tudo */}
      </body>
    </html>
  );
}