"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Home, ImageOff } from "lucide-react";
import { normalizarBusca, formatarMoeda } from "@/lib/texto";

export interface ImovelOpcao {
  id: number;
  titulo: string;
  codigo: string | null;
  tipo: string;
  finalidade?: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  preco: number;
  status?: string | null;
  ativo?: boolean | null;
  imagem_url?: string | null;
  proprietario_id: number | null;
}

const ROTULO_STATUS: Record<string, { texto: string; classe: string }> = {
  disponivel: { texto: "Disponível", classe: "bg-green-100 text-green-800" },
  alugado: { texto: "Alugado", classe: "bg-orange-100 text-orange-800" },
  vendido: { texto: "Vendido", classe: "bg-red-100 text-red-800" },
  reservado: { texto: "Reservado", classe: "bg-yellow-100 text-yellow-800" },
};

function Capa({ url, tamanho = "w-20 h-14" }: { url?: string | null; tamanho?: string }) {
  const [falhou, setFalhou] = useState(false);
  if (!url || falhou) {
    return (
      <div className={`${tamanho} rounded-lg bg-gray-100 text-gray-300 flex items-center justify-center flex-shrink-0`} title="Sem foto">
        <ImageOff size={18} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" onError={() => setFalhou(true)} className={`${tamanho} rounded-lg object-cover flex-shrink-0 bg-gray-100`} />;
}

export function CartaoImovel({ im, onTrocar }: { im: ImovelOpcao; onTrocar?: () => void }) {
  const st = ROTULO_STATUS[String(im.status || "disponivel")];
  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-2.5">
      <Capa url={im.imagem_url} tamanho="w-24 h-16" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900 truncate">{im.codigo ? `#${im.codigo} — ` : ""}{im.titulo}</p>
        <p className="text-xs text-gray-500 truncate">{[im.endereco, im.bairro, im.cidade].filter(Boolean).join(", ") || "Endereço não informado"}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {st && <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${st.classe}`}>{st.texto}</span>}
          {im.finalidade && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-100 text-gray-600">{im.finalidade}</span>}
          {im.preco > 0 && <span className="text-[11px] font-black text-green-700">{formatarMoeda(im.preco)}</span>}
        </div>
      </div>
      {onTrocar && (
        <button type="button" onClick={onTrocar} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Trocar</button>
      )}
    </div>
  );
}

// Busca de imóvel com foto de capa. Mostra sugestões assim que o campo recebe foco e filtra a cada letra.
export default function SeletorImovel({
  imoveis, carregando, tipoContrato, onEscolher,
}: {
  imoveis: ImovelOpcao[];
  carregando?: boolean;
  tipoContrato: "locacao" | "venda";
  onEscolher: (im: ImovelOpcao) => void;
}) {
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativoIdx, setAtivoIdx] = useState(0);
  const [filtro, setFiltro] = useState<"" | "aluguel" | "venda">(tipoContrato === "venda" ? "venda" : "aluguel");
  const lista = useRef<HTMLDivElement>(null);

  // Índice de busca montado uma vez (sem acento e minúsculo).
  const indice = useMemo(
    () => imoveis.map((im) => ({
      im,
      texto: normalizarBusca(`${im.codigo ?? ""} ${im.titulo} ${im.tipo} ${im.endereco ?? ""} ${im.bairro ?? ""} ${im.cidade ?? ""}`),
      codigo: normalizarBusca(im.codigo ?? ""),
      fin: normalizarBusca(im.finalidade ?? ""),
    })),
    [imoveis]
  );

  const resultados = useMemo(() => {
    const palavras = normalizarBusca(termo).split(/\s+/).filter(Boolean);
    const casaFiltro = (fin: string) => !filtro || (filtro === "aluguel" ? fin.includes("alug") : fin.includes("venda"));
    const itens = indice
      .filter((x) => casaFiltro(x.fin) && palavras.every((p) => x.texto.includes(p)))
      .map((x) => {
        const t = normalizarBusca(termo);
        // código exato primeiro, depois quem começa pelo termo, depois disponíveis, depois o resto (ordem original = mais recentes)
        let pontos = 0;
        if (t && x.codigo === t) pontos += 100;
        else if (t && x.codigo.startsWith(t)) pontos += 50;
        if (!x.im.status || x.im.status === "disponivel") pontos += 5;
        if (x.im.ativo === false) pontos -= 3;
        return { im: x.im, pontos };
      });
    itens.sort((a, b) => b.pontos - a.pontos);
    return itens.slice(0, 40).map((x) => x.im);
  }, [indice, termo, filtro]);

  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-idx="${ativoIdx}"]`)?.scrollIntoView({ block: "nearest" });
  }, [ativoIdx]);

  const escolher = (im: ImovelOpcao) => {
    onEscolher(im);
    setTermo("");
    setAberto(false);
  };

  const teclado = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAberto(true); setAtivoIdx((i) => Math.min(i + 1, resultados.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAtivoIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && aberto && resultados[ativoIdx]) { e.preventDefault(); escolher(resultados[ativoIdx]); }
    else if (e.key === "Escape") setAberto(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={termo}
          onChange={(e) => { setTermo(e.target.value); setAtivoIdx(0); setAberto(true); }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          onKeyDown={teclado}
          role="combobox"
          aria-expanded={aberto}
          aria-controls="lista-imoveis"
          aria-autocomplete="list"
          aria-label="Buscar imóvel"
          className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-green-500 focus:bg-white transition-all"
          placeholder={carregando ? "Carregando imóveis..." : "Clique para ver os imóveis ou digite código, título, rua ou bairro..."}
        />
        {termo && (
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setTermo("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
        )}
      </div>

      {aberto && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden" onMouseDown={(e) => e.preventDefault()}>
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/70">
            {([["aluguel", "Para alugar"], ["venda", "À venda"], ["", "Todos"]] as const).map(([v, r]) => (
              <button key={v} type="button" onClick={() => { setFiltro(v); setAtivoIdx(0); }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${filtro === v ? "bg-[#0f2e20] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"}`}>{r}</button>
            ))}
            <span className="ml-auto text-[11px] text-gray-400 font-bold">
              {termo ? `${resultados.length}${resultados.length === 40 ? "+" : ""} encontrado${resultados.length !== 1 ? "s" : ""}` : "Mais recentes"}
            </span>
          </div>
          <div ref={lista} className="max-h-[26rem] overflow-y-auto" id="lista-imoveis" role="listbox">
            {carregando && <p className="px-4 py-4 text-sm text-gray-400">Carregando imóveis...</p>}
            {!carregando && resultados.length === 0 && (
              <p className="px-4 py-4 text-sm text-gray-400">
                Nenhum imóvel encontrado{filtro ? ` ${filtro === "aluguel" ? "para alugar" : "à venda"}` : ""}.
                {filtro && <button type="button" className="ml-2 font-bold text-green-700 hover:underline" onClick={() => setFiltro("")}>Buscar em todos</button>}
              </p>
            )}
            {resultados.map((im, i) => {
              const st = ROTULO_STATUS[String(im.status || "disponivel")];
              return (
                <button key={im.id} type="button" data-idx={i} role="option" aria-selected={i === ativoIdx}
                  onClick={() => escolher(im)} onMouseEnter={() => setAtivoIdx(i)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 transition-colors ${i === ativoIdx ? "bg-green-50" : "hover:bg-green-50/60"}`}>
                  <Capa url={im.imagem_url} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{im.codigo ? <span className="text-green-700">#{im.codigo}</span> : null} {im.titulo}</p>
                    <p className="text-xs text-gray-500 truncate">{[im.endereco, im.bairro, im.cidade].filter(Boolean).join(", ") || "Endereço não informado"}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {st && <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${st.classe}`}>{st.texto}</span>}
                      {im.finalidade && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-100 text-gray-600">{im.finalidade}</span>}
                      {im.tipo && <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5"><Home size={10} /> {im.tipo}</span>}
                    </div>
                  </div>
                  {im.preco > 0 && <span className="text-sm font-black text-green-700 whitespace-nowrap">{formatarMoeda(im.preco)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
