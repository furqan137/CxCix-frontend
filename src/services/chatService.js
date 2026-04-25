import { get, ref, remove, push, update, onValue, set, onDisconnect } from 'firebase/database';

import { auth, rtdb } from '../config/firebase';

const db = rtdb;

/**
 * One stable "me" for buildChatId, inbox paths, and message senderId. Match across all screens
 * (Messaging list, ChatThread, unread badge) or both sides listen on different RTDB keys.
 * Prefer API `firebaseUid` (same as Mongo user record + other user's peer id) so it matches
 * the peer string your contacts use in sendChat / participantIds; then Auth uid, then Mongo.
 * @param {{ _id?: string; firebaseUid?: string } | null | undefined} user
 */
export function getMyChatParticipantId(user) {
  if (user && typeof user === 'object') {
    const apiFb = user.firebaseUid && String(user.firebaseUid).trim();
    const mongo = user._id != null ? String(user._id) : '';
    const authUid = auth.currentUser?.uid?.trim();
    if (apiFb) return apiFb;
    if (authUid) return authUid;
    if (mongo) return mongo;
  }
  return auth.currentUser?.uid?.trim() || '';
}

/**
 * The other person in a DM: prefer Firebase (matches how messages/inbox are keyed) then Mongo.
 * @param {{ _id: string; firebaseUid?: string } | null | undefined} profile
 */
export function getPeerChatParticipantId(profile) {
  if (!profile || typeof profile !== 'object') return '';
  const fb = profile.firebaseUid && String(profile.firebaseUid).trim();
  if (fb) return fb;
  if (profile._id != null) return String(profile._id);
  return '';
}

/**
 * Same DM id for both users: sorted string ids, joined with "_".
 * @param {string} userId1
 * @param {string} userId2
 */
export function buildChatId(userId1, userId2) {
  return [String(userId1), String(userId2)].sort().join('_');
}

function previewFromPayload(type, text, fileName) {
  const t = (text && String(text).trim()) || '';
  switch (type) {
    case 'call':
      return t || '📞 Call';
    case 'video':
      return t || '🎬 Video';
    case 'audio':
      return '🎤 Voice message';
    case 'image':
      return t || '📷 Photo';
    case 'gif':
      return t || 'GIF';
    case 'file':
      return `📎 ${fileName || 'File'}`;
    default:
      return t.slice(0, 120) || 'Message';
  }
}

/**
 * @param {Record<string, unknown>} raw
 * @param {string} id
 */
function normalizeMessageRow(id, raw) {
  const createdAt =
    typeof raw.createdAt === 'number' ? new Date(raw.createdAt) : null;
  const editedAt =
    typeof raw.editedAt === 'number' ? new Date(raw.editedAt) : null;
  let seenBy = [];
  if (raw.seenBy && typeof raw.seenBy === 'object' && !Array.isArray(raw.seenBy)) {
    seenBy = Object.keys(raw.seenBy);
  } else if (Array.isArray(raw.seenBy)) {
    seenBy = raw.seenBy.map((x) => String(x));
  }
  const callMode =
    raw.callMode === 'video' || raw.callMode === 'audio' ? raw.callMode : null;
  const callStatus =
    raw.callStatus === 'answered' || raw.callStatus === 'missed' ? raw.callStatus : null;
  return {
    id,
    type: typeof raw.type === 'string' ? raw.type : 'text',
    text: typeof raw.text === 'string' ? raw.text : '',
    callMode,
    callStatus,
    senderId: typeof raw.senderId === 'string' ? raw.senderId : String(raw.senderId || ''),
    mediaUrl: typeof raw.mediaUrl === 'string' ? raw.mediaUrl : null,
    thumbnail: typeof raw.thumbnail === 'string' ? raw.thumbnail : null,
    fileName: typeof raw.fileName === 'string' ? raw.fileName : null,
    mimeType: typeof raw.mimeType === 'string' ? raw.mimeType : null,
    duration: typeof raw.duration === 'number' ? raw.duration : null,
    createdAt,
    editedAt,
    seenBy,
    reactions:
      raw.reactions && typeof raw.reactions === 'object' ? { ...raw.reactions } : {},
  };
}

/**
 * @param {string} chatId
 * @param {string} senderId
 * @param {string[]} participantIds
 * @param {{
 *   type?: string;
 *   text?: string;
 *   mediaUrl?: string | null;
 *   thumbnail?: string | null;
 *   fileName?: string | null;
 *   mimeType?: string | null;
 *   duration?: number | null;
 *   callMode?: 'video' | 'audio';
 *   callStatus?: 'answered' | 'missed';
 * }} payload
 */
export async function sendChatMessage(chatId, senderId, participantIds, payload) {
  if (!auth.currentUser) {
    const err = new Error(
      'Not signed in to Firebase — chat is unavailable. Try signing out and back in, and ensure the server can issue a Firebase custom token (Firebase Admin env vars).',
    );
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[chatService] sendChatMessage: auth.currentUser is null after login. RTDB will reject with permission_denied.');
    }
    throw err;
  }
  const type = payload.type || 'text';
  const text = typeof payload.text === 'string' ? payload.text : '';
  const mediaUrl = payload.mediaUrl ?? null;
  const thumbnail = payload.thumbnail ?? null;
  const fileName = payload.fileName ?? null;
  const mimeType = payload.mimeType ?? null;
  const duration = typeof payload.duration === 'number' ? payload.duration : null;
  const callMode = payload.callMode;
  const callStatus = payload.callStatus;

  const now = Date.now();
  const msg = {
    type,
    text,
    mediaUrl,
    thumbnail,
    fileName,
    mimeType,
    duration,
    senderId,
    createdAt: now,
    /** Who has this message in their “seen” set (in addition to read-cursor on chat). */
    seenBy: { [String(senderId)]: true },
    reactions: {},
  };
  if (type === 'call') {
    if (callMode === 'video' || callMode === 'audio') {
      msg.callMode = callMode;
    }
    if (callStatus === 'answered' || callStatus === 'missed') {
      msg.callStatus = callStatus;
    }
  }

  const newMsgRef = push(ref(db, `messages/${chatId}`));
  const msgId = newMsgRef.key;
  if (!msgId) throw new Error('Failed to push message');

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[chatService] Sending message', { chatId, msgId, senderId });
  }

  const preview = previewFromPayload(type, text, fileName);
  const pUniq = [...new Set(participantIds.map(String))].sort();
  const updates = {};
  updates[`messages/${chatId}/${msgId}`] = msg;

  updates[`chats/${chatId}/lastMessageText`] = preview;
  updates[`chats/${chatId}/lastMessageAt`] = now;
  updates[`chats/${chatId}/lastSenderId`] = String(senderId);
  for (const p of pUniq) {
    updates[`chats/${chatId}/participants/${p}`] = true;
  }
  updates[`chats/${chatId}/readAt/${String(senderId)}`] = now;

  for (const p of pUniq) {
    const isMe = String(p) === String(senderId);
    updates[`inboxForUser/${p}/${chatId}/lastMessageAt`] = now;
    updates[`inboxForUser/${p}/${chatId}/lastMessageText`] = preview;
    updates[`inboxForUser/${p}/${chatId}/lastSenderId`] = String(senderId);
    updates[`inboxForUser/${p}/${chatId}/readByMe`] = isMe ? now : 0;
  }

  await update(ref(db), updates);
}

/**
 * @param {string} chatId
 * @param {string[]} pUniq
 */
async function setEmptyInboxPreview(chatId, pUniq) {
  const updates = {
    [`chats/${chatId}/lastMessageText`]: '',
    [`chats/${chatId}/lastMessageAt`]: 0,
    [`chats/${chatId}/lastSenderId`]: '',
  };
  for (const p of pUniq) {
    updates[`inboxForUser/${p}/${chatId}/lastMessageAt`] = 0;
    updates[`inboxForUser/${p}/${chatId}/lastMessageText`] = '';
    updates[`inboxForUser/${p}/${chatId}/lastSenderId`] = '';
    updates[`inboxForUser/${p}/${chatId}/readByMe`] = 0;
  }
  await update(ref(db), updates);
}

/**
 * Recompute `chats/` and `inboxForUser/` last-message preview from `messages/{chatId}`.
 * @param {string} chatId
 * @param {string[]} participantIds
 */
export async function recomputeChatInboxPreview(chatId, participantIds) {
  const pUniq = [...new Set(participantIds.map(String))].sort();
  const snap = await get(ref(db, `messages/${chatId}`));
  const data = snap.val();
  if (!data || typeof data !== 'object') {
    await setEmptyInboxPreview(chatId, pUniq);
    return;
  }

  let best = null;
  for (const [_k, v] of Object.entries(data)) {
    if (!v || typeof v !== 'object') continue;
    const ca = v.createdAt;
    if (typeof ca !== 'number') continue;
    if (!best || ca > best.createdAt) {
      best = { ...v, createdAt: ca };
    }
  }
  if (!best) {
    await setEmptyInboxPreview(chatId, pUniq);
    return;
  }

  const preview = previewFromPayload(
    best.type || 'text',
    typeof best.text === 'string' ? best.text : '',
    best.fileName != null ? String(best.fileName) : null,
  );
  const now = best.createdAt;
  const lastSender = String(best.senderId != null ? best.senderId : '');

  const updates = {
    [`chats/${chatId}/lastMessageText`]: preview,
    [`chats/${chatId}/lastMessageAt`]: now,
    [`chats/${chatId}/lastSenderId`]: lastSender,
  };
  for (const p of pUniq) {
    const isMe = String(p) === lastSender;
    updates[`inboxForUser/${p}/${chatId}/lastMessageAt`] = now;
    updates[`inboxForUser/${p}/${chatId}/lastMessageText`] = preview;
    updates[`inboxForUser/${p}/${chatId}/lastSenderId`] = lastSender;
    updates[`inboxForUser/${p}/${chatId}/readByMe`] = isMe ? now : 0;
  }
  await update(ref(db), updates);
}

/**
 * @param {string} chatId
 * @param {string} messageId
 * @param {string[]} participantIds
 * @param {{ text?: string; [key: string]: unknown }} patch — partial message fields; sets `editedAt` when `text` changes
 */
export async function updateChatMessage(chatId, messageId, participantIds, patch) {
  const p = { ...patch };
  if (typeof p.text === 'string') {
    p.editedAt = Date.now();
  }
  await update(ref(db, `messages/${chatId}/${messageId}`), p);
  await recomputeChatInboxPreview(chatId, participantIds);
}

/**
 * @param {string} chatId
 * @param {string} messageId
 * @param {string[]} participantIds
 */
export async function deleteChatMessage(chatId, messageId, participantIds) {
  await remove(ref(db, `messages/${chatId}/${messageId}`));
  await recomputeChatInboxPreview(chatId, participantIds);
}

/**
 * Realtime listener for messages. Unsubscribe returned function on unmount.
 * @param {string} chatId
 * @param {(rows: any[]) => void} callback
 */
export function listenMessages(chatId, callback) {
  if (!chatId) {
    callback([]);
    return () => {};
  }
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[chatService] Listening to messages:', chatId);
  }
  const messagesRef = ref(db, `messages/${chatId}`);

  const handler = (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const rows = Object.keys(data)
      .map((key) => normalizeMessageRow(key, data[key] || {}))
      .sort((a, b) => {
        const ta = a.createdAt ? a.createdAt.getTime() : 0;
        const tb = b.createdAt ? b.createdAt.getTime() : 0;
        return ta - tb;
      });
    callback(rows);
  };

  return onValue(
    messagesRef,
    handler,
    (err) => {
      console.warn('[chatService] listenMessages', err);
      callback([]);
    },
  );
}

/**
 * @param {string} chatId
 * @param {string} messageId
 * @param {string} userId
 * @param {string} emoji
 */
export async function setMessageReaction(chatId, messageId, userId, emoji) {
  const path = `messages/${chatId}/${messageId}/reactions/${String(userId)}`;
  await update(ref(db), { [path]: emoji });
}

/**
 * Remove the current user’s reaction on a message.
 * @param {string} chatId
 * @param {string} messageId
 * @param {string} userId
 */
export async function removeMessageReaction(chatId, messageId, userId) {
  const path = `messages/${chatId}/${messageId}/reactions/${String(userId)}`;
  await remove(ref(db, path));
}

/**
 * Inbox line preview for chat list
 * @param {string} chatId
 * @param {(meta: { lastMessageText: string; lastMessageAt: Date | null } | null) => void} callback
 */
export function listenChatMeta(chatId, callback) {
  if (!chatId) {
    callback(null);
    return () => {};
  }
  const dref = ref(db, `chats/${chatId}`);
  const fn = (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.val() || {};
    const t = data.lastMessageAt;
    const lastMessageAt = typeof t === 'number' ? new Date(t) : null;
    callback({
      lastMessageText: typeof data.lastMessageText === 'string' ? data.lastMessageText : '',
      lastMessageAt,
    });
  };
  return onValue(
    dref,
    fn,
    (err) => {
      console.warn('[chatService] listenChatMeta', err);
      callback(null);
    },
  );
}

/**
 * @param {string} chatId
 * @param {string} myParticipantId
 */
export async function markChatRead(chatId, myParticipantId) {
  if (!chatId || !myParticipantId) return;
  const now = Date.now();
  const updates = {};
  updates[`chats/${chatId}/readAt/${String(myParticipantId)}`] = now;
  updates[`inboxForUser/${String(myParticipantId)}/${chatId}/readByMe`] = now;
  await update(ref(db), updates);
}

/**
 * Unread DMs: inbox entries where last message from other and readByMe is older or null.
 * @param {string} myParticipantId
 * @param {(n: number) => void} onCount
 */
export function subscribeUnreadDmCount(myParticipantId, onCount) {
  if (!myParticipantId) {
    onCount(0);
    return () => {};
  }
  const inboxRef = ref(db, `inboxForUser/${myParticipantId}`);

  const fn = (snap) => {
    const val = snap.val() || {};
    let n = 0;
    for (const entry of Object.values(val)) {
      if (!entry || typeof entry !== 'object') continue;
      const lastAt = typeof entry.lastMessageAt === 'number' ? entry.lastMessageAt : 0;
      const readBy = entry.readByMe;
      const readT = typeof readBy === 'number' ? readBy : 0;
      const from = entry.lastSenderId != null ? String(entry.lastSenderId) : '';
      if (from && from !== String(myParticipantId) && lastAt > readT) n += 1;
    }
    onCount(n);
  };

  return onValue(
    inboxRef,
    fn,
    () => onCount(0),
  );
}

/**
 * Heuristic “is this bubble mine?”: Mongo _id, firebaseUid, getMyChatParticipantId, and auth uid
 * can all appear as message.senderId depending on when / how the message was written.
 * @param {string} senderId
 * @param {{ _id?: string; firebaseUid?: string } | null} [user]
 * @param {string} [authUid]
 */
export function isMessageFromMe(senderId, user, authUid) {
  const s = String(senderId || '');
  if (!s) return false;
  const uids = new Set();
  if (user?._id != null) uids.add(String(user._id));
  if (user?.firebaseUid) uids.add(String(user.firebaseUid).trim());
  const primary = user ? getMyChatParticipantId(user) : '';
  if (primary) uids.add(String(primary));
  if (authUid) uids.add(String(authUid));
  if (auth.currentUser?.uid) uids.add(String(auth.currentUser.uid));
  for (const id of uids) {
    if (id && s === id) return true;
  }
  return false;
}

let presenceHeartbeat = null;
let presenceUserId = null;

/**
 * Sets RTDB /status/{userId} and keeps lastSeen fresh while the app is active.
 * @param {string} userId chat participant id (usually getMyChatParticipantId)
 */
export function startPresence(userId) {
  if (!userId) return;
  stopPresence();
  presenceUserId = String(userId);
  const sref = ref(db, `status/${presenceUserId}`);
  const goOnline = () => {
    set(sref, { online: true, lastSeen: Date.now() }).catch(() => {});
  };
  onDisconnect(sref)
    .set({ online: false, lastSeen: Date.now() })
    .catch(() => {});
  goOnline();
  presenceHeartbeat = setInterval(goOnline, 45_000);
}

export function stopPresence() {
  if (presenceHeartbeat) {
    clearInterval(presenceHeartbeat);
    presenceHeartbeat = null;
  }
  if (presenceUserId) {
    const sref = ref(db, `status/${presenceUserId}`);
    set(sref, { online: false, lastSeen: Date.now() }).catch(() => {});
  }
  presenceUserId = null;
}

/**
 * @param {string} userId
 * @param {(v: { online: boolean; lastSeen: number } | null) => void} callback
 */
export function subscribePeerStatus(userId, callback) {
  if (!userId) {
    callback(null);
    return () => {};
  }
  const sref = ref(db, `status/${String(userId)}`);
  const fn = (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const v = snap.val() || {};
    callback({
      online: !!v.online,
      lastSeen: typeof v.lastSeen === 'number' ? v.lastSeen : 0,
    });
  };
  return onValue(sref, fn, () => callback(null));
}

/**
 * @param {string} chatId
 * @param {string} peerId
 * @param {(readAt: number) => void} callback — timestamp when peer last read (0 = never)
 */
export function subscribePeerReadAt(chatId, peerId, callback) {
  if (!chatId || !peerId) {
    callback(0);
    return () => {};
  }
  const rref = ref(db, `chats/${chatId}/readAt/${String(peerId)}`);
  const fn = (snap) => {
    const t = snap.val();
    callback(typeof t === 'number' ? t : 0);
  };
  return onValue(rref, fn, () => callback(0));
}

/**
 * @param {string} chatId
 * @param {string} userId
 * @param {boolean} typing
 */
export async function setTypingState(chatId, userId, typing) {
  if (!chatId || !userId) return;
  const tref = ref(db, `typing/${chatId}/${String(userId)}`);
  if (typing) {
    await set(tref, true);
  } else {
    await remove(tref);
  }
}

/**
 * @param {string} chatId
 * @param {string} myUserId
 * @param {(otherIsTyping: boolean) => void} callback
 */
export function subscribeOtherUserTyping(chatId, myUserId, callback) {
  if (!chatId || !myUserId) {
    callback(false);
    return () => {};
  }
  const tref = ref(db, `typing/${chatId}`);
  const fn = (snap) => {
    if (!snap.exists()) {
      callback(false);
      return;
    }
    const val = snap.val() || {};
    let other = false;
    for (const [uid, v] of Object.entries(val)) {
      if (String(uid) === String(myUserId)) continue;
      if (v === true) {
        other = true;
        break;
      }
    }
    callback(other);
  };
  return onValue(tref, fn, () => callback(false));
}

/**
 * 1 = last message in thread is from peer and is newer than readByMe, else 0.
 * @param {string} selfChatParticipantId
 * @param {string} chatId
 * @param {(n: 0 | 1) => void} callback
 */
export function subscribeInboxUnreadForChat(selfChatParticipantId, chatId, callback) {
  if (!selfChatParticipantId || !chatId) {
    callback(0);
    return () => {};
  }
  const rref = ref(db, `inboxForUser/${String(selfChatParticipantId)}/${String(chatId)}`);
  const fn = (snap) => {
    if (!snap.exists()) {
      callback(0);
      return;
    }
    const e = snap.val() || {};
    const lastAt = typeof e.lastMessageAt === 'number' ? e.lastMessageAt : 0;
    const readBy = e.readByMe;
    const readT = typeof readBy === 'number' ? readBy : 0;
    const from = e.lastSenderId != null ? String(e.lastSenderId) : '';
    if (from && from !== String(selfChatParticipantId) && lastAt > readT) {
      callback(1);
    } else {
      callback(0);
    }
  };
  return onValue(rref, fn, () => callback(0));
}

/**
 * One-line call summary for the thread (Figma / WhatsApp style).
 * @param {'video' | 'audio'} callMode
 * @param {'answered' | 'missed'} callStatus
 * @param {number} durationSec
 */
export function formatCallLogText(callMode, callStatus, durationSec) {
  const isVideo = callMode === 'video';
  const label = isVideo ? 'Video call' : 'Voice call';
  if (callStatus === 'answered') {
    const sec = Math.max(0, Math.floor(Number(durationSec) || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${label} · ${m}:${s.toString().padStart(2, '0')}`;
  }
  return `${label} — No answer`;
}

/**
 * Writes a `type: "call"` message (initiator only; see Call screen).
 * @param {string} chatId
 * @param {string} senderId
 * @param {string[]} participantIds
 * @param {{ callMode: 'video' | 'audio'; callStatus: 'answered' | 'missed'; durationSec: number; text?: string }} opts
 */
export async function sendCallLogMessage(chatId, senderId, participantIds, opts) {
  const { callMode, callStatus, durationSec, text: textOverride } = opts;
  const text =
    textOverride && String(textOverride).trim()
      ? String(textOverride).trim()
      : formatCallLogText(callMode, callStatus, durationSec);
  return sendChatMessage(chatId, senderId, participantIds, {
    type: 'call',
    text,
    callMode,
    callStatus,
    duration: typeof durationSec === 'number' ? durationSec : 0,
  });
}
