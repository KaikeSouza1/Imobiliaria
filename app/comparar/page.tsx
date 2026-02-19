"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  GitCompare, X, Check, Search, SlidersHorizontal,
  BedDouble, Bath, Car, Maximize, MapPin, ArrowRight,
  Trophy, ChevronDown, Loader2, RotateCcw
} from "lucide-react";

interface Imovel {
  id: number;
  titulo: string;
  preco: number;
  tipo: string;
  finalidade: string;
  cidade: string;
  bairro: string;
  endereco: string;
  quartos: number;
  banheiros: number;
  vagas: number;
  area: number;
  imagem_url: string;
  codigo: string;
  ativo: boolean;
  status: string;
}

const TIPOS = ["Todos", "Casa", "Apartamento", "Sobrado", "Terreno", "Terreno Rural", "Comercial"];

function formatPreco(preco: number, finalidade: string) {
  if (preco === 0) return "Consultar";
  const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(preco);
  const isAluguel = finalidade === "Aluguel" || finalidade === "Locação" || finalidade === "Alugar";
  return isAluguel ? `${fmt}/mês` : fmt;
}

const FALLBACK = "/sem-foto.jpg";

export default function ComparadorPage() {
  const [imoveis, setImoveis]           = useState<Imovel[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selecionados, setSelecionados] = useState<Imovel[]>([]);
  const [modalAberto, setModalAberto]   = useState(false);

  // Filtros
  const [finalidade, setFinalidade] = useState<"Venda" | "Aluguel">("Venda");
  const [tipo, setTipo]             = useState("Todos");
  const [cidade, setCidade]         = useState("");
  const [busca, setBusca]           = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/imoveis");
        if (res.ok) {
          const data = await res.json();
          setImoveis(data.filter((i: Imovel) => i.ativo));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Reset selecionados ao trocar finalidade
  useEffect(() => { setSelecionados([]); }, [finalidade]);

  const cidades = useMemo(() => {
    const isAluguel = finalidade === "Aluguel";
    const lista = imoveis.filter((i) =>
      isAluguel
        ? i.finalidade === "Aluguel" || i.finalidade === "Locação" || i.finalidade === "Alugar"
        : i.finalidade === "Venda"
    );
    return Array.from(new Set(lista.map((i) => i.cidade))).filter(Boolean).sort();
  }, [imoveis, finalidade]);

  const imoveisFiltrados = useMemo(() => {
    return imoveis.filter((i) => {
      const isAluguel = finalidade === "Aluguel";
      const matchFinalidade = isAluguel
        ? i.finalidade === "Aluguel" || i.finalidade === "Locação" || i.finalidade === "Alugar"
        : i.finalidade === "Venda";
      const matchTipo   = tipo === "Todos" || i.tipo === tipo;
      const matchCidade = !cidade || i.cidade === cidade;
      const matchBusca  = !busca || i.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                          i.codigo?.toLowerCase().includes(busca.toLowerCase());
      return matchFinalidade && matchTipo && matchCidade && matchBusca;
    });
  }, [imoveis, finalidade, tipo, cidade, busca]);

  const toggleSelecionado = (imovel: Imovel) => {
    const jaTem = selecionados.find((s) => s.id === imovel.id);
    if (jaTem) {
      setSelecionados((prev) => prev.filter((s) => s.id !== imovel.id));
    } else {
      if (selecionados.length >= 3) return;
      setSelecionados((prev) => [...prev, imovel]);
    }
  };

  const isSelecionado = (id: number) => !!selecionados.find((s) => s.id === id);

  // ---- TABELA COMPARATIVA ----
  const linhas: { label: string; fn: (i: Imovel) => string | number; melhorFn?: "maior" | "menor" }[] = [
    { label: "Código",    fn: (i) => i.codigo || "—" },
    { label: "Tipo",      fn: (i) => i.tipo },
    { label: "Cidade",    fn: (i) => i.cidade },
    { label: "Bairro",    fn: (i) => i.bairro || "—" },
    { label: "Quartos",   fn: (i) => i.quartos || 0,    melhorFn: "maior" },
    { label: "Banheiros", fn: (i) => i.banheiros || 0,  melhorFn: "maior" },
    { label: "Vagas",     fn: (i) => i.vagas || 0,      melhorFn: "maior" },
    { label: "Área (m²)", fn: (i) => i.area || 0,       melhorFn: "maior" },
    { label: "Preço",     fn: (i) => i.preco,            melhorFn: "menor" },
  ];

  function getMelhorIdx(linha: typeof linhas[0]): number | null {
    if (!linha.melhorFn) return null;
    const vals = selecionados.map((i) => Number(linha.fn(i)));
    if (vals.every((v) => v === 0)) return null;
    const target = linha.melhorFn === "maior" ? Math.max(...vals) : Math.min(...vals.filter((v) => v > 0));
    const idx = vals.indexOf(target);
    return vals.filter((v) => v === target).length > 1 ? null : idx; // empate não destaca
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-32">

      {/* HERO */}
      <section className="relative bg-[#0f2e20] pt-20 pb-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #4ade80 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-50"
          style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-5">
            <GitCompare size={13} /> Ferramenta exclusiva
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none">
            Comparador<br />
            <span className="text-green-400">de Imóveis</span>
          </h1>
          <p className="text-green-100/70 text-lg font-medium">
            Selecione até 3 imóveis e compare tudo lado a lado.<br />Tome a melhor decisão.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-4">

        {/* ---- FILTROS ---- */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-8">

          {/* TOGGLE VENDA / ALUGUEL */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
              {(["Venda", "Aluguel"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFinalidade(f)}
                  className={`px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all
                    ${finalidade === f
                      ? "bg-[#0f2e20] text-white shadow-lg scale-105"
                      : "text-gray-500 hover:text-gray-800"}`}
                >
                  {f === "Venda" ? "🏠 Comprar" : "🔑 Alugar"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título ou código..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Tipo */}
            <div className="relative">
              <SlidersHorizontal size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full pl-10 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
              >
                {TIPOS.map((t) => <option key={t} value={t}>{t === "Todos" ? "Todos os tipos" : t}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Cidade */}
            <div className="relative">
              <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full pl-10 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none cursor-pointer"
              >
                <option value="">Todas as cidades</option>
                {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Info resultados */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              <span className="font-black text-gray-900">{imoveisFiltrados.length}</span> imóveis encontrados
            </p>
            {(tipo !== "Todos" || cidade || busca) && (
              <button
                onClick={() => { setTipo("Todos"); setCidade(""); setBusca(""); }}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-bold transition-colors"
              >
                <RotateCcw size={12} /> Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* ---- SELECIONADOS (barra flutuante topo) ---- */}
        {selecionados.length > 0 && (
          <div className="sticky top-4 z-30 mb-6">
            <div className="bg-[#0f2e20] rounded-2xl px-5 py-4 shadow-2xl border border-green-900 flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <GitCompare size={18} className="text-green-400 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-wrap">
                  {selecionados.map((s) => (
                    <div key={s.id} className="flex items-center gap-1.5 bg-white/10 rounded-xl pl-2 pr-1 py-1">
                      <div className="relative w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={s.imagem_url || FALLBACK} alt={s.titulo} fill className="object-cover" />
                      </div>
                      <span className="text-white text-xs font-bold max-w-[100px] truncate">{s.titulo}</span>
                      <button
                        onClick={() => setSelecionados((prev) => prev.filter((x) => x.id !== s.id))}
                        className="w-5 h-5 bg-white/10 hover:bg-red-500 rounded-lg flex items-center justify-center text-white transition-colors ml-1"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {selecionados.length < 3 && (
                    <span className="text-green-400 text-xs font-bold opacity-60">
                      + {3 - selecionados.length} disponível
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSelecionados([])}
                  className="text-green-400 hover:text-white text-xs font-bold transition-colors px-3 py-2"
                >
                  Limpar
                </button>
                {selecionados.length >= 2 ? (
                  <button
                    onClick={() => setModalAberto(true)}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-black text-sm px-6 py-2.5 rounded-xl transition-all uppercase tracking-wider shadow-lg"
                  >
                    <GitCompare size={15} /> Comparar agora
                  </button>
                ) : (
                  <span className="text-green-300/60 text-xs font-bold">Selecione mais 1</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- GRID DE IMÓVEIS ---- */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-green-700" size={36} />
          </div>
        ) : imoveisFiltrados.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <Search size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-black uppercase tracking-widest">Nenhum imóvel encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {imoveisFiltrados.map((imovel) => {
              const sel = isSelecionado(imovel.id);
              const cheio = selecionados.length >= 3 && !sel;
              return (
                <div
                  key={imovel.id}
                  onClick={() => !cheio && toggleSelecionado(imovel)}
                  className={`relative bg-white rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer group
                    ${sel
                      ? "border-green-500 shadow-xl shadow-green-500/20 scale-[1.02]"
                      : cheio
                      ? "border-gray-100 opacity-40 cursor-not-allowed"
                      : "border-gray-100 hover:border-green-300 hover:shadow-lg"}`}
                >
                  {/* Checkbox de seleção */}
                  <div className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all
                    ${sel ? "bg-green-500 border-green-500" : "bg-white/90 border-gray-300 group-hover:border-green-400"}`}>
                    {sel && <Check size={14} className="text-white" strokeWidth={3} />}
                  </div>

                  {/* Badge selecionado */}
                  {sel && (
                    <div className="absolute top-3 left-3 z-10 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg flex items-center gap-1">
                      <Check size={9} /> Selecionado
                    </div>
                  )}

                  {/* Foto */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={imovel.imagem_url || FALLBACK}
                      alt={imovel.titulo}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-400"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 left-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/70">{imovel.tipo}</span>
                      <p className="text-white font-black text-base leading-tight">{formatPreco(imovel.preco, imovel.finalidade)}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="font-black text-gray-900 text-sm leading-snug line-clamp-2 mb-2">{imovel.titulo}</p>
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mb-3">
                      <MapPin size={11} /> {imovel.bairro}{imovel.cidade ? `, ${imovel.cidade}` : ""}
                    </p>
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {[
                        { icon: <BedDouble size={12} />, val: imovel.quartos },
                        { icon: <Bath size={12} />,      val: imovel.banheiros },
                        { icon: <Car size={12} />,       val: imovel.vagas },
                        { icon: <Maximize size={12} />,  val: imovel.area ? `${imovel.area}m²` : "—" },
                      ].map((item, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg py-1.5 flex flex-col items-center gap-0.5">
                          <span className="text-gray-400">{item.icon}</span>
                          <span className="text-[10px] font-black text-gray-700">{item.val || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================== MODAL DE COMPARAÇÃO ===================== */}
      {modalAberto && selecionados.length >= 2 && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 overflow-auto">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setModalAberto(false)} />

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl z-10 overflow-hidden">

            {/* Header */}
            <div className="bg-[#0f2e20] px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <GitCompare size={20} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-xl uppercase tracking-tight">Comparação</h2>
                  <p className="text-green-400 text-xs font-bold">{selecionados.length} imóveis selecionados</p>
                </div>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-auto max-h-[80vh]">
              <div className="p-6 md:p-8">

                {/* Fotos + info principal */}
                <div className={`grid gap-4 mb-8 ${selecionados.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {selecionados.map((imovel, idx) => (
                    <div key={imovel.id} className="rounded-2xl overflow-hidden border border-gray-100 shadow-md relative">
                      {idx === 0 && (
                        <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-yellow-900 text-[9px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1">
                          <Trophy size={9} /> 1º
                        </div>
                      )}
                      <div className="relative h-40">
                        <Image
                          src={imovel.imagem_url || FALLBACK}
                          alt={imovel.titulo}
                          fill
                          className="object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                      <div className="p-4 text-center">
                        <p className="font-black text-gray-900 text-sm leading-tight line-clamp-2 mb-1">{imovel.titulo}</p>
                        <p className="text-2xl font-black text-green-700 mb-1">{formatPreco(imovel.preco, imovel.finalidade)}</p>
                        <p className="text-[10px] text-gray-400 font-bold mb-3">Cód: {imovel.codigo}</p>
                        <Link
                          href={`/imovel/${imovel.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 bg-[#0f2e20] hover:bg-green-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-all uppercase tracking-wider"
                        >
                          Ver imóvel <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tabela comparativa */}
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  {/* Header da tabela */}
                  <div className={`grid bg-gray-50 border-b border-gray-200 ${selecionados.length === 2 ? "grid-cols-3" : "grid-cols-4"}`}>
                    <div className="px-5 py-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Característica</p>
                    </div>
                    {selecionados.map((s) => (
                      <div key={s.id} className="px-5 py-3 border-l border-gray-200">
                        <p className="text-[10px] font-black text-gray-700 truncate uppercase tracking-wide">{s.titulo}</p>
                      </div>
                    ))}
                  </div>

                  {/* Linhas */}
                  {linhas.map((linha, rowIdx) => {
                    const melhorIdx = getMelhorIdx(linha);
                    return (
                      <div
                        key={linha.label}
                        className={`grid border-b border-gray-50 last:border-0 ${selecionados.length === 2 ? "grid-cols-3" : "grid-cols-4"}
                          ${rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <div className="px-5 py-4 flex items-center">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-wider">{linha.label}</p>
                        </div>
                        {selecionados.map((imovel, idx) => {
                          const val = linha.fn(imovel);
                          const isMelhor = melhorIdx === idx;
                          const display = linha.label === "Preço"
                            ? formatPreco(Number(val), imovel.finalidade)
                            : val === 0 ? "—" : String(val);
                          return (
                            <div key={imovel.id} className="px-5 py-4 border-l border-gray-100 flex items-center gap-2">
                              <span className={`text-sm font-bold ${isMelhor ? "text-green-700" : "text-gray-700"}`}>
                                {display}
                              </span>
                              {isMelhor && (
                                <span className="flex items-center gap-0.5 bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  <Trophy size={8} /> Melhor
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Ações finais */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => { setSelecionados([]); setModalAberto(false); }}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 font-bold transition-colors"
                  >
                    <RotateCcw size={14} /> Nova comparação
                  </button>
                  <p className="text-xs text-gray-400 font-medium">
                    Clique nos imóveis para ver todos os detalhes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}