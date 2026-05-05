export interface Anime {
  slug: string;
  titulo: string;
  imagen: string;
  anio?: string;
  tipo?: string;
  cap?: string | null;
}

export interface Episode {
  numero: number;
  titulo: string;
  thumbnail: string;
}

export interface AnimeInfo {
  titulo: string;
  imagen: string;
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

export interface VideoServer {
  nombre: string;
  url: string;
}

export interface VideoServerResponse {
  servers: VideoServer[];
}
