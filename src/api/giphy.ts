import { apiClient } from './client';

export type GiphyGif = {
  id: string;
  title?: string;
  url?: string;
  images?: {
    fixed_width_small?: { url: string; width?: string; height?: string };
    fixed_width?: { url: string; width?: string; height?: string };
    original?: { url: string; width?: string; height?: string };
  };
};

export async function apiSearchGifs(q: string, opts?: { limit?: number; offset?: number }) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: { items: GiphyGif[]; pagination?: { total_count?: number; count?: number; offset?: number } };
  }>('/giphy/search', { params: { q, limit: opts?.limit, offset: opts?.offset } });
  return data.data.items;
}

