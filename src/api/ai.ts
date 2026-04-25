import { apiClient } from './client';

/** Wavespeed-backed short draft for the composer (“Draft with AI”). */
export async function apiDraftPost(hint: string) {
  const { data } = await apiClient.post<{ success: boolean; data: { text: string } }>(
    '/ai/draft',
    { hint },
  );
  return data.data.text;
}

export type AiMood = 'Calm' | 'Creative' | 'Serious';

/** Mood-based AI draft (requested endpoint). */
export async function apiGeneratePost(body: { prompt: string; mood: AiMood }) {
  const { data } = await apiClient.post<{ success: boolean; data: { text: string } }>(
    '/ai/generate-post',
    body,
  );
  return data.data.text;
}

export type AILabelRow = {
  key: string;
  title: string;
  subtitle: string;
  icon: 'heart' | 'chat' | 'help' | 'add' | 'refresh' | 'flame' | 'crown';
};

export type AILabelsPayload = {
  note: string;
  labels: AILabelRow[];
  learnMore?: { title: string; route: 'AIModeratorInsights' };
};

export async function apiGetAiLabels() {
  const { data } = await apiClient.get<{ success: boolean; data: AILabelsPayload }>(
    '/ai/labels',
  );
  return data.data;
}
