"use client";

import Image from "next/image";
import Link from "next/link";
import { Instagram, Mail, Phone, Award, Star, ChevronRight } from "lucide-react";
import HomeContact from "@/components/HomeContact";

const corretores = [
  {
    nome: "André Luis Schutze",
    foto: "/foto andre.jpeg",
    creci: "42206",
    email: "Schutze.andre.luis@hotmail.com",
    instagram: "https://www.instagram.com/andrelschutze?igsh=MWw5aGdicGNteG03bg%3D%3D&utm_source=qr",
    instagramHandle: "@andrelschutze",
    telefone: null,
    destaque: true,
    cargo: "Corretor de Imóveis",
  },
  {
    nome: "Jessica Winter",
    foto: "/foto jessica.jpeg",
    creci: "41305",
    email: "jessicawinter.imoveis@hotmail.com",
    instagram: "https://www.instagram.com/jessicawinter.imoveis?igsh=MWNsd3phYTZ1eXE4eQ%3D%3D&utm_source=qr",
    instagramHandle: "@jessicawinter.imoveis",
    telefone: "(42) 99850-5438",
    destaque: false,
    cargo: "Corretora de Imóveis",
  },
  {
    nome: "Anna Karol",
    foto: "/foto anna.jpeg",
    creci: "52528",
    email: "Karolmaistz@gmail.com",
    instagram: "https://www.instagram.com/karol_maistz?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    instagramHandle: "@karol_maistz",
    telefone: "(42) 8834-6963",
    destaque: false,
    cargo: "Corretora de Imóveis",
  },
  {
    nome: "Luane Orlandi",
    foto: "/foto luane.jpeg",
    creci: "52076-F",
    email: "corretoraluaneorlandi@gmail.com",
    instagram: "https://www.instagram.com/corretora_luane_orlandi_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    instagramHandle: "@corretora_luane_orlandi_",
    telefone: "(42) 9155-4021",
    destaque: false,
    cargo: "Corretora de Imóveis",
  },
  {
    nome: "Claudiney W. Otto Junior",
    foto: "/foto claudinei.jpg",
    creci: "37016",
    email: "juniorotto04@gmail.com",
    instagram: "https://www.instagram.com/claudineyotto_junior_corretor?igsh=aXJhYWQ0a2dvNHUw",
    instagramHandle: "@claudineyotto_junior_corretor",
    telefone: "(42) 98415-6013",
    destaque: false,
    cargo: "Corretor de Imóveis",
  },
];

export default function ContatoPage() {
  const andre = corretores.find((c) => c.destaque)!;
  const outros = corretores.filter((c) => !c.destaque);

  return (
    <main className="min-h-screen bg-[#f8f7f4] font-sans">

      {/* HERO */}
      <section className="relative h-[320px] bg-[#0f2e20] flex items-end justify-center pb-14 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920"
            alt="Contato"
            fill
            className="object-cover opacity-10"
          />
        </div>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(circle, #4ade80 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-green-400 font-black uppercase tracking-[0.3em] text-xs mb-3">Nossa Equipe</p>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-2">Fale com a gente</h1>
          <p className="text-green-200 font-medium text-sm">Corretores prontos para atender você</p>
        </div>
      </section>

      {/* CARD ANDRÉ — DESTAQUE */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-10 mb-8">
        <div className="bg-[#0f2e20] rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row">
            <div className="relative md:w-72 h-72 md:h-auto flex-shrink-0">
              <Image
                src={andre.foto}
                alt={andre.nome}
                fill
                className="object-cover object-top"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(15,46,32,0.55) 100%)" }}
              />
              <div
                className="absolute inset-0 hidden md:block"
                style={{ background: "linear-gradient(to right, transparent 60%, rgba(15,46,32,0.95) 100%)" }}
              />
              <div className="absolute top-4 left-4 bg-yellow-400 text-[#0f2e20] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <Star size={10} className="fill-[#0f2e20]" /> Diretor
              </div>
            </div>

            <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
              <div className="mb-6">
                <p className="text-green-400 font-black uppercase tracking-[0.25em] text-[10px] mb-2">{andre.cargo}</p>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">{andre.nome}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Award size={14} className="text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-sm">CRECI-PR {andre.creci}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {andre.email && (
                  <Link href={`mailto:${andre.email}`} className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-all group">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail size={14} className="text-green-400" />
                    </div>
                    <span className="text-white/80 text-xs font-medium truncate group-hover:text-white transition-colors">{andre.email}</span>
                  </Link>
                )}
                {andre.instagram && (
                  <Link href={andre.instagram} target="_blank" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-all group">
                    <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Instagram size={14} className="text-pink-400" />
                    </div>
                    <span className="text-white/80 text-xs font-medium group-hover:text-white transition-colors">{andre.instagramHandle}</span>
                  </Link>
                )}
                <Link
                  href="https://api.whatsapp.com/send?phone=5542999755493&text=Ol%C3%A1!%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es."
                  target="_blank"
                  className="sm:col-span-2 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-xl px-6 py-3.5 font-black text-sm uppercase tracking-widest transition-all shadow-lg"
                >
                  Falar no WhatsApp <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TÍTULO EQUIPE */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200" />
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Nossa Equipe</p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      </div>

      {/* CARDS CORRETORES */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {outros.map((c) => (
            <div
              key={c.nome}
              className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Foto com degradê igual ao PropertyCard */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={c.foto}
                  alt={c.nome}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to bottom, transparent 35%, rgba(10,20,15,0.75) 70%, rgba(10,20,15,0.95) 100%)",
                  }}
                />
                {c.creci && (
                  <div className="absolute top-3 left-3 bg-[#0f2e20] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md flex items-center gap-1">
                    <Award size={10} /> CRECI {c.creci}
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{c.cargo}</p>
                  <p className="text-sm font-black text-gray-900 leading-tight">{c.nome}</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 space-y-2">
                {c.telefone && (
                  <Link href={`tel:${c.telefone.replace(/\D/g, "")}`} className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors text-sm font-medium">
                    <Phone size={13} className="text-green-600 flex-shrink-0" />
                    <span>{c.telefone}</span>
                  </Link>
                )}
                {c.email && (
                  <Link href={`mailto:${c.email}`} className="flex items-center gap-2 text-gray-600 hover:text-green-700 transition-colors text-sm font-medium">
                    <Mail size={13} className="text-green-600 flex-shrink-0" />
                    <span className="truncate text-xs">{c.email}</span>
                  </Link>
                )}
                {c.instagram && (
                  <Link href={c.instagram} target="_blank" className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors text-sm font-medium">
                    <Instagram size={13} className="text-pink-500 flex-shrink-0" />
                    <span className="truncate text-xs">{c.instagramHandle}</span>
                  </Link>
                )}
                <Link
                  href={`https://api.whatsapp.com/send?phone=5542999755493&text=Ol%C3%A1!%20Gostaria%20de%20falar%20com%20${encodeURIComponent(c.nome)}.`}
                  target="_blank"
                  className="mt-2 flex items-center justify-center gap-2 w-full bg-[#0f2e20] hover:bg-green-700 text-white text-xs font-black uppercase tracking-widest rounded-xl py-3 transition-all"
                >
                  WhatsApp
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FORMULÁRIO */}
      <div className="bg-white border-t border-gray-100">
        <HomeContact />
      </div>
    </main>
  );
}