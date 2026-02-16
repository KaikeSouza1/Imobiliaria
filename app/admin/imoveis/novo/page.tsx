"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UploadCloud, Save, ArrowLeft, Loader2, X, Plus } from "lucide-react";
import Link from "next/link";

export default function NovoImovelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Estado do formulário completo e unificado
  const [formData, setFormData] = useState({
    titulo: "", 
    codigo: "", 
    preco: "", 
    tipo: "Casa", 
    finalidade: "Venda",
    cidade: "", 
    bairro: "", 
    endereco: "", 
    area: "",
    quartos: "0", 
    banheiros: "0", 
    vagas: "0", 
    descricao: "",
    imagem_url: "", // Foto principal (capa)
    fotos_adicionais: [] as string[] // Galeria de fotos
  });

  // Função de Upload que lida com múltiplos arquivos
  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return null;

    setUploading(true);
    const data = new FormData();
    Array.from(files).forEach(file => data.append("file", file));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro no upload");
      return json.urls; // Retorna array de links do Cloudinary
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar imagem para o Cloudinary.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Upload da Capa (sempre pega apenas a primeira foto)
  const handleCapaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const urls = await uploadFiles(e.target.files);
    if (urls && urls.length > 0) {
      setFormData(prev => ({ ...prev, imagem_url: urls[0] }));
    }
  };

  // Upload da Galeria (permite adicionar várias ao que já existe)
  const handleGaleriaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const urls = await uploadFiles(e.target.files);
    if (urls) {
      setFormData(prev => ({ 
        ...prev, 
        fotos_adicionais: [...prev.fotos_adicionais, ...urls] 
      }));
    }
  };

  // Remover foto específica da galeria
  const removeFoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotos_adicionais: prev.fotos_adicionais.filter((_, i) => i !== index)
    }));
  };

  // Enviar todos os dados para o Banco de Dados
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imagem_url) {
      alert("Por favor, selecione ao menos a Foto de Capa.");
      return;
    }

    setLoading(true);

    // CORREÇÃO: Converte strings vazias em números para não dar erro no Postgres
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

  // Atualizador genérico de campos de texto e select
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/imoveis" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Novo Imóvel</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SEÇÃO 1: IMAGENS (Capa + Galeria) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">Imagens</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-600 mb-2">CAPA (Principal)</label>
              <div className="relative aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden group hover:border-green-500 transition-all">
                {formData.imagem_url ? (
                  <>
                    <Image src={formData.imagem_url} alt="Capa" fill className="object-cover" />
                    <button type="button" onClick={() => setFormData(p => ({...p, imagem_url: ""}))} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                    {uploading ? <Loader2 className="animate-spin text-green-600" /> : <UploadCloud className="text-gray-400" size={30} />}
                    <span className="text-[10px] font-bold text-gray-400 mt-2">UPLOAD CAPA</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleCapaChange} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-2">GALERIA (Fotos Adicionais)</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                <label className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 hover:border-green-400 transition-all">
                  <Plus className="text-green-600" size={24} />
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleGaleriaChange} disabled={uploading} />
                </label>

                {formData.fotos_adicionais.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                    <Image src={url} alt={`Galeria ${index}`} fill className="object-cover" />
                    <button type="button" onClick={() => removeFoto(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                  </div>
                ))}

                {uploading && (
                  <div className="aspect-square flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
                    <Loader2 className="animate-spin text-gray-300" size={20} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: DADOS BÁSICOS */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="label-admin">Título do Anúncio</label>
            <input name="titulo" required value={formData.titulo} onChange={handleChange} className="input-admin" placeholder="Ex: Casa Moderna com Suíte" />
          </div>
          <div>
            <label className="label-admin">Código / Referência</label>
            <input name="codigo" value={formData.codigo} onChange={handleChange} className="input-admin" placeholder="Ex: CA001" />
          </div>
          <div>
            <label className="label-admin">Preço (R$)</label>
            <input name="preco" required type="number" step="0.01" value={formData.preco} onChange={handleChange} className="input-admin" placeholder="0.00" />
          </div>
          <div>
            <label className="label-admin">Finalidade</label>
            <select name="finalidade" value={formData.finalidade} onChange={handleChange} className="input-admin">
              <option value="Venda">Venda</option>
              <option value="Aluguel">Aluguel</option>
            </select>
          </div>
          <div>
            <label className="label-admin">Tipo de Imóvel</label>
            <select name="tipo" value={formData.tipo} onChange={handleChange} className="input-admin">
              <option value="Casa">Casa</option>
              <option value="Apartamento">Apartamento</option>
              <option value="Sobrado">Sobrado</option>
              <option value="Terreno">Terreno</option>
              <option value="Terreno Rural">Terreno Rural</option>
              <option value="Comercial">Comercial</option>
            </select>
          </div>
        </div>

        {/* SEÇÃO 3: LOCALIZAÇÃO FLEXÍVEL */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label-admin">Cidade</label>
            <input name="cidade" list="lista-cidades" value={formData.cidade} onChange={handleChange} className="input-admin" placeholder="Digite ou selecione..." />
            <datalist id="lista-cidades">
              <option value="Porto União" />
              <option value="União da Vitória" />
            </datalist>
          </div>
          <div>
            <label className="label-admin">Bairro</label>
            <input name="bairro" list="lista-bairros" value={formData.bairro} onChange={handleChange} className="input-admin" placeholder="Digite ou selecione..." />
            <datalist id="lista-bairros">
              <option value="Centro" />
              <option value="São Cristóvão" />
              <option value="Santa Rosa" />
              <option value="São Pedro" />
            </datalist>
          </div>
          <div className="md:col-span-2">
            <label className="label-admin">Endereço Completo</label>
            <input name="endereco" value={formData.endereco} onChange={handleChange} className="input-admin" placeholder="Rua, Número, Complemento..." />
          </div>
        </div>

        {/* SEÇÃO 4: CARACTERÍSTICAS TÉCNICAS */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label-admin">Área (m²)</label>
            <input name="area" type="number" value={formData.area} onChange={handleChange} className="input-admin" placeholder="0" />
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
            <textarea name="descricao" rows={5} value={formData.descricao} onChange={handleChange} className="input-admin resize-none" placeholder="Conte detalhes sobre o imóvel..." />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading || uploading}
            className="w-full md:w-auto bg-[#0f2e20] hover:bg-green-900 text-white px-12 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            {loading ? "SALVANDO..." : "SALVAR IMÓVEL"}
          </button>
        </div>
      </form>
    </div>
  );
}