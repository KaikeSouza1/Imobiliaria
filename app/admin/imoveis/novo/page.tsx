"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { UploadCloud, Save, ArrowLeft, Loader2, X, Plus, MapPin, Star } from "lucide-react";
import Link from "next/link";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
});

export default function NovoImovelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: "", 
    codigo: "", 
    preco: "", 
    tipo: "Casa", 
    finalidade: "Venda",
    status: "disponivel",
    destaque: true, 
    cidade: "Porto União", 
    bairro: "", 
    endereco: "", 
    area: "",
    quartos: "0", 
    banheiros: "0", 
    vagas: "0", 
    descricao: "",
    imagem_url: "",
    fotos_adicionais: [] as string[],
    latitude: -26.2303,
    longitude: -51.0904
  });

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return null;
    setUploading(true);
    const data = new FormData();
    Array.from(files).forEach(file => data.append("file", file));
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro no upload");
      return json.urls;
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar imagem.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCapaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const urls = await uploadFiles(e.target.files);
    if (urls && urls.length > 0) {
      setFormData(prev => ({ ...prev, imagem_url: urls[0] }));
    }
  };

  const handleGaleriaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const urls = await uploadFiles(e.target.files);
    if (urls) {
      setFormData(prev => ({ 
        ...prev, 
        fotos_adicionais: [...prev.fotos_adicionais, ...urls] 
      }));
    }
  };

  const removeFoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotos_adicionais: prev.fotos_adicionais.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imagem_url) {
      alert("Por favor, selecione ao menos a Foto de Capa.");
      return;
    }

    if (!formData.codigo) {
      alert("Por favor, preencha o Código do imóvel.");
      return;
    }

    setLoading(true);

    const dadosParaEnviar = {
      ...formData,
      preco: parseFloat(formData.preco) || 0,
      area: parseInt(formData.area) || 0,
      quartos: parseInt(formData.quartos) || 0,
      banheiros: parseInt(formData.banheiros) || 0,
      vagas: parseInt(formData.vagas) || 0,
    };

    try {
      const res = await fetch("/api/imoveis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosParaEnviar),
      });

      if (res.ok) {
        alert("Imóvel cadastrado com sucesso!");
        router.push("/admin/imoveis");
      } else {
        const errorData = await res.json();
        alert("Erro ao salvar: " + (errorData.error || "Tente novamente"));
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const statusOptions = [
    { value: "disponivel", label: "✅ Disponível", color: "text-green-700 bg-green-50 border-green-200" },
    { value: "vendido",    label: "🔴 Vendido",    color: "text-red-700 bg-red-50 border-red-200" },
    { value: "alugado",    label: "🟠 Alugado",    color: "text-orange-700 bg-orange-50 border-orange-200" },
    { value: "reservado",  label: "🟡 Reservado",  color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      <div className="flex items-center gap-4 mb-8 pt-10">
        <Link href="/admin/imoveis" className="p-3 bg-white hover:bg-gray-100 rounded-2xl shadow-sm text-gray-500 transition-all border border-gray-100">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Novo Imóvel</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SEÇÃO 1: IMAGENS */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1">
             <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-2 block">Capa Principal</label>
             <div className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-all cursor-pointer group overflow-hidden">
                {formData.imagem_url ? (
                   <>
                     <Image src={formData.imagem_url} fill className="object-cover" alt="Capa" />
                     <button type="button" onClick={() => setFormData(p => ({...p, imagem_url: ""}))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-10"><X size={14} /></button>
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
             <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-2 block">Galeria de Fotos</label>
             <div className="grid grid-cols-4 gap-3">
                <label className="aspect-square bg-gray-50 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:bg-green-50 transition-colors">
                   <Plus className="text-green-600" />
                   <input type="file" multiple className="hidden" accept="image/*" onChange={handleGaleriaChange} disabled={uploading} />
                </label>
                {formData.fotos_adicionais.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                     <Image src={url} fill className="object-cover" alt="Galeria" />
                     <button type="button" onClick={() => removeFoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={10}/></button>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* SEÇÃO 2: DESTAQUE */}
        <div className={`p-6 rounded-[2rem] border-2 transition-all shadow-sm flex items-center justify-between
          ${formData.destaque ? "bg-amber-50 border-amber-400" : "bg-white border-gray-100"}`}>
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all 
              ${formData.destaque ? "bg-amber-400 text-white shadow-lg shadow-amber-200" : "bg-gray-100 text-gray-400"}`}>
              <Star size={28} fill={formData.destaque ? "currentColor" : "none"} />
            </div>
            <div>
              <h3 className={`font-black uppercase text-sm tracking-widest ${formData.destaque ? "text-amber-900" : "text-gray-900"}`}>
                {formData.destaque ? "Cadastrando como DESTAQUE" : "Cadastro Padrão"}
              </h3>
              <p className="text-xs text-gray-500 font-medium">Imóvel aparecerá automaticamente no topo da home.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setFormData({...formData, destaque: !formData.destaque})}
            className={`w-16 h-8 rounded-full relative transition-all ${formData.destaque ? "bg-amber-500" : "bg-gray-200"}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.destaque ? "left-9" : "left-1"}`} />
          </button>
        </div>

        {/* SEÇÃO 3: STATUS */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Status do Imóvel</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statusOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer font-bold text-sm transition-all
                  ${formData.status === opt.value
                    ? opt.color + " border-current shadow-md scale-[1.02]"
                    : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
                  }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  checked={formData.status === opt.value}
                  onChange={handleChange}
                  className="hidden"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* SEÇÃO 4: DADOS BÁSICOS */}
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
             
             <div>
               <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Tipo de Imóvel</label>
               <select name="tipo" value={formData.tipo} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]">
                 <option value="Apartamento">Apartamento</option>
                 <option value="Barracão">Barracão</option>
                 <option value="Casa">Casa</option>
                 <option value="Comercial">Comercial</option>
                 <option value="Kitnet">Kitnet</option>
                 <option value="Sobrado">Sobrado</option>
                 <option value="Terreno Rural">Terreno Rural</option>
                 <option value="Terreno Urbano">Terreno Urbano</option>
               </select>
             </div>

             <div>
               <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Finalidade</label>
               <select name="finalidade" value={formData.finalidade} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]">
                 <option value="Venda">Venda</option>
                 <option value="Aluguel">Aluguel</option>
               </select>
             </div>
             
             <div>
               <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Cidade</label>
               <input name="cidade" list="cidades" value={formData.cidade} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" />
               <datalist id="cidades"><option value="Porto União" /><option value="União da Vitória" /></datalist>
             </div>
             <div>
               <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Bairro</label>
               <input name="bairro" value={formData.bairro} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" />
             </div>
             <div className="md:col-span-2">
               <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Endereço Completo</label>
               <input name="endereco" value={formData.endereco} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-[#0f2e20]" />
             </div>
             
             <div className="grid grid-cols-4 gap-4 md:col-span-2">
               <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Área (m²)</label><input name="area" type="number" value={formData.area} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold" /></div>
               <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Quartos</label><input name="quartos" type="number" value={formData.quartos} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold" /></div>
               <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Banheiros</label><input name="banheiros" type="number" value={formData.banheiros} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold" /></div>
               <div><label className="text-[10px] font-black uppercase text-gray-400 ml-2">Vagas</label><input name="vagas" type="number" value={formData.vagas} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-bold" /></div>
             </div>
             
             <div className="md:col-span-2">
               <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Descrição Completa</label>
               <textarea name="descricao" rows={5} value={formData.descricao} onChange={handleChange} className="w-full bg-gray-50 border-none p-4 rounded-xl font-medium focus:ring-2 focus:ring-[#0f2e20]" placeholder="Descreva os detalhes do imóvel..." />
             </div>
           </div>
        </div>

        {/* SEÇÃO 5: MAPA */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
           <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Localização no Mapa</h2>
           <MapPicker lat={formData.latitude} lng={formData.longitude} onLocationChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))} />
        </div>

        <button type="submit" disabled={loading || uploading} className="w-full bg-[#0f2e20] text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all uppercase tracking-widest text-sm">
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} Publicar Imóvel
        </button>
      </form>
    </div>
  );
}