import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { apiAddComment, type ApiComment, type ReplyMeta } from '../api/comments';
import { db } from '../config/firebase';

export type SubmitReplyPayload = {
  text: string;
  replyMeta?: ReplyMeta;
  scheduledAt?: string;
  inReplyToCommentId?: string;
};

/**
 * Best-effort Firestore mirror for realtime / future clients.
 * Requires Firestore rules allowing authenticated writes to `posts/{postId}/replyArtifacts/{commentId}`.
 */
export async function syncReplyArtifact(
  postId: string,
  commentId: string,
  payload: {
    text: string;
    replyMeta?: ReplyMeta;
    publishStatus?: string;
    scheduledFor?: string | null;
  },
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'posts', postId, 'replyArtifacts', commentId),
      {
        ...payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[postService] syncReplyArtifact', e);
    }
  }
}

export async function submitReply(postId: string, body: SubmitReplyPayload): Promise<ApiComment> {
  const comment = await apiAddComment(postId, body.text, {
    replyMeta: body.replyMeta,
    scheduledAt: body.scheduledAt,
    inReplyToCommentId: body.inReplyToCommentId,
  });
  await syncReplyArtifact(postId, comment._id, {
    text: body.text,
    replyMeta: body.replyMeta,
    publishStatus: comment.publishStatus,
    scheduledFor: comment.scheduledFor ?? null,
  });
  return comment;
}
