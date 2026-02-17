import { Facebook, Instagram } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full font-sans">
      {/* === PARTE 3: CRÉDITOS E COPYRIGHT (Apenas a faixa final) === */}
      <div className="bg-[#0a1f16] text-white py-8 px-4 border-t border-green-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium opacity-70">
          <p>© 2026 - IMOBILIÁRIA PORTO IGUAÇU - CRECI-PR J09362</p>
          
          <div className="flex items-center gap-8">
            <div className="flex gap-5">
              <Link href="#" className="hover:text-green-400 transition-colors hover:scale-110 transform"><Facebook size={20} /></Link>
              <Link href="#" className="hover:text-green-400 transition-colors hover:scale-110 transform"><Instagram size={20} /></Link>
            </div>
            <div className="hidden md:block w-px h-5 bg-white/20"></div>
            <p className="hover:text-white transition-colors cursor-default flex items-center gap-2">
              Desenvolvido por <span className="font-bold text-green-400">Kaike Souza</span> - 2026
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}