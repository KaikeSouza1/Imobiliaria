// Quem pode usar o módulo de contratos (contratos, clientes, documentos e busca global).
// Definido pelo desenvolvedor em 25/11/2026: só o André e o login administrador.
// Os demais usuários não veem o menu e recebem "sem acesso" nas telas e rotas do módulo.
// Esta lista é provisória até os perfis da Fase 6.
// Arquivo sem dependências de servidor: é usado também no middleware.

export const USUARIOS_MODULO_CONTRATOS = ["portoadmin", "andre"] as const;

export function podeUsarModuloContratos(username: string | null | undefined): boolean {
  const u = (username || "").trim().toLowerCase();
  return (USUARIOS_MODULO_CONTRATOS as readonly string[]).includes(u);
}

// Telas e rotas de API que pertencem ao módulo.
const PREFIXOS_MODULO = [
  "/admin/locacoes", "/admin/clientes", "/admin/documentos", "/admin/busca",
  "/api/admin/locacoes", "/api/admin/clientes", "/api/admin/documentos", "/api/admin/busca", "/api/admin/modelos",
];

export function rotaDoModuloContratos(caminho: string): boolean {
  return PREFIXOS_MODULO.some((p) => caminho === p || caminho.startsWith(`${p}/`));
}
