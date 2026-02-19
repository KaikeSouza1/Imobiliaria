"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const WHATSAPP_NUMBER = "5542999755493";
const WHATSAPP_MESSAGE = "Olá! Vim pelo site da Imobiliária Porto Iguaçu e gostaria de mais informações.";

export default function WhatsAppFloat() {
  const [visible, setVisible]       = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleClosed, setBubbleClosed] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 1500);
    const t2 = setTimeout(() => setShowBubble(true), 3500);
    const t3 = setTimeout(() => setShowBubble(false), 9000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .whats-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 8px 30px rgba(37,211,102,0.35);
        }
        .whats-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
      `}</style>

      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        {/* Balão de mensagem */}
        {showBubble && !bubbleClosed && (
          <div
            className="relative bg-white rounded-2xl rounded-br-sm shadow-xl px-5 py-4 max-w-[210px] border border-gray-100"
            style={{ animation: "fadeSlideIn 0.4s ease forwards" }}
          >
            <button
              onClick={() => setBubbleClosed(true)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={9} className="text-gray-600" />
            </button>
            <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider">Porto Iguaçu</p>
            <p className="text-sm font-semibold text-gray-800 leading-snug">
              Olá! 👋 Posso te ajudar a encontrar o imóvel ideal?
            </p>
            {/* Triângulo */}
            <div
              className="absolute -bottom-2 right-5 w-0 h-0"
              style={{
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "9px solid white",
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.05))",
              }}
            />
          </div>
        )}

        {/* Botão — sem pulse, só hover suave */}
        <Link
          href={url}
          target="_blank"
          aria-label="Falar no WhatsApp"
          className="whats-btn flex items-center justify-center w-14 h-14 rounded-full shadow-lg"
          style={{
            backgroundColor: "#25D366",
            animation: "floatIn 0.5s ease forwards",
          }}
        >
          <svg viewBox="0 0 32 32" className="w-8 h-8 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16.003c0 2.352.632 4.638 1.833 6.641L2.667 29.333l6.897-1.808a13.26 13.26 0 0 0 6.44 1.668h.003C23.37 29.193 29.333 23.222 29.333 16c0-7.363-5.967-13.333-13.33-13.333zm0 24.36a11.04 11.04 0 0 1-5.633-1.543l-.404-.24-4.094 1.074 1.093-3.987-.264-.41a11.003 11.003 0 0 1-1.69-5.918c0-6.075 4.942-11.017 11.017-11.017 6.075 0 11.017 4.942 11.017 11.017 0 6.072-4.942 11.024-11.042 11.024zm6.044-8.25c-.33-.166-1.955-.965-2.258-1.074-.304-.11-.524-.166-.745.166-.22.33-.854 1.074-1.047 1.295-.193.22-.386.248-.716.083-.33-.166-1.394-.514-2.656-1.639-.982-.876-1.645-1.957-1.837-2.288-.193-.33-.02-.51.145-.675.15-.148.33-.386.496-.58.165-.192.22-.33.33-.55.11-.22.055-.413-.028-.58-.083-.165-.745-1.794-1.02-2.456-.27-.645-.543-.557-.745-.567l-.634-.012c-.22 0-.578.083-.88.413-.303.33-1.157 1.13-1.157 2.758s1.185 3.2 1.35 3.42c.165.22 2.33 3.558 5.646 4.99.79.34 1.405.543 1.886.695.793.252 1.515.216 2.086.131.636-.095 1.955-.8 2.232-1.572.275-.773.275-1.434.193-1.572-.083-.138-.303-.22-.634-.386z"/>
          </svg>
        </Link>
      </div>
    </>
  );
}