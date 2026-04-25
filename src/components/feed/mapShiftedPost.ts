import type { ImageSourcePropType } from 'react-native';

import {
  formatCompactCount,
  formatRelativeTime,
  type ApiFeedPost,
  type ApiOriginalPostSnapshot,
} from '../../api/posts';
import { Images } from '../../constants/images';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

/** Maps API post + original snapshot to ShiftedPostCard props (shared by feed + read screen). */
export function mapShiftedPost(p: ApiFeedPost, original: ApiOriginalPostSnapshot) {
  const u = p.user;
  const ou = original.user;
  const author = formatUserDisplayName({
    fullName: u?.fullName,
    displayName: u?.displayName,
    username: u?.username,
  });
  const handle = u ? formatAtUsername(u.username) : formatAtUsername(null);
  const avatar: ImageSourcePropType = u?.avatarUrl ? { uri: u.avatarUrl } : Images.avatarSplit;
  const nestedAvatar: ImageSourcePropType = ou?.avatarUrl
    ? { uri: ou.avatarUrl }
    : Images.avatarSplit;
  const nestedImage: ImageSourcePropType | undefined = original.mediaUrl
    ? { uri: original.mediaUrl }
    : undefined;

  return {
    author,
    handle,
    timeLabel: formatRelativeTime(p.createdAt),
    perspectiveLabel: (p.perspective && p.perspective.trim()) || 'Perspective',
    body: p.text,
    nested: {
      author: formatUserDisplayName({
        fullName: ou?.fullName,
        displayName: ou?.displayName,
        username: ou?.username,
      }),
      handle: ou ? formatAtUsername(ou.username) : formatAtUsername(null),
      timeLabel: formatRelativeTime(original.createdAt),
      body: original.text,
      image: nestedImage,
      avatar: nestedAvatar,
    },
    avatar,
    comments: formatCompactCount(p.commentsCount ?? 0),
    likes: formatCompactCount(p.likesCount),
    views: formatCompactCount(p.viewsCount ?? 0),
  };
}
