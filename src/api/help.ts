import { apiClient } from './client';

export type FaqIndexItem = { id: string; q: string };

export type FaqSection = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  items: FaqIndexItem[];
};

export type FaqIndexPayload = {
  title: string;
  introTitle: string;
  introBody: string;
  sections: FaqSection[];
  helpCenterUrl?: string;
};

export async function apiGetFaqIndex() {
  const { data } = await apiClient.get<{ success: boolean; data: FaqIndexPayload }>('/help/faq');
  return data.data;
}

export type FaqItemPayload = {
  id: string;
  sectionId: string;
  question: string;
  answer: string;
  deepLinkRoute?: string | null;
};

export async function apiGetFaqItem(itemId: string) {
  const { data } = await apiClient.get<{ success: boolean; data: FaqItemPayload }>(
    `/help/faq/item/${encodeURIComponent(itemId)}`,
  );
  return data.data;
}

