import { create } from 'zustand';

export type AIMode = 'gentle' | 'balanced' | 'unfiltered';

export const SLIDER_KEYS = [
  'outrage',
  'drama',
  'toxicity',
  'repetition',
  'diversity',
  'depth',
  'humor',
  'locality',
  'politics',
  'intensity',
] as const;

export type SliderKey = (typeof SLIDER_KEYS)[number];

const DEFAULT_SLIDERS: Record<SliderKey, number> = {
  outrage: 50,
  drama: 35,
  toxicity: 25,
  repetition: 60,
  diversity: 50,
  depth: 65,
  humor: 40,
  locality: 50,
  politics: 30,
  intensity: 50,
};

interface AIModeratorState {
  mode: AIMode;
  sliders: Record<SliderKey, number>;
  explanations: boolean;
  hideToxicReplies: boolean;
  setMode: (m: AIMode) => void;
  setSlider: (key: SliderKey, value: number) => void;
  setExplanations: (v: boolean) => void;
  setHideToxicReplies: (v: boolean) => void;
  resetPersonalization: () => void;
}

export const useAIModeratorStore = create<AIModeratorState>((set) => ({
  mode: 'gentle',
  sliders: { ...DEFAULT_SLIDERS },
  explanations: true,
  hideToxicReplies: true,
  setMode: (mode) => set({ mode }),
  setSlider: (key, value) =>
    set((s) => ({
      sliders: { ...s.sliders, [key]: Math.round(value) },
    })),
  setExplanations: (explanations) => set({ explanations }),
  setHideToxicReplies: (hideToxicReplies) => set({ hideToxicReplies }),
  resetPersonalization: () =>
    set({
      mode: 'gentle',
      sliders: { ...DEFAULT_SLIDERS },
      explanations: true,
      hideToxicReplies: true,
    }),
}));
