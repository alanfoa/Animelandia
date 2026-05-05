import apiClient from './client';
import { SearchResult, AnimeInfo, VideoServerResponse } from '../types';

export async function getLatest(): Promise<SearchResult[]> {
  const res = await apiClient.get('/latest');
  return res.data;
}

export async function searchAnime(query: string, page: number = 1, filters: Record<string, string> = {}): Promise<{ results: SearchResult[], pagination: any }> {
  const params = new URLSearchParams();
  
  if (query) {
    const decodedQ = decodeURIComponent(query);
    if (decodedQ.includes('=') || decodedQ.includes('&')) {
      const temp = new URLSearchParams(decodedQ);
      for (const [key, value] of temp) params.append(key, value);
    } else {
      params.append('search', decodedQ);
    }
  }
  
  for (const [key, value] of Object.entries(filters)) {
    params.append(key, value);
  }
  
  const queryString = params.toString();
  const url = queryString 
    ? `/search?${queryString}&page=${page}`
    : `/search?page=${page}`;
  
  const res = await apiClient.get(url);
  return res.data;
}

export async function getAnimeInfo(slug: string): Promise<AnimeInfo> {
  const res = await apiClient.get(`/anime-info?slug=${slug}`);
  return res.data;
}

export async function getVideoServers(slug: string, cap: string): Promise<VideoServerResponse> {
  const res = await apiClient.get(`/get-video?slug=${slug}&cap=${cap}`);
  return res.data || { servers: [] };
}
