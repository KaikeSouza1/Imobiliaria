// Chave de liberação do módulo de contratos na navegação (menu e caixa de busca no topo do painel).
// Enquanto estiver false, as telas funcionam só pelo endereço direto.
// Para liberar: troque para true, faça commit e push.
export const MODULO_CONTRATOS_VISIVEL = false;

export function moduloContratosVisivel(): boolean {
  return MODULO_CONTRATOS_VISIVEL;
}
