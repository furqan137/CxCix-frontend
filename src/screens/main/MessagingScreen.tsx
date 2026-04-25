import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiListIncomingChatRequests } from '../../api/chatRequests';
import { apiListConversations, type ApiConversation } from '../../api/conversations';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';
import { apiSetPinnedChat } from '../../api/users';
import { useAuthStore } from '../../store/useAuthStore';
import {
  buildChatId,
  getMyChatParticipantId,
  getPeerChatParticipantId,
  listenChatMeta,
  startPresence,
  stopPresence,
  subscribeInboxUnreadForChat,
} from '../../services/chatService';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

const PAGE = '#F9FAFB';
const GRADIENT = ['#6C63FF', '#F5A623'] as const;

type Row = {
  id: string;
  /** RTDB / Mongo peer key used in buildChatId */
  peerKey: string;
  chatId: string;
  sortTime: number;
  firebaseUid?: string;
  name: string;
  handle: string;
  preview: string;
  time: string;
  avatarUrl?: string;
};

function participantId(p: { _id?: string; id?: string }) {
  return String(p._id ?? p.id ?? '');
}

function conversationToRow(
  conv: ApiConversation,
  myId: string,
  selfChatId: string,
): Row | null {
  const other = conv.participants.find((p) => participantId(p) !== String(myId));
  if (!other) return null;
  const oid = participantId(other);
  if (!oid) return null;
  const peerKey = getPeerChatParticipantId(other) || other.firebaseUid?.trim() || oid;
  const last = conv.lastMessageAt
    ? new Date(conv.lastMessageAt)
    : conv.updatedAt
      ? new Date(conv.updatedAt)
      : new Date();
  const sortTime = conv.lastMessageAt
    ? new Date(conv.lastMessageAt).getTime()
    : conv.updatedAt
      ? new Date(conv.updatedAt).getTime()
      : 0;
  const chatId = buildChatId(selfChatId, peerKey);
  return {
    id: oid,
    peerKey,
    chatId,
    sortTime,
    firebaseUid: other.firebaseUid,
    name: formatUserDisplayName({
      fullName: other.fullName,
      displayName: other.displayName,
      username: other.username,
    }),
    handle: formatAtUsername(other.username),
    preview: conv.lastMessageText?.trim() ? conv.lastMessageText : 'Tap to open chat',
    time: formatRelativeTime(last),
    avatarUrl: other.avatarUrl?.trim() || undefined,
  };
}

function sortRowsByPinnedAndRecency(rows: Row[], pinned: string[] | undefined) {
  const order = [...(pinned || [])].map(String);
  const rank = (chatId: string) => {
    const i = order.indexOf(chatId);
    if (i === -1) return 1_000_000;
    return i;
  };
  return [...rows].sort((a, b) => {
    const r = rank(a.chatId) - rank(b.chatId);
    if (r !== 0) return r;
    return b.sortTime - a.sortTime;
  });
}

function formatRelativeTime(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Messages inbox — conversations from API; Firestore previews; requests → ChatRequests.
 */
export default function MessagingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const currentUserId = useAuthStore((s) => s.user?._id ?? '');
  const me = useAuthStore((s) => s.user);
  /** Must match `getMyChatParticipantId` in `ChatThreadScreen` (Auth uid → API firebase → Mongo). */
  const selfChatId = getMyChatParticipantId(me) || '';
  const pinnedList = (me?.pinnedChatIds || []) as string[];
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [threads, setThreads] = useState<Row[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [metaByPeer, setMetaByPeer] = useState<Record<string, { preview: string; time: string }>>(
    {},
  );
  const [unreadByChat, setUnreadByChat] = useState<Record<string, 0 | 1>>({});
  const setUser = useAuthStore((s) => s.setUser);

  const loadInbox = useCallback(async () => {
    if (!isLoggedIn || !currentUserId || !selfChatId) {
      setThreads([]);
      setRequestCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [convs, reqs] = await Promise.all([
        apiListConversations(),
        apiListIncomingChatRequests(),
      ]);
      const rows = convs
        .map((c) => conversationToRow(c, currentUserId, selfChatId))
        .filter((r): r is Row => r != null);
      setThreads(rows);
      setRequestCount(reqs.length);
    } catch {
      setThreads([]);
      setRequestCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, isLoggedIn, selfChatId]);

  useFocusEffect(
    useCallback(() => {
      void loadInbox();
    }, [loadInbox]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!selfChatId) {
        return () => {};
      }
      startPresence(selfChatId);
      return () => {
        stopPresence();
      };
    }, [selfChatId]),
  );

  useEffect(() => {
    if (!selfChatId || threads.length === 0) return;
    const unsubs = threads
      .map((row) => {
        const chatId = row.chatId;
        return listenChatMeta(chatId, (meta) => {
          setMetaByPeer((prev) => {
            if (!meta) {
              const next = { ...prev };
              delete next[row.id];
              return next;
            }
            return {
              ...prev,
              [row.id]: {
                preview: meta.lastMessageText?.trim() ? meta.lastMessageText : row.preview,
                time: meta.lastMessageAt ? formatRelativeTime(meta.lastMessageAt) : row.time,
              },
            };
          });
        });
      })
      .filter(Boolean) as Array<() => void>;
    return () => unsubs.forEach((u) => u());
  }, [selfChatId, threads]);

  useEffect(() => {
    if (!selfChatId || threads.length === 0) return;
    const unsubs = threads.map((row) =>
      subscribeInboxUnreadForChat(selfChatId, row.chatId, (n) => {
        setUnreadByChat((prev) => {
          if (prev[row.chatId] === n) return prev;
          return { ...prev, [row.chatId]: n };
        });
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [selfChatId, threads]);

  const stackNav = useCallback(() => {
    return navigation.getParent() as
      | { navigate: (name: keyof MainStackParamList, params?: object) => void }
      | undefined;
  }, [navigation]);

  const openThread = (row: Row) => {
    stackNav()?.navigate('ChatThread', {
      peerId: row.id,
      peerFirebaseUid: row.firebaseUid,
      name: row.name,
      handle: row.handle,
      avatarUrl: row.avatarUrl,
    });
  };

  const onLongPressRow = useCallback(
    (row: Row) => {
      const isPinned = pinnedList.includes(row.chatId);
      Alert.alert(
        isPinned ? 'Unpin chat' : 'Pin chat',
        isPinned
          ? 'Remove this chat from the pinned section.'
          : 'Keep this chat at the top of your list.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: isPinned ? 'Unpin' : 'Pin',
            onPress: () => {
              void (async () => {
                try {
                  const u = await apiSetPinnedChat(row.chatId, !isPinned);
                  setUser(u);
                } catch {
                  Alert.alert('Could not update', 'Try again later.');
                }
              })();
            },
          },
        ],
      );
    },
    [pinnedList, setUser],
  );

  const filterRows = useCallback(
    (rows: Row[]) =>
      rows.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.handle.toLowerCase().includes(query.toLowerCase()) ||
          r.preview.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const sortedThreads = useMemo(
    () => sortRowsByPinnedAndRecency(threads, me?.pinnedChatIds),
    [threads, me?.pinnedChatIds],
  );

  const visible = useMemo(() => filterRows(sortedThreads), [filterRows, sortedThreads]);

  const { pinnedRows, recentRows } = useMemo(() => {
    const pset = new Set(pinnedList);
    const pinned: Row[] = [];
    const recent: Row[] = [];
    for (const r of visible) {
      if (pset.has(r.chatId)) pinned.push(r);
      else recent.push(r);
    }
    return { pinnedRows: pinned, recentRows: recent };
  }, [visible, pinnedList]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerIconBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
        >
          {navigation.canGoBack() ? (
            <Ionicons name="chevron-back" size={22} color="#334155" />
          ) : (
            <View style={{ width: 22 }} />
          )}
        </Pressable>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            style={styles.requestsPill}
            onPress={() => stackNav()?.navigate('ChatRequests')}
          >
            <Text style={styles.requestsText}>
              Requests{requestCount > 0 ? ` (${requestCount})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#94a3b8" />
        <TextInput
          placeholder="Search by username..."
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isLoggedIn ? (
          <Text style={styles.emptySearch}>Sign in to see your conversations.</Text>
        ) : loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : threads.length === 0 ? (
          <Text style={styles.emptySearch}>
            No chats yet. Search people and send a message request to start.
          </Text>
        ) : visible.length === 0 ? (
          <Text style={styles.emptySearch}>No conversations match your search.</Text>
        ) : (
          <>
            {pinnedRows.length > 0 ? (
              <>
                <View style={styles.sectionHead}>
                  <Ionicons
                    name="pin"
                    size={16}
                    color="#2563eb"
                    style={styles.sectionPinIcon}
                  />
                  <Text style={[styles.sectionLabel, styles.sectionLabelPinned]}>
                    PINNED
                  </Text>
                </View>
                {pinnedRows.map((row) => (
                  <MessageRow
                    key={row.chatId}
                    row={row}
                    pinned
                    previewOverride={metaByPeer[row.id]?.preview}
                    timeOverride={metaByPeer[row.id]?.time}
                    unread={unreadByChat[row.chatId] === 1}
                    onPress={() => openThread(row)}
                    onLongPress={() => onLongPressRow(row)}
                  />
                ))}
              </>
            ) : null}
            {recentRows.length > 0 ? (
              <>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionLabel}>
                    {pinnedRows.length > 0 ? 'RECENT' : 'CHATS'}
                  </Text>
                </View>
                {recentRows.map((row) => (
                  <MessageRow
                    key={row.chatId}
                    row={row}
                    previewOverride={metaByPeer[row.id]?.preview}
                    timeOverride={metaByPeer[row.id]?.time}
                    unread={unreadByChat[row.chatId] === 1}
                    onPress={() => openThread(row)}
                    onLongPress={() => onLongPressRow(row)}
                  />
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <Pressable
        style={[
          styles.fab,
          { bottom: Math.max(insets.bottom, 12) + 72 },
        ]}
        onPress={() => stackNav()?.navigate('Search', { initialTab: 'People' })}
        accessibilityLabel="New message"
      >
        <LinearGradient
          colors={[...GRADIENT]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fabInner}
        >
          <Ionicons name="create-outline" size={26} color="#fff" />
        </LinearGradient>
      </Pressable>
    </SafeAreaView>
  );
}

function MessageRow({
  row,
  onPress,
  onLongPress,
  previewOverride,
  timeOverride,
  unread,
  pinned,
}: {
  row: Row;
  onPress: () => void;
  onLongPress?: () => void;
  previewOverride?: string;
  timeOverride?: string;
  unread?: boolean;
  /** Show pin when this thread is in the pinned list */
  pinned?: boolean;
}) {
  const src =
    row.avatarUrl && row.avatarUrl.length > 0
      ? { uri: row.avatarUrl }
      : Images.avatarSplit;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={380}
      style={styles.card}
    >
      <View style={styles.avatarWrap}>
        <Image source={src} style={styles.avatar} resizeMode="cover" />
        {unread ? <View style={styles.unreadDot} /> : null}
      </View>
      <View style={styles.cardMid}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, unread && styles.nameUnread]}
            numberOfLines={1}
          >
            {row.name}
          </Text>
          {pinned ? (
            <Ionicons
              name="pin"
              size={15}
              color="#2563eb"
              style={styles.rowPinIcon}
            />
          ) : null}
        </View>
        <Text
          style={[styles.preview, unread && styles.previewUnread]}
          numberOfLines={1}
        >
          {previewOverride ?? row.preview}
        </Text>
      </View>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{timeOverride ?? row.time}</Text>
        {unread ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const AV = 52;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  requestsPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
  },
  requestsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 0,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionPinIcon: {
    marginRight: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#475569',
  },
  sectionLabelPinned: {
    color: '#0f172a',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 6,
  },
  rowPinIcon: {
    flexShrink: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: {
    width: AV,
    height: AV,
    borderRadius: AV / 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#f8fafc',
  },
  cardMid: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    minWidth: 0,
  },
  preview: {
    marginTop: 3,
    fontSize: 13,
    color: '#64748b',
  },
  timeCol: {
    marginLeft: 8,
    alignItems: 'flex-end',
    gap: 4,
  },
  time: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  nameUnread: {
    fontWeight: '800',
  },
  previewUnread: {
    color: '#0f172a',
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  avatarWrap: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptySearch: {
    marginTop: 32,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 15,
    paddingHorizontal: 12,
  },
  fab: {
    position: 'absolute',
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
