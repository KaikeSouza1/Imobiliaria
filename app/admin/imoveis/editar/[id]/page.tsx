"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { UploadCloud, Save, ArrowLeft, Loader2, X, Plus } from "lucide-react";
import Link from "next/link";

export default function EditarImovelPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id; // No client component do Next 15 ele já extrai o ID

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: "", codigo: "", preco: "", tipo: "Casa", finalidade: "Venda",
    cidade: "", bairro: "", endereco: "", area: "",
    quartos: "0", banheiros: "0", vagas: "0", descricao: "",
    imagem_url: "", fotos_adicionais: [] as string[], ativo: true
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
          preco: data.preco.toString(),
          area: data.area?.toString() || "0",
          quartos: data.quartos?.toString() || "0",
          banheiros: data.banheiros?.toString() || "0",
          vagas: data.vagas?.toString() || "0",
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
    } finally {
      setSaving(false);
    }
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
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <label className="label-admin font-bold text-gray-600 block mb-2">CAPA ATUAL</label>
            <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
               <Image src={formData.imagem_url || "/logo.png"} fill className="object-cover" alt="Capa" />
               <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <UploadCloud className="text-white" />
                  <input type="file" className="hidden" onChange={async (e) => {
                    const urls = await uploadFiles(e.target.files);
                    if (urls) setFormData(p => ({...p, imagem_url: urls[0]}));
                  }} />
               </label>
            </div>
          </div>
          <div className="col-span-2">
            <label className="label-admin font-bold text-gray-600 block mb-2">GALERIA</label>
            <div className="grid grid-cols-4 gap-2">
               <label className="aspect-square bg-gray-50 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-green-50 transition-colors">
                  <Plus className="text-green-600" />
                  <input type="file" multiple className="hidden" onChange={async (e) => {
                    const urls = await uploadFiles(e.target.files);
                    if (urls) setFormData(p => ({...p, fotos_adicionais: [...p.fotos_adicionais, ...urls]}));
                  }} />
               </label>
               {formData.fotos_adicionais.map((url, i) => (
                 <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                    <Image src={url} fill className="object-cover" alt="Galeria" />
                    <button type="button" onClick={() => setFormData(p => ({...p, fotos_adicionais: p.fotos_adicionais.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10}/></button>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* DADOS (IGUAL AO CADASTRO) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="label-admin">Título</label><input name="titulo" required value={formData.titulo} onChange={handleChange} className="input-admin" /></div>
          <div><label className="label-admin">Preço (R$)</label><input name="preco" type="number" step="0.01" required value={formData.preco} onChange={handleChange} className="input-admin" /></div>
          <div><label className="label-admin">Finalidade</label>
            <select name="finalidade" value={formData.finalidade} onChange={handleChange} className="input-admin">
              <option value="Venda">Venda</option><option value="Aluguel">Aluguel</option>
            </select>
          </div>
          <div><label className="label-admin">Cidade</label><input name="cidade" list="cidades" value={formData.cidade} onChange={handleChange} className="input-admin" /><datalist id="cidades"><option value="Porto União" /><option value="União da Vitória" /></datalist></div>
          <div><label className="label-admin">Bairro</label><input name="bairro" list="bairros" value={formData.bairro} onChange={handleChange} className="input-admin" /><datalist id="bairros"><option value="Centro" /><option value="São Cristóvão" /></datalist></div>
        </div>

        <button type="submit" disabled={saving || uploading} className="w-full bg-[#0f2e20] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
          {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} SALVAR ALTERAÇÕES
        </button>
      </form>
    </div>
  );
}