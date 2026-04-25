import { apiClient } from '../api/client';

export type RewriteType = 'funny' | 'serious' | 'short' | 'expand' | 'rewrite';

export async function apiRewriteReply(text: string, type: RewriteType): Promise<string> {
  const { data } = await apiClient.post<{ success: boolean; data: { text: string } }>(
    '/ai/rewrite',
    { text, type },
  );
  return data.data.text;
}
