import { apiClient } from './client';

export type ApiCommentAuthor = {
  _id: string;
  username: string;
  fullName?: string;
  displayName: string;
  avatarUrl: string;
};

export type ReplyMediaItem = {
  type: 'image' | 'video';
  url: string;
  publicId?: string;
};

export type ReplyPollOption = {
  id: string;
  text: string;
  votes?: number;
};

export type ReplyPoll = {
  question: string;
  options: ReplyPollOption[];
  voters?: { user: string; optionId: string }[];
};

export type ReplyLocation = {
  lat: number;
  lng: number;
  name: string;
};

export type ReplyMeta = {
  media?: ReplyMediaItem[];
  poll?: ReplyPoll;
  location?: ReplyLocation;
};

export type ApiComment = {
  _id: string;
  text: string;
  category: string;
  author: ApiCommentAuthor | null;
  createdAt: string;
  replyMeta?: ReplyMeta;
  publishStatus?: 'live' | 'scheduled';
  scheduledFor?: string | null;
  /** Present when this comment is a reply to another on the same post. */
  inReplyTo?: string | null;
  likesCount?: number;
  viewsCount?: number;
  repliesCount?: number;
  isLiked?: boolean;
  /** Nested replies (only on root comments from grouped API). */
  replies?: ApiComment[];
};

export type CommentsGroupedResponse = {
  postId: string;
  grouped: Record<string, ApiComment[]>;
  flat: ApiComment[];
};

export async function apiGetCommentsGrouped(postId: string) {
  const { data } = await apiClient.get<{ success: boolean; data: CommentsGroupedResponse }>(
    `/posts/${encodeURIComponent(postId)}/comments/grouped`,
  );
  return data.data;
}

export async function apiAddComment(
  postId: string,
  text: string,
  options?: {
    inReplyToCommentId?: string;
    replyMeta?: ReplyMeta;
    scheduledAt?: string;
  },
) {
  const { data } = await apiClient.post<{ success: boolean; data: { comment: ApiComment } }>(
    `/posts/${encodeURIComponent(postId)}/comments`,
    {
      text,
      ...(options?.inReplyToCommentId
        ? { inReplyToCommentId: options.inReplyToCommentId }
        : {}),
      ...(options?.replyMeta ? { replyMeta: options.replyMeta } : {}),
      ...(options?.scheduledAt ? { scheduledAt: options.scheduledAt } : {}),
    },
  );
  return data.data.comment;
}

export async function apiCastPollVote(postId: string, commentId: string, optionId: string) {
  const { data } = await apiClient.post<{ success: boolean; data: { comment: ApiComment } }>(
    `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/poll-vote`,
    { optionId },
  );
  return data.data.comment;
}

export async function apiToggleCommentLike(postId: string, commentId: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { likesCount: number; isLiked: boolean };
  }>(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/like`);
  return data.data;
}

export async function apiRecordCommentView(postId: string, commentId: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { viewsCount: number };
  }>(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/view`);
  return data.data;
}
