
export interface Imovel {
  id: number;
  titulo: string;
  descricao: string;
  preco: number;
  tipo: string;
  finalidade: string;
  cidade: string;
  bairro: string;
  endereco: string;
  area: number;
  quartos: number;
  banheiros: number;
  vagas: number;
  imagem_url: string;
  codigo: string;
  status: string;
  latitude: number;
  longitude: number;
  destaque: boolean;
  ativo: boolean;
  visualizacoes: number;
  criado_em: string;
  atualizado_em: string;
  fotos_adicionais: string[];
  video_url?: string | null;
}
