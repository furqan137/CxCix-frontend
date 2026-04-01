import { create } from 'zustand';

import type { MoodId } from '../constants/moods';

export type BookmarkCollectionId = MoodId;

export interface BookmarkItem {
  id: string;
  mood: BookmarkCollectionId;
  author: string;
  handle: string;
  timeLabel: string;
  body: string;
}

interface BookmarksState {
  /** Bookmarks grouped into “collections” by mood */
  items: BookmarkItem[];
  save: (item: Omit<BookmarkItem, 'id'>) => void;
  remove: (id: string) => void;
}

const seed: BookmarkItem[] = [
  {
    id: 'seed-serious-1',
    mood: 'serious',
    author: 'Elena Fisher',
    handle: '@elenadesign',
    timeLabel: '2h',
    body: `Consistency isn't about intensity; it's about discipline. Turning vision into reality requires a steady hand and a clear mind. Onward.`,
  },
];

export const useBookmarksStore = create<BookmarksState>((set) => ({
  items: seed,
  save: (item) =>
    set((s) => ({
      items: [
        {
          id: `${item.mood}-${Date.now()}`,
          ...item,
        },
        ...s.items,
      ],
    })),
  remove: (id) =>
    set((s) => ({
      items: s.items.filter((x) => x.id !== id),
    })),
}));

