"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, Plus } from "lucide-react";

interface Usuario {
  id: number;
  username: string;
  nome: string;
  role: string;
}

export default function CorretoresPage() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [username, setUsername] = useState("");
  const [nome, setNome] = useState("");
  const [role, setRole] = useState("corretor");

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/corretores");
      const data = await res.json();
      setUsuarios(data || []);
    } catch (e) {
      console.error(e);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const handleCreate = async () => {
    if (!username || !nome) return alert("Preencha usuário e nome");
    try {
      const res = await fetch("/api/admin/corretores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, nome, role })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Erro");
      setUsername(""); setNome(""); setRole("corretor");
      fetchUsuarios();
    } catch (e) {
      alert("Erro ao criar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Confirma exclusão deste corretor?")) return;
    try {
      const res = await fetch(`/api/admin/corretores?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchUsuarios();
      else {
        const data = await res.json();
        alert(data.error || "Erro ao deletar");
      }
    } catch {
      alert("Erro ao deletar");
    }
  };

  if (loading) return (
    <div className="py-16 text-center">
      <Loader2 className="animate-spin text-green-600 mx-auto" size={36} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Gerenciar Corretores</h1>
          <p className="text-sm text-gray-500">Cadastre e gerencie os usuários corretores do CRM.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuário (login)" className="p-3 border rounded-xl" />
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" className="p-3 border rounded-xl" />
          <select value={role} onChange={e => setRole(e.target.value)} className="p-3 border rounded-xl">
            <option value="corretor">Corretor</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleCreate} className="bg-green-700 text-white rounded-xl p-3 font-bold flex items-center justify-center gap-2">
            <Plus size={16} /> Criar
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border">
        <h2 className="font-bold mb-4">Lista de Corretores</h2>
        {usuarios.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum corretor cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 border rounded-xl">
                <div>
                  <div className="font-bold">{u.nome}</div>
                  <div className="text-xs text-gray-500">{u.username} • {u.role}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDelete(u.id)} className="text-red-500 p-2 rounded-lg hover:bg-red-50">
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
