// Catálogo dos modelos de documento disponíveis para gerar.
import type { Modelo } from "./tipos";
import { contratoLocacao } from "./contrato-locacao";
import { administracaoLocacao, intermediacaoVenda, termoEntregaChaves, notificacaoSimples, notificacaoExtrajudicial } from "./outros-modelos";

export const MODELOS: Modelo[] = [
  contratoLocacao,
  termoEntregaChaves,
  notificacaoSimples,
  notificacaoExtrajudicial,
  administracaoLocacao,
  intermediacaoVenda,
];

export function buscarModelo(id: string | null | undefined): Modelo | undefined {
  return MODELOS.find((m) => m.id === id);
}

// Versão sem funções, para mandar ao navegador.
export function resumoModelo(m: Modelo) {
  return { id: m.id, titulo: m.titulo, descricao: m.descricao, vinculo: m.vinculo, tipoDocumento: m.tipoDocumento, campos: m.campos };
}
export type ResumoModelo = ReturnType<typeof resumoModelo>;
