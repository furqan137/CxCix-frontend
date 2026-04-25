import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  type ImageSourcePropType,
  Pressable,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

import {
  apiDeleteNotification,
  apiGetUnreadCount,
  apiListNotifications,
  apiMarkNotificationRead,
  type ApiNotificationRow,
} from '../../api/notifications';
import { getApiMessage } from '../../api/auth';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

const PAGE = '#F9FAFB';
const H_PAD = 16;
const AVATAR = 48;

function avatarSource(n: ApiNotificationRow): ImageSourcePropType {
  const url = n.fromUser?.avatarUrl?.trim();
  return url ? { uri: url } : Images.avatarSplit;
}

function lineFor(n: ApiNotificationRow) {
  if (n.type === 'system') {
    return { user: 'CxCix', message: n.text || 'Announcement' };
  }
  const display = n.fromUser
    ? formatUserDisplayName({
        fullName: n.fromUser.fullName,
        displayName: n.fromUser.displayName,
        username: n.fromUser.username,
      })
    : 'CxCix';
  return { user: display, message: n.text || n.type };
}

/**
 * Notifications — Figma: light page, white elevated cards, circular avatars, perspective tag.
 */
export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [rows, setRows] = useState<ApiNotificationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [deleting, setDeleting] = useState(false);

  const stackNav = useCallback(() => {
    return navigation.getParent() as
      | { navigate: (name: keyof MainStackParamList, params?: object) => void }
      | undefined;
  }, [navigation]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiListNotifications({ page: 1, limit: 40 });
      setRows(res.notifications || []);
    } catch (e) {
      setError(getApiMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const listExtraData = useMemo(
    () => `${selectionMode ? 1 : 0}|${[...selectedIds].sort().join()}`,
    [selectionMode, selectedIds],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const enterSelection = useCallback(() => {
    setSelectionMode(true);
    setSelectedIds(new Set());
  }, []);

  const onLongPressRow = useCallback((n: ApiNotificationRow) => {
    setSelectionMode(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(n.id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllInList = useCallback(() => {
    if (rows.length === 0) return;
    setSelectedIds(new Set(rows.map((r) => r.id)));
  }, [rows]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const onPressNotification = useCallback(
    async (n: ApiNotificationRow) => {
      // Optimistic UI: mark read instantly
      if (!n.isRead) {
        setRows((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        void apiMarkNotificationRead(n.id).catch(() => undefined);
        void apiGetUnreadCount().catch(() => undefined);
      }

      if (n.type === 'follow' && n.fromUser?._id) {
        stackNav()?.navigate('UserProfile', { userId: n.fromUser._id });
        return;
      }
      if (n.type === 'message' && n.fromUser?._id) {
        stackNav()?.navigate('ChatThread', {
          peerId: n.fromUser._id,
          name: formatUserDisplayName({
            fullName: n.fromUser.fullName,
            displayName: n.fromUser.displayName,
            username: n.fromUser.username,
          }),
          handle: n.fromUser.username ? formatAtUsername(n.fromUser.username) : '',
          avatarUrl: n.fromUser.avatarUrl || undefined,
        });
        return;
      }
      if (n.type === 'system') {
        return;
      }
      if (n.postId) {
        stackNav()?.navigate('ReadComment', { postId: n.postId, variant: 'standard' });
      }
    },
    [stackNav],
  );

  const onRowPress = useCallback(
    (n: ApiNotificationRow) => {
      if (selectionMode) {
        toggleSelect(n.id);
        return;
      }
      void onPressNotification(n);
    },
    [selectionMode, onPressNotification, toggleSelect],
  );

  const deleteRow = useCallback(async (id: string) => {
    // Optimistic remove
    const prev = rows;
    setRows((p) => p.filter((x) => x.id !== id));
    setSelectedIds((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    try {
      await apiDeleteNotification(id);
      void apiGetUnreadCount().catch(() => undefined);
    } catch {
      setRows(prev);
    }
  }, [rows]);

  const runDeleteSelected = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      setDeleting(true);
      const prev = rows;
      setRows((p) => p.filter((x) => !ids.includes(x.id)));
      exitSelection();
      try {
        const results = await Promise.allSettled(
          ids.map((id) => apiDeleteNotification(id)),
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        void apiGetUnreadCount().catch(() => undefined);
        if (failed > 0) {
          setRows(prev);
          await load();
          Alert.alert(
            'Delete failed',
            'Some items could not be removed. The list was refreshed.',
          );
        }
      } catch (e) {
        console.warn(e);
        setRows(prev);
        void load();
        Alert.alert('Delete failed', 'Check your connection and try again.');
      } finally {
        setDeleting(false);
      }
    },
    [rows, exitSelection, load],
  );

  const confirmDeleteSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const n = ids.length;
    Alert.alert(
      n === 1 ? 'Delete notification?' : 'Delete notifications?',
      n === 1
        ? 'This notification will be removed.'
        : `${n} notifications will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void runDeleteSelected(ids),
        },
      ],
    );
  }, [selectedIds, runDeleteSelected]);

  const renderRightActions = (id: string) => (
    <RectButton
      style={styles.swipeDelete}
      onPress={() => void deleteRow(id)}
    >
      <Ionicons name="trash-outline" size={20} color="#fff" />
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </RectButton>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        {selectionMode ? (
          <>
            <Pressable
              onPress={exitSelection}
              style={styles.headerIconBtn}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color="#334155" />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {selectedIds.size === 0
                ? 'Select notifications'
                : selectedIds.size === 1
                  ? '1 selected'
                  : `${selectedIds.size} selected`}
            </Text>
            <View style={styles.headerRightGroup}>
              {deleting ? (
                <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 8 }} />
              ) : null}
              <Pressable
                onPress={confirmDeleteSelected}
                disabled={selectedIds.size === 0 || deleting}
                style={({ pressed }) => [
                  styles.deleteHeaderBtn,
                  (selectedIds.size === 0 || deleting) && styles.deleteHeaderBtnDisabled,
                  pressed && selectedIds.size > 0 && !deleting && { opacity: 0.7 },
                ]}
                hitSlop={8}
              >
                <Text
                  style={[
                    styles.deleteHeaderText,
                    (selectedIds.size === 0 || deleting) && styles.deleteHeaderTextDisabled,
                  ]}
                >
                  Delete
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerRightGroup}>
              <Pressable
                onPress={enterSelection}
                style={styles.selectHeaderPress}
                hitSlop={8}
              >
                <Text style={styles.selectHeaderText}>Select</Text>
              </Pressable>
        <Pressable
          onPress={() => stackNav()?.navigate('Settings')}
          style={styles.headerIconBtn}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={20} color="#334155" />
        </Pressable>
            </View>
          </>
        )}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[styles.scroll, rows.length === 0 ? { flexGrow: 1 } : null]}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => void load()}
        extraData={listExtraData}
        ListHeaderComponent={
          <View>
            {selectionMode && rows.length > 0 ? (
              <View style={styles.selectAllBar}>
                <Pressable onPress={selectAllInList} style={styles.selectAllBtn}>
                  <Text style={styles.selectAllText}>Select all</Text>
                </Pressable>
                <View style={styles.selectAllDot} />
                <Pressable onPress={deselectAll} style={styles.selectAllBtn}>
                  <Text style={styles.selectAllText}>Deselect all</Text>
                </Pressable>
              </View>
            ) : null}
            {error ? (
              <View style={[styles.card, { alignItems: 'center' }]}>
                <Text style={{ color: '#64748b', fontSize: 14 }}>{error}</Text>
                <Pressable onPress={() => void load()} style={{ marginTop: 10 }}>
                  <Text style={{ color: '#2563eb', fontWeight: '700' }}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-outline" size={26} color="#6366F1" />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>
                When someone likes, comments, follows, or mentions you, you’ll see it here.
              </Text>
              <View style={{ marginTop: 18, borderRadius: 999, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#6C63FF', '#F5A623']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ paddingHorizontal: 18, paddingVertical: 12 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '800' }}>You’re all caught up</Text>
                </LinearGradient>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item: n }) => {
          const t = lineFor(n);
          const isSelected = selectedIds.has(n.id);
          const card = (
            <Pressable
              style={[
                styles.card,
                !n.isRead && !selectionMode ? styles.cardUnread : null,
                selectionMode && isSelected ? styles.cardSelected : null,
              ]}
              onPress={() => onRowPress(n)}
              onLongPress={!selectionMode ? () => onLongPressRow(n) : undefined}
            >
              {selectionMode ? (
                <View style={styles.checkWrap}>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'square-outline'}
                    size={24}
                    color={isSelected ? '#2563eb' : '#94a3b8'}
                  />
                </View>
              ) : null}
              <Image source={avatarSource(n)} style={styles.avatar} resizeMode="cover" />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <View style={styles.textBlock}>
                  <Text style={styles.line}>
                      <Text style={styles.user}>{t.user}</Text>
                      <Text style={styles.message}> {t.message}</Text>
                  </Text>
                  </View>
                  <Text style={styles.time}>{n.timeLabel}</Text>
                </View>
                {!n.isRead && !selectionMode ? <View style={styles.unreadDot} /> : null}
              </View>
            </Pressable>
          );
          if (selectionMode) {
            return card;
          }
          return (
            <Swipeable
              renderRightActions={() => renderRightActions(n.id)}
              overshootRight={false}
            >
              {card}
            </Swipeable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: H_PAD,
    paddingVertical: 12,
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
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectHeaderPress: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  deleteHeaderBtn: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  deleteHeaderBtnDisabled: {
    opacity: 0.4,
  },
  deleteHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#b91c1c',
  },
  deleteHeaderTextDisabled: {
    color: '#94a3b8',
  },
  selectAllBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
  },
  selectAllBtn: {
    paddingVertical: 4,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  selectAllDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 10,
  },
  checkWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    marginLeft: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scroll: {
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    paddingBottom: 120,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySub: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#f8fafc',
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  line: {
    fontSize: 15,
    lineHeight: 21,
  },
  user: {
    fontWeight: '700',
    color: '#0f172a',
  },
  message: {
    fontWeight: '400',
    color: '#334155',
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: 2,
    flexShrink: 0,
  },
  unreadDot: {
    position: 'absolute',
    right: 0,
    bottom: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  swipeDelete: {
    width: 88,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeDeleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  badgeWrap: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#2563eb',
  },
});
