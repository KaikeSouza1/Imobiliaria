// ARQUIVO: components/PublicarRedes.tsx
// Adicione esse componente no painel admin do imóvel (editar ou listagem)

"use client";

import { useState } from "react";
import { Share2, Facebook, Instagram, Loader2, CheckCircle, XCircle, X } from "lucide-react";

interface Imovel {
  id: string;
  titulo: string;
  tipo: string;
  finalidade: string;
  preco?: number;
  area?: number;
  quartos?: number;
  banheiros?: number;
  vagas?: number;
  bairro?: string;
  cidade?: string;
  descricao?: string;
  fotoCapa?: string;
}

interface PublicarRedesProps {
  imovel: Imovel;
}

export function PublicarRedes({ imovel }: PublicarRedesProps) {
  const [facebook, setFacebook] = useState(true);
  const [instagram, setInstagram] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    tipo: "sucesso" | "parcial" | "erro";
    mensagem: string;
  } | null>(null);
  const [aberto, setAberto] = useState(false);

  async function publicar() {
    if (!imovel.fotoCapa) {
      setResultado({
        tipo: "erro",
        mensagem: "Este imóvel não tem foto de capa!",
      });
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imovel,
          publicarFacebook: facebook,
          publicarInstagram: instagram,
        }),
      });

      const data = await res.json();

      if (data.parcial) {
        const erros = Object.entries(data.erros)
          .map(([rede, msg]) => `${rede}: ${msg}`)
          .join(" | ");
        setResultado({
          tipo: "parcial",
          mensagem: `Publicado parcialmente. Erro: ${erros}`,
        });
      } else if (data.sucesso) {
        setResultado({
          tipo: "sucesso",
          mensagem: `Publicado com sucesso em ${[
            facebook && "Facebook",
            instagram && "Instagram",
          ]
            .filter(Boolean)
            .join(" e ")}!`,
        });
      } else {
        setResultado({
          tipo: "erro",
          mensagem: data.erro || "Erro desconhecido ao publicar.",
        });
      }
    } catch {
      setResultado({
        tipo: "erro",
        mensagem: "Erro de conexão. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {/* Botão principal */}
      <button
        onClick={() => {
          setAberto(!aberto);
          setResultado(null);
        }}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-pink-600 hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md"
      >
        <Share2 size={15} />
        Publicar nas Redes
      </button>

      {/* Dropdown */}
      {aberto && (
        <>
          {/* Overlay para fechar */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAberto(false)}
          />

          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-sm">
                Publicar imóvel nas redes sociais
              </h3>
              <button
                onClick={() => setAberto(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nome do imóvel */}
            <p className="text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg px-3 py-2 truncate">
              📌 {imovel.titulo}
            </p>

            {/* Checkboxes */}
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={facebook}
                    onChange={(e) => setFacebook(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                      facebook
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    }`}
                    onClick={() => setFacebook(!facebook)}
                  >
                    {facebook && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <Facebook size={18} className="text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Facebook</p>
                  <p className="text-xs text-gray-400">Imobiliária Porto Iguaçu</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={instagram}
                    onChange={(e) => setInstagram(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                      instagram
                        ? "bg-pink-600 border-pink-600"
                        : "border-gray-300"
                    }`}
                    onClick={() => setInstagram(!instagram)}
                  >
                    {instagram && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <Instagram size={18} className="text-pink-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Instagram</p>
                  <p className="text-xs text-gray-400">@imobiliariaportoiguacu</p>
                </div>
              </label>
            </div>

            {/* Resultado */}
            {resultado && (
              <div
                className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 mb-4 ${
                  resultado.tipo === "sucesso"
                    ? "bg-green-50 text-green-700"
                    : resultado.tipo === "parcial"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {resultado.tipo === "sucesso" ? (
                  <CheckCircle size={14} className="mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={14} className="mt-0.5 shrink-0" />
                )}
                <span>{resultado.mensagem}</span>
              </div>
            )}

            {/* Aviso sem foto */}
            {!imovel.fotoCapa && (
              <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                ⚠️ Este imóvel não tem foto de capa cadastrada.
              </div>
            )}

            {/* Botão publicar */}
            <button
              onClick={publicar}
              disabled={loading || (!facebook && !instagram) || !imovel.fotoCapa}
              className="w-full bg-gradient-to-r from-blue-600 to-pink-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Publicando... (pode levar alguns segundos)
                </>
              ) : (
                <>
                  <Share2 size={15} />
                  Publicar agora
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              A publicação aparecerá em instantes nas redes sociais
            </p>
          </div>
        </>
      )}
    </div>
  );
}