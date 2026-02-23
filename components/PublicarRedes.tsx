"use client";

import { useState, useEffect } from "react";
import {
  Share2, Facebook, Instagram, Loader2, CheckCircle,
  XCircle, X, Eye, ChevronLeft, ChevronRight, Images
} from "lucide-react";

interface ImovelPublicar {
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
  imovel: ImovelPublicar;
  inline?: boolean;
}

// ============================================================
// MODAL DE PREVIEW
// ============================================================
function ModalPreview({
  imovel,
  onClose,
  onPublicar,
}: {
  imovel: ImovelPublicar;
  onClose: () => void;
  onPublicar: (facebook: boolean, instagram: boolean) => void;
}) {
  const [fotos, setFotos] = useState<string[]>([]);
  const [loadingFotos, setLoadingFotos] = useState(false);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [facebook, setFacebook] = useState(true);
  const [instagram, setInstagram] = useState(true);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://imobiliariaportoiguacu.com.br";
  const linkImovel = `${SITE_URL}/imovel/${imovel.id}`;

  const legendaFacebook = [
    `🏠 ${imovel.tipo} para ${imovel.finalidade}`,
    ``,
    `📍 ${imovel.bairro}, ${imovel.cidade}/PR`,
    ``,
    `💬 Consulte todas as informações:`,
    `👉 ${linkImovel}`,
    ``,
    `#imoveis #ImobiliariaPortoIguacu #PortoUniao #UniaoVitoria #${(imovel.tipo || "imovel").replace(/\s/g, "")}`,
  ].join("\n");

  const legendaInstagram = [
    `🏠 ${imovel.tipo} para ${imovel.finalidade}`,
    ``,
    `📍 ${imovel.bairro}, ${imovel.cidade}/PR`,
    ``,
    `💬 Consulte todas as informações:`,
    `👉 Link completo na bio do perfil!`,
    ``,
    `#imoveis #ImobiliariaPortoIguacu #PortoUniao #UniaoVitoria #${(imovel.tipo || "imovel").replace(/\s/g, "")}`,
  ].join("\n");

  async function carregarPreview() {
    if (!imovel.fotoCapa) return;
    setLoadingFotos(true);
    try {
      const res = await fetch(
        `/api/social/publish?imovelId=${imovel.id}&fotoCapa=${encodeURIComponent(imovel.fotoCapa)}`
      );
      const data = await res.json();
      setFotos(data.fotos?.length > 0 ? data.fotos : [imovel.fotoCapa!]);
    } catch {
      setFotos([imovel.fotoCapa!]);
    } finally {
      setLoadingFotos(false);
    }
  }

  // ✅ CORREÇÃO: useEffect garante que roda apenas uma vez após montar
  useEffect(() => {
    carregarPreview();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 sticky top-0 bg-white z-20 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Eye size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-lg">Preview antes de publicar</h2>
              <p className="text-xs text-gray-400">Confira como vai aparecer nas redes sociais</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-8 space-y-8">

          {/* SEÇÃO: FOTOS */}
          <div>
            <h3 className="font-black text-gray-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Images size={16} className="text-blue-500" />
              Fotos que serão publicadas
            </h3>

            {loadingFotos ? (
              <div className="h-40 flex items-center justify-center bg-gray-50 rounded-2xl">
                <Loader2 className="animate-spin text-gray-400" size={28} />
                <span className="ml-2 text-gray-400 text-sm font-medium">Carregando fotos...</span>
              </div>
            ) : fotos.length > 0 ? (
              <div>
                {/* Foto principal com navegação */}
                <div className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-3">
                  <img
                    src={fotos[fotoAtiva]}
                    alt={`Foto ${fotoAtiva + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    {fotoAtiva + 1} / {fotos.length}
                  </div>
                  {fotoAtiva > 0 && (
                    <button
                      onClick={() => setFotoAtiva(fotoAtiva - 1)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft size={18} className="text-gray-700" />
                    </button>
                  )}
                  {fotoAtiva < fotos.length - 1 && (
                    <button
                      onClick={() => setFotoAtiva(fotoAtiva + 1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight size={18} className="text-gray-700" />
                    </button>
                  )}
                </div>

                {/* Miniaturas */}
                {fotos.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {fotos.map((foto, i) => (
                      <button
                        key={i}
                        onClick={() => setFotoAtiva(i)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                          fotoAtiva === i ? "border-blue-500 scale-110 shadow-lg" : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <img src={foto} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <div className="absolute bottom-0 inset-x-0 bg-blue-500/80 text-white text-[8px] font-black text-center py-0.5">
                            CAPA
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className={`mt-3 inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full ${
                  fotos.length > 1 ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                }`}>
                  {fotos.length > 1
                    ? `✅ ${fotos.length} fotos — será publicado como carrossel`
                    : "📸 1 foto — publicação simples"
                  }
                </div>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center bg-red-50 rounded-2xl border border-red-200">
                <p className="text-red-600 text-sm font-bold">⚠️ Sem fotos para publicar</p>
              </div>
            )}
          </div>

          {/* SEÇÃO: LEGENDA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Facebook */}
            <div className="border-2 border-blue-100 rounded-2xl overflow-hidden">
              <div className="bg-blue-50 px-4 py-3 flex items-center gap-2 border-b border-blue-100">
                <Facebook size={16} className="text-blue-600" />
                <span className="font-black text-blue-700 text-sm">Legenda — Facebook</span>
              </div>
              <div className="p-4 bg-white">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{legendaFacebook}</pre>
              </div>
            </div>

            {/* Instagram */}
            <div className="border-2 border-pink-100 rounded-2xl overflow-hidden">
              <div className="bg-pink-50 px-4 py-3 flex items-center gap-2 border-b border-pink-100">
                <Instagram size={16} className="text-pink-600" />
                <span className="font-black text-pink-700 text-sm">Legenda — Instagram</span>
              </div>
              <div className="p-4 bg-white">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{legendaInstagram}</pre>
              </div>
            </div>
          </div>

          {/* SEÇÃO: ESCOLHER REDES */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="font-black text-gray-700 text-sm uppercase tracking-wider mb-4">
              Onde publicar?
            </h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-3 cursor-pointer bg-white border-2 px-5 py-3 rounded-xl transition-all flex-1 justify-center"
                style={{ borderColor: facebook ? "#2563eb" : "#e5e7eb" }}>
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${facebook ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
                  onClick={() => setFacebook(!facebook)}
                >
                  {facebook && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <Facebook size={18} className="text-blue-600" />
                <span className="font-bold text-gray-700">Facebook</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer bg-white border-2 px-5 py-3 rounded-xl transition-all flex-1 justify-center"
                style={{ borderColor: instagram ? "#db2777" : "#e5e7eb" }}>
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${instagram ? "bg-pink-600 border-pink-600" : "border-gray-300"}`}
                  onClick={() => setInstagram(!instagram)}
                >
                  {instagram && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <Instagram size={18} className="text-pink-600" />
                <span className="font-bold text-gray-700">Instagram</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer com botões */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-5 flex items-center justify-between gap-4 rounded-b-3xl">
          <button onClick={onClose} className="text-gray-500 font-bold hover:text-gray-700 transition-colors text-sm">
            Cancelar
          </button>
          <button
            onClick={() => onPublicar(facebook, instagram)}
            disabled={(!facebook && !instagram) || fotos.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-pink-600 hover:opacity-90 text-white font-black px-8 py-3.5 rounded-2xl transition-all disabled:opacity-40 text-sm uppercase tracking-wider shadow-lg"
          >
            <Share2 size={16} />
            Confirmar e Publicar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function PublicarRedes({ imovel, inline = false }: PublicarRedesProps) {
  const [modalPreview, setModalPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<"sucesso" | "erro" | "parcial" | null>(null);
  const [mensagemErro, setMensagemErro] = useState("");

  async function publicar(facebook: boolean, instagram: boolean) {
    if (!imovel.fotoCapa) return;

    setModalPreview(false);
    setLoading(true);
    setResultado(null);

    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imovel, publicarFacebook: facebook, publicarInstagram: instagram }),
      });
      const data = await res.json();

      if (data.sucesso) {
        setResultado("sucesso");
      } else if (data.parcial) {
        setResultado("parcial");
        const erros = Object.entries(data.erros || {}).map(([r, m]) => `${r}: ${m}`).join(" | ");
        setMensagemErro(erros);
      } else {
        setResultado("erro");
        setMensagemErro(data.erro || JSON.stringify(data.erros) || "Erro desconhecido");
      }
    } catch {
      setResultado("erro");
      setMensagemErro("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {modalPreview && (
        <ModalPreview
          imovel={imovel}
          onClose={() => setModalPreview(false)}
          onPublicar={publicar}
        />
      )}

      <div className={inline ? "mt-6 border-t border-gray-100 pt-6" : ""}>
        {inline && (
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
            <Share2 size={16} className="text-blue-500" />
            Publicar nas Redes Sociais
          </h3>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setResultado(null);
              setModalPreview(true);
            }}
            disabled={loading || !imovel.fotoCapa}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-pink-600 hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 transition shadow-md"
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> Publicando...</>
            ) : (
              <><Eye size={15} /> Preview e Publicar</>
            )}
          </button>

          {!imovel.fotoCapa && (
            <span className="text-amber-600 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              ⚠️ Sem foto de capa
            </span>
          )}

          {resultado === "sucesso" && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm font-bold bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle size={14} /> Publicado com sucesso!
            </span>
          )}
          {resultado === "parcial" && (
            <span className="flex items-center gap-1.5 text-yellow-600 text-sm font-bold bg-yellow-50 px-3 py-1.5 rounded-lg">
              ⚠️ Publicado parcialmente — {mensagemErro}
            </span>
          )}
          {resultado === "erro" && (
            <span className="flex items-center gap-1.5 text-red-600 text-sm font-bold bg-red-50 px-3 py-1.5 rounded-lg">
              <XCircle size={14} /> {mensagemErro}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export default PublicarRedes;