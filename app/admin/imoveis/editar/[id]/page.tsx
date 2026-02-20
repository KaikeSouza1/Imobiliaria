"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { UploadCloud, Save, ArrowLeft, Loader2, X, Plus, MapPin, Star, Crown, Share2, Facebook, Instagram } from "lucide-react";
import Link from "next/link";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
});

// ============================================================
// COMPONENTE PUBLICAR REDES — INLINE (sem import externo)
// ============================================================
function PublicarRedes({ imovel }: { imovel: any }) {
  const [facebook, setFacebook] = useState(true);
  const [instagram, setInstagram] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<"sucesso" | "erro" | null>(null);
  const [mensagemErro, setMensagemErro] = useState("");

  async function publicar() {
    if (!imovel.fotoCapa) {
      setResultado("erro");
      setMensagemErro("Imóvel sem foto de capa.");
      return;
    }
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imovel, publicarFacebook: facebook, publicarInstagram: instagram }),
      });
      const data = await res.json();
      if (data.sucesso || data.parcial) {
        setResultado("sucesso");
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
    <div className="mt-6 border-t border-gray-100 pt-6">
      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
        <Share2 size={16} className="text-blue-500" />
        Publicar nas Redes Sociais
      </h3>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Checkboxes */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${facebook ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
              onClick={() => setFacebook(!facebook)}
            >
              {facebook && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <Facebook size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Facebook</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${instagram ? "bg-pink-600 border-pink-600" : "border-gray-300"}`}
              onClick={() => setInstagram(!instagram)}
            >
              {instagram && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <Instagram size={16} className="text-pink-600" />
            <span className="text-sm font-medium text-gray-700">Instagram</span>
          </label>
        </div>

        {/* Botão */}
        <button
          type="button"
          onClick={publicar}
          disabled={loading || (!facebook && !instagram)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-pink-600 hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 transition"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
          {loading ? "Publicando..." : "Publicar agora"}
        </button>

        {/* Resultado */}
        {resultado === "sucesso" && (
          <span className="text-green-600 text-sm font-bold">✅ Publicado com sucesso!</span>
        )}
        {resultado === "erro" && (
          <span className="text-red-600 text-sm font-bold">❌ {mensagemErro}</span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default function EditarImovelPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "", codigo: "", preco: "", tipo: "Casa", finalidade: "Venda",
    status: "disponivel", destaque: false,
    cidade: "", bairro: "", endereco: "", area: "",
    quartos: "0", banheiros: "0", vagas: "0", descricao: "",
    imagem_url: "", fotos_adicionais: [] as string[], ativo: true,
    latitude: -26.2303,
    longitude: -51.0904
  });

  useEffect(() => {
    async function loadImovel() {
      if (!id) return;
      try {
        const res = await fetch(`/api/imoveis/${id}`);
        if (!res.ok) throw new Error("Não encontrado");
        const data = await res.json();
        setFormData({
          ...data,
          preco: data.preco?.toString() || "0",
          area: data.area?.toString() || "0",
          quartos: data.quartos?.toString() || "0",
          banheiros: data.banheiros?.toString() || "0",
          vagas: data.vagas?.toString() || "0",
          status: data.status || "disponivel",
          destaque: data.destaque || false,
          latitude: Number(data.latitude) || -26.2303,
          longitude: Number(data.longitude) || -51.0904,
          fotos_adicionais: data.fotos_adicionais || []
        });
      } catch (error) {
        console.error(error);
        alert("Erro ao carregar dados do imóvel.");
        router.push("/admin/imoveis");
      } finally {
        setLoading(false);
      }
    }
    loadImovel();
  }, [id, router]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return null;
    setUploading(true);
    const data = new FormData();
    Array.from(files).forEach(file => data.append("file", file));
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      return json.urls;
    } catch (error) {
      alert("Erro no upload.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleDefinirCapa = (urlClicada: string, indexNaGaleria: number) => {
    const capaAtual = formData.imagem_url;
    const novaGaleria = [...formData.fotos_adicionais];
    novaGaleria[indexNaGaleria] = capaAtual;
    setFormData(prev => ({ ...prev, imagem_url: urlClicada, fotos_adicionais: novaGaleria }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/imoveis/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("Imóvel atualizado com sucesso!");
        router.push("/admin/imoveis");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: "disponivel", label: "✅ Disponível", color: "text-green-700 bg-green-50 border-green-200" },
    { value: "vendido",    label: "🔴 Vendido",    color: "text-red-700 bg-red-50 border-red-200" },
    { value: "alugado",    label: "🟠 Alugado",    color: "text-orange-700 bg-orange-50 border-orange-200" },
    { value: "reservado",  label: "🟡 Reservado",  color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  ];

  const imovelParaPublicar = {
    id: String(id),
    titulo: formData.titulo,
    tipo: formData.tipo,
    finalidade: formData.finalidade,
    preco: Number(formData.preco),
    area: Number(formData.area),
    quartos: Number(formData.quartos),
    banheiros: Number(formData.banheiros),
    vagas: Number(formData.vagas),
    bairro: formData.bairro,
    cidade: formData.cidade,
    descricao: formData.descricao,
    fotoCapa: formData.imagem_url,
  };

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-green-700" size={40} />
      <p className="font-bold text-gray-500">Puxando informações do banco...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/imoveis" className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-gray-800">Editar Imóvel #{id}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* SEÇÃO FOTOS */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Fotos do Imóvel</h2>
          <p className="text-xs text-gray-400">
            Clique em qualquer foto da galeria para <span className="font-bold text-amber-600">definir como capa</span>. A capa atual vai para a galeria automaticamente.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <label className="label-admin font-bold text-gray-600 block mb-2 uppercase text-[10px] tracking-widest flex items-center gap-1">
                <Crown size={12} className="text-amber-500" /> Capa Atual
              </label>
              <div className="relative aspect-video rounded-lg overflow-hidden border-4 border-amber-400 shadow-lg">
                <Image src={formData.imagem_url || "/logo.png"} fill className="object-cover" alt="Capa" />
                <div className="absolute top-2 left-2 bg-amber-400 text-white rounded-full p-1 shadow"><Crown size={14} /></div>
                <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <div className="flex flex-col items-center text-white gap-1">
                    <UploadCloud size={22} />
                    <span className="text-[10px] font-bold">Novo upload</span>
                  </div>
                  <input type="file" className="hidden" onChange={async (e) => {
                    const urls = await uploadFiles(e.target.files);
                    if (urls) setFormData(p => ({ ...p, imagem_url: urls[0] }));
                  }} />
                </label>
              </div>
            </div>
            <div className="col-span-2">
              <label className="label-admin font-bold text-gray-600 block mb-2 uppercase text-[10px] tracking-widest">
                Galeria — clique para definir como capa
              </label>
              <div className="grid grid-cols-4 gap-2">
                <label className="aspect-square bg-gray-50 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-green-50 transition-colors">
                  <Plus className="text-green-600" />
                  <input type="file" multiple className="hidden" onChange={async (e) => {
                    const urls = await uploadFiles(e.target.files);
                    if (urls) setFormData(p => ({ ...p, fotos_adicionais: [...p.fotos_adicionais, ...urls] }));
                  }} />
                </label>
                {formData.fotos_adicionais.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-amber-400 transition-all group cursor-pointer shadow-sm"
                    onClick={() => handleDefinirCapa(url, i)} title="Clique para definir como capa">
                    <Image src={url} fill className="object-cover group-hover:brightness-75 transition-all" alt="Galeria" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-amber-400 text-white rounded-full p-2 shadow-lg"><Crown size={16} /></div>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFormData(p => ({ ...p, fotos_adicionais: p.fotos_adicionais.filter((_, idx) => idx !== i) })); }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO DESTAQUE + PUBLICAR NAS REDES */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          {/* Toggle destaque */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Star size={18} className="text-amber-500 fill-amber-500" /> Imóvel em Destaque na Home
              </h2>
              <p className="text-xs text-gray-500 mt-1">Habilite para que este imóvel apareça nos Destaques da página inicial.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.destaque} onChange={(e) => setFormData({ ...formData, destaque: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* PUBLICAR NAS REDES — logo abaixo do destaque */}
          <PublicarRedes imovel={imovelParaPublicar} />
        </div>

        {/* SEÇÃO STATUS */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-2 tracking-wider">Status do Imóvel</h2>
          <p className="text-xs text-gray-400 mb-4">Imóveis "Vendido", "Alugado" ou "Reservado" aparecerão com destaque nos cards do site.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statusOptions.map((opt) => (
              <label key={opt.value} className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer font-bold text-sm transition-all
                  ${formData.status === opt.value ? opt.color + " border-current shadow-md scale-[1.02]" : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"}`}>
                <input type="radio" name="status" value={opt.value} checked={formData.status === opt.value} onChange={handleChange} className="hidden" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* DADOS BÁSICOS */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label-admin">Título</label>
            <input name="titulo" required value={formData.titulo} onChange={handleChange} className="input-admin" />
          </div>
          <div>
            <label className="label-admin">Código / Referência</label>
            <input name="codigo" value={formData.codigo} onChange={handleChange} className="input-admin" />
          </div>
          <div>
            <label className="label-admin">Preço (R$)</label>
            <input name="preco" type="number" step="0.01" required value={formData.preco} onChange={handleChange} className="input-admin" />
          </div>
          <div>
            <label className="label-admin">Tipo de Imóvel</label>
            <select name="tipo" value={formData.tipo} onChange={handleChange} className="input-admin">
              <option value="Apartamento">Apartamento</option>
              <option value="Barracão">Barracão</option>
              <option value="Casa">Casa</option>
              <option value="Comercial">Comercial</option>
              <option value="Imóvel Rural">Imóvel Rural</option>
              <option value="Kitnet">Kitnet</option>
              <option value="Sobrado">Sobrado</option>
              <option value="Terreno Rural">Terreno Rural</option>
              <option value="Terreno Urbano">Terreno Urbano</option>
            </select>
          </div>
          <div>
            <label className="label-admin">Finalidade</label>
            <select name="finalidade" value={formData.finalidade} onChange={handleChange} className="input-admin">
              <option value="Venda">Venda</option>
              <option value="Aluguel">Aluguel</option>
            </select>
          </div>
          <div>
            <label className="label-admin">Cidade</label>
            <input name="cidade" list="cidades" value={formData.cidade} onChange={handleChange} className="input-admin" />
            <datalist id="cidades"><option value="Porto União" /><option value="União da Vitória" /></datalist>
          </div>
          <div>
            <label className="label-admin">Bairro</label>
            <input name="bairro" list="bairros" value={formData.bairro} onChange={handleChange} className="input-admin" />
            <datalist id="bairros"><option value="Centro" /><option value="São Cristóvão" /></datalist>
          </div>
          <div className="md:col-span-2">
            <label className="label-admin">Endereço Completo</label>
            <input name="endereco" value={formData.endereco} onChange={handleChange} className="input-admin" />
          </div>
        </div>

        {/* CARACTERÍSTICAS */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label-admin">Área (m²)</label>
            <input name="area" type="number" value={formData.area} onChange={handleChange} className="input-admin" />
          </div>
          <div>
            <label className="label-admin">Quartos</label>
            <input name="quartos" type="number" value={formData.quartos} onChange={handleChange} className="input-admin" />
          </div>
          <div>
            <label className="label-admin">Banheiros</label>
            <input name="banheiros" type="number" value={formData.banheiros} onChange={handleChange} className="input-admin" />
          </div>
          <div>
            <label className="label-admin">Vagas</label>
            <input name="vagas" type="number" value={formData.vagas} onChange={handleChange} className="input-admin" />
          </div>
          <div className="col-span-2 md:col-span-4 mt-2">
            <label className="label-admin">Descrição para o Site</label>
            <textarea name="descricao" rows={5} value={formData.descricao} onChange={handleChange} className="input-admin resize-none" />
          </div>
        </div>

        {/* MAPA */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-2 tracking-wider flex items-center gap-2">
            <MapPin size={16} /> Localização no Mapa
          </h2>
          <p className="text-xs text-gray-400 mb-4">Clique no mapa para atualizar a localização exata do imóvel</p>
          <MapPicker lat={formData.latitude} lng={formData.longitude}
            onLocationChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))} />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="label-admin">Latitude</label>
              <input type="text" value={Number(formData.latitude).toFixed(6)} readOnly className="input-admin bg-gray-50 cursor-not-allowed" />
            </div>
            <div>
              <label className="label-admin">Longitude</label>
              <input type="text" value={Number(formData.longitude).toFixed(6)} readOnly className="input-admin bg-gray-50 cursor-not-allowed" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving || uploading} className="w-full bg-[#0f2e20] hover:bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
          {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} SALVAR ALTERAÇÕES
        </button>
      </form>
    </div>
  );
}