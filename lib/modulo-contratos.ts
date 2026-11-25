// Chave de liberação do módulo de contratos na navegação (menu e caixa de busca no topo).
// Enquanto desligada, as telas funcionam só pelo endereço direto.
// Para liberar: MODULO_CONTRATOS_VISIVEL=1 no .env e na Vercel (vale no próximo deploy).
export function moduloContratosVisivel(): boolean {
  return process.env.MODULO_CONTRATOS_VISIVEL === "1";
}
