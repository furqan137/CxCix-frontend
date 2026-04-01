import type { ImageSourcePropType } from 'react-native';

import { Images } from './images';

export type MediaId = 'dock' | 'hammock' | 'calm' | 'cat' | 'pierWalk' | 'splitPortrait';

/** Resolve modal / preview images by stable id (navigation params stay serializable). */
export const MEDIA_BY_ID: Record<MediaId, ImageSourcePropType> = {
  dock: Images.feedPost1,
  hammock: Images.feedPost2,
  calm: Images.feedPost3,
  cat: Images.mediaCat,
  pierWalk: Images.mediaPierWalk,
  splitPortrait: Images.avatarSplit,
};
