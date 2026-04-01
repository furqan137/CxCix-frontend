import { create } from 'zustand';

import type { MoodId } from '../constants/moods';

interface MoodState {
  /** Active mood — drives feed + accent colors */
  currentMood: MoodId;
  setMood: (mood: MoodId) => void;
}

export const useMoodStore = create<MoodState>((set) => ({
  currentMood: 'calm',
  setMood: (mood) => set({ currentMood: mood }),
}));
