"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { UploadCloud, Save, ArrowLeft, Loader2, X, Plus, Star, CheckCircle, Youtube } from "lucide-react";
import Link from "next/link";
import { PublicarRedes } from "@/components/PublicarRedes";
import imageCompression from "browser-image-compression";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
});

export default function NovoImovelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imovelCriado, setImovelCriado] = useState<any>(null);

  const [formData, setFormData] = useState({
    titulo: "", codigo: "", preco: "", tipo: "Casa", finalidade: "Venda",
    status: "disponivel", destaque: true, cidade: "Porto União",
    bairro: "", endereco: "", area: "",
    quartos: "0", banheiros: "0", vagas: "0", descricao: "",
    imagem_url: "", fotos_adicionais: [] as string[],
    video_url: "",
    latitude: -26.2303, longitude: -51.0904
  });

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return null;
    setUploading(true);
    const data = new FormData();
    try {
      for (const file of Array.from(files)) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        data.append("file", compressedFile);
      }
      const res = await fetch("/api/upload", { method: "POST", body: data });
      if (!res.ok) throw new Error("Erro no upload");
      const json = await res.json();
      return json.urls;
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro no upload.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCapaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const urls = await uploadFiles(e.target.files);
    if (urls && urls.length > 0) setFormData(prev => ({ ...prev, imagem_url: urls[0] }));
  };

  const handleGaleriaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const urls = await uploadFiles(e.target.files);
    if (urls) setFormData(prev => ({ ...prev, fotos_adicionais: [...prev.fotos_adicionais, ...urls] }));
  };

  const removeFoto = (index: number) => {
    setFormData(prev => ({ ...prev, fotos_adicionais: prev.fotos_adicionais.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imagem_url) { alert("Por favor, selecione a Foto de Capa."); return; }
    if (!formData.codigo) { alert("Por favor, preencha o Código."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/imoveis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const imovelSalvo = await res.json();
        setImovelCriado({ id: imovelSalvo.id || "novo", titulo: formData.titulo, fotoCapa: formData.imagem_url });
      } else {
        alert("Erro ao salvar.");
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const statusOptions = [
    { value: "disponivel", label: "✅ Disponível", color: "text-green-700 bg-green-50 border-green-200" },
    { value: "vendido", label: "🔴 Vendido", color: "text-red-700 bg-red-50 border-red-200" },
    { value: "alugado", label: "🟠 Alugado", color: "text-orange-700 bg-orange-50 border-orange-200" },
    { value: "reservado", label: "🟡 Reservado", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  ];

  if (imovelCriado) {
    return (
      <div className="max-w-xl mx-auto pb-20 px-4 pt-16">
        <div className="bg-white rounded-[2rem] p-10 flex flex-col items-center gap-6">
          <CheckCircle className="text-green-600" size={42} />
          <h1 className="text-2xl font-black text-gray-900">Imóvel cadastrado!</h1>
          <button onClick={() => window.location.reload()} className="bg-[#0f2e20] text-white font-bold py-3 px-6 rounded-xl">Cadastrar outro</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      <div className="flex items-center gap-4 mb-8 pt-10">
        <Link href="/admin/imoveis" className="p-3 bg-white hover:bg-gray-100 rounded-2xl shadow-sm"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-black text-gray-900 uppercase">Novo Imóvel</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-2 block">Capa Principal</label>
            <div className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-all cursor-pointer group overflow-hidden">
              {formData.imagem_url ? (
                <>
                  <Image src={formData.imagem_url} fill className="object-cover" alt="Capa" />
                  <button type="button" onClick={() => setFormData(p => ({ ...p, imagem_url: "" }))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-10"><X size={14} /></button>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  {uploading ? <Loader2 className="animate-spin text-green-600" /> : <UploadCloud className="text-gray-300 group-hover:text-green-600" size={30} />}
                  <span className="text-[10px] font-bold text-gray-400 mt-2">UPLOAD CAPA</span>
                </div>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleCapaChange} disabled={uploading} />
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-2 block">Galeria</label>
            <div className="grid grid-cols-4 gap-3">
              <label className="aspect-square bg-gray-50 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:bg-green-50 transition-colors">
                <Plus className="text-green-600" />
                <input type="file" multiple className="hidden" accept="image/*" onChange={handleGaleriaChange} disabled={uploading} />
              </label>
              {formData.fotos_adicionais.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <Image src={url} fill className="object-cover" alt="Galeria" />
                  <button type="button" onClick={() => removeFoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={10} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Campo Vídeo */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <label className="text-[10px] font-black uppercase text-gray-400 ml-2 flex items-center gap-2">
            <Youtube size={16} /> Link do Vídeo (YouTube)
          </label>
          <input name="video_url" value={formData.video_url} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold mt-2 focus:ring-2 focus:ring-[#0f2e20]" placeholder="https://www.youtube.com/watch?v=..." />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Informações do Imóvel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Título do Anúncio</label>
              <input name="titulo" required value={formData.titulo} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" placeholder="Ex: Casa Linda no Centro" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Preço (R$)</label>
              <input name="preco" type="number" step="0.01" required value={formData.preco} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" placeholder="0.00" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Código / Referência</label>
              <input name="codigo" required value={formData.codigo} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" placeholder="Ex: REF-1234" />
            </div>
            <button type="submit" disabled={loading || uploading} className="w-full bg-[#0f2e20] text-white font-black py-6 rounded-[2rem] col-span-2 shadow-2xl hover:bg-black transition-all uppercase tracking-widest text-sm">
              {loading ? <Loader2 className="animate-spin" /> : "Publicar Imóvel"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}