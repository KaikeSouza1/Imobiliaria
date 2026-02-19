import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

const BASE_URL = "https://imobiliariaportoiguacu.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Imobiliária Porto Iguaçu – Venda e Aluguel de Imóveis",
    template: "%s | Imobiliária Porto Iguaçu",
  },
  description:
    "Com experiência no mercado imobiliário das gêmeas do Iguaçu, nossa equipe de especialistas está aqui para ajudá-lo a encontrar o lar perfeito ou o investimento ideal. CRECI-PR J09362.",
  keywords: [
    "imobiliária porto iguaçu",
    "imóveis união da vitória",
    "imóveis porto união",
    "casas para alugar união da vitória",
    "casas para venda porto união",
    "apartamentos gêmeas do iguaçu",
    "terrenos união da vitória",
    "imóveis comerciais porto união",
    "aluguel de imóveis porto iguaçu",
    "comprar casa união da vitória",
  ],
  authors: [{ name: "Imobiliária Porto Iguaçu" }],
  creator: "Imobiliária Porto Iguaçu",
  publisher: "Imobiliária Porto Iguaçu",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: BASE_URL,
    siteName: "Imobiliária Porto Iguaçu",
    title: "Imobiliária Porto Iguaçu – Venda e Aluguel de Imóveis",
    description:
      "Encontre casas, apartamentos, terrenos e imóveis comerciais nas gêmeas do Iguaçu. CRECI-PR J09362.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Imobiliária Porto Iguaçu" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: BASE_URL },
  icons: {
    icon: "/logo_nova.png",
    shortcut: "/logo_nova.png",
    apple: "/logo_nova.png",
  },
};

const schemaOrg = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "RealEstateAgent",
      "@id": `${BASE_URL}/#organization`,
      name: "Imobiliária Porto Iguaçu",
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo_nova.png` },
      description: "Imobiliária referência no mercado das gêmeas do Iguaçu. Venda e aluguel de casas, apartamentos, sobrados, terrenos e imóveis comerciais.",
      telephone: "+55-42-99975-5493",
      address: {
        "@type": "PostalAddress",
        addressLocality: "União da Vitória",
        addressRegion: "PR",
        addressCountry: "BR",
      },
      sameAs: [
        "https://www.facebook.com/profile.php?id=61560745614772",
        "https://www.instagram.com/imobportoiguacu/",
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "08:00",
          closes: "18:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Saturday"],
          opens: "08:00",
          closes: "12:00",
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Imobiliária Porto Iguaçu",
      publisher: { "@id": `${BASE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/imoveis/venda?tipo={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={montserrat.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </head>
      <body className="font-sans antialiased">
        <Navbar />
        {children}
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}