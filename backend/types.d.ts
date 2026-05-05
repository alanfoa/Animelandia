// Tipos para el backend de Animelandia

export interface CacheEntry {
  data: any;
  time: number;
}

export interface Episode {
  numero: number;
  thumbnail: string;
  titulo?: string;
}

export interface AnimeInfo {
  descripcion: string;
  rating: string;
  anio: string;
  tipo: string;
  generos: string[];
  episodios: Episode[];
}

export interface SearchResult {
  titulo: string;
  imagen: string;
  slug: string;
  anio: string;
  tipo: string;
  cap: string | null;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

export interface ApiResponse<T> {
  results?: T;
  pagination?: Pagination;
  data?: T;
  error?: string;
}

export interface FeaturedItem {
  titulo: string;
  slug: string;
  id: number;
  backdrop: string;
  tipo: string;
  anio: string;
  status: number;
  synopsis: string;
  generos: string[];
}
