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

export const useBookmarksStore = create<BookmarksState>((set) => ({
  items: [],
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

