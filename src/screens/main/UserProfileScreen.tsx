import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  apiAcceptChatRequest,
  apiChatStatusWithUser,
  apiCancelChatRequest,
  apiCreateChatRequest,
  type RelationshipStatus,
} from '../../api/chatRequests';
import {
  apiGetUserPosts,
  formatCompactCount,
  type ApiFeedPost,
} from '../../api/posts';
import { apiFollowUser, apiGetUserPublic, apiUnfollowUser, type PublicUser } from '../../api/users';
import { getApiMessage } from '../../api/auth';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

type Props = NativeStackScreenProps<MainStackParamList, 'UserProfile'>;

const PAGE = '#F4F7F9';
const COVER_GRADIENT: [string, string] = ['#6366F1', '#FBBF24'];
const GRID_GAP = 12;

type GridTab = 'posts' | 'shifted' | 'media';

function truncateCaption(text: string, max = 48): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return '…';
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Another member’s profile — follow, message (chat request first), posts grid.
 */
export default function UserProfileScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [relStatus, setRelStatus] = useState<RelationshipStatus | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [gridTab, setGridTab] = useState<GridTab>('posts');
  const [posts, setPosts] = useState<ApiFeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const u = await apiGetUserPublic(userId);
      setProfile(u);
      if (u.isSelf !== true) {
        const st = await apiChatStatusWithUser(userId);
        setRelStatus(st.status);
        setRequestId(st.requestId ?? null);
      } else {
        setRelStatus('self');
        setRequestId(null);
      }
    } catch {
      setProfile(null);
      Alert.alert('Profile', 'Could not load this user.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      // Respect private account gating (server also enforces).
      if (profile?.isPrivate === true && profile.canViewPosts === false) {
        setPosts([]);
        return;
      }
      const res = await apiGetUserPosts({ userId, tab: gridTab, page: 1, limit: 30 });
      setPosts(res.posts);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [userId, gridTab, profile?.isPrivate, profile?.canViewPosts]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts]),
  );

  const openChat = useCallback(() => {
    if (!profile) return;
    navigation.navigate('ChatThread', {
      peerId: userId,
      peerFirebaseUid: profile.firebaseUid?.trim() || undefined,
      name: formatUserDisplayName({
        fullName: profile.fullName,
        displayName: profile.displayName,
        username: profile.username,
      }),
      handle: formatAtUsername(profile.username),
      avatarUrl: profile.avatarUrl?.trim() || undefined,
    });
  }, [navigation, profile, userId]);

  const handleMessage = async () => {
    if (!profile || actionBusy || profile.isSelf === true) return;

    if (relStatus === 'connected') {
      openChat();
      return;
    }

    if (relStatus === 'pending_out') {
      setRequestModalOpen(true);
      return;
    }

    if (relStatus === 'pending_in' && requestId) {
      setActionBusy(true);
      try {
        await apiAcceptChatRequest(requestId);
        setRelStatus('connected');
        openChat();
      } catch {
        Alert.alert('Could not accept', 'Try again from Messages → Requests.');
      } finally {
        setActionBusy(false);
      }
      return;
    }

    setActionBusy(true);
    try {
      const res = await apiCreateChatRequest(userId);
      if (res.status === 'already_connected') {
        setRelStatus('connected');
        openChat();
        return;
      }
      if (res.status === 'await_their_accept') {
        Alert.alert(
          'Incoming request',
          res.message ?? 'They already sent you a request. Open Requests to accept.',
        );
        await loadProfile();
        return;
      }
      if (res.status === 'sent' || res.status === 'pending') {
        setRelStatus('pending_out');
        Alert.alert('Request sent', 'They can accept it from Messages → Requests.');
        return;
      }
    } catch {
      Alert.alert('Request failed', 'Check your connection and try again.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile || profile.isSelf === true || followBusy) return;
    setFollowBusy(true);
    try {
      if (profile.isFollowing) {
        const res = await apiUnfollowUser(userId);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: res.following,
                followersCount: res.followersCount ?? prev.followersCount,
              }
            : prev,
        );
      } else {
        const res = await apiFollowUser(userId);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: res.following,
                followersCount: res.followersCount ?? prev.followersCount,
              }
            : prev,
        );
      }
    } catch (e) {
      Alert.alert('Follow', getApiMessage(e));
    } finally {
      setFollowBusy(false);
    }
  };

  const messageLabel =
    relStatus === 'connected'
      ? 'Message'
      : relStatus === 'pending_out'
        ? 'Request sent'
        : relStatus === 'pending_in'
          ? 'Accept & message'
          : 'Message';

  const messageDisabled =
    actionBusy ||
    loading ||
    profile?.isSelf;

  const gridRows: ApiFeedPost[][] = [];
  for (let i = 0; i < posts.length; i += 3) {
    gridRows.push(posts.slice(i, i + 3));
  }

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => navigation.goBack()} title="Profile" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => navigation.goBack()} title="Profile" />
        <View style={styles.center}>
          <Text style={styles.muted}>User not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const avatarSource =
    profile.avatarUrl && profile.avatarUrl.length > 0
      ? { uri: profile.avatarUrl }
      : Images.avatarSplit;

  const followers = profile.followersCount ?? 0;
  const following = profile.followingCount ?? 0;
  const postCount = profile.postsCount ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header onBack={() => navigation.goBack()} title="Profile" />

      <Modal
        visible={requestModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRequestModalOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRequestModalOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Request sent</Text>
            <Text style={styles.modalSub}>
              They can accept it from Messages → Requests. Once accepted, you’ll be able to chat.
            </Text>
            <View style={styles.modalRow}>
              <Pressable
                style={styles.modalBtnSecondary}
                onPress={() => setRequestModalOpen(false)}
              >
                <Text style={styles.modalBtnSecondaryText}>OK</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtnDanger}
                onPress={() => {
                  if (!requestId) {
                    setRequestModalOpen(false);
                    return;
                  }
                  void (async () => {
                    setActionBusy(true);
                    try {
                      await apiCancelChatRequest(requestId);
                      setRelStatus('none');
                      setRequestId(null);
                      setRequestModalOpen(false);
                    } catch {
                      Alert.alert('Cancel', 'Could not cancel request. Try again.');
                    } finally {
                      setActionBusy(false);
                    }
                  })();
                }}
              >
                <Text style={styles.modalBtnDangerText}>Cancel request</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.coverWrap}>
          <LinearGradient
            colors={COVER_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cover}
          />
          <View style={styles.avatarWrap}>
            <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />
          </View>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.name}>
            {formatUserDisplayName({
              fullName: profile.fullName,
              displayName: profile.displayName,
              username: profile.username,
            })}
          </Text>
          <Text style={styles.handle}>{formatAtUsername(profile.username)}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{formatCompactCount(postCount)}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{formatCompactCount(followers)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{formatCompactCount(following)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.bioCard}>
            {profile.bio?.trim() ? (
              <Text style={styles.bio}>{profile.bio.trim()}</Text>
            ) : (
              <Text style={styles.bioEmpty}>No bio yet.</Text>
            )}
          </View>

          {profile.isSelf === true ? (
            <Pressable
              style={styles.outlineBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={20} color="#2563eb" />
              <Text style={styles.outlineBtnText}>Edit profile</Text>
            </Pressable>
          ) : (
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.followBtn, (profile.isFollowing ?? false) && styles.followBtnActive]}
                onPress={handleFollowToggle}
                disabled={followBusy}
              >
                {followBusy ? (
                  <ActivityIndicator color={profile.isFollowing ? '#64748b' : '#fff'} />
                ) : (
                  <>
                    <Ionicons
                      name={profile.isFollowing ? 'checkmark' : 'person-add-outline'}
                      size={20}
                      color={profile.isFollowing ? '#475569' : '#fff'}
                    />
                    <Text
                      style={[
                        styles.followBtnText,
                        profile.isFollowing && styles.followBtnTextActive,
                      ]}
                    >
                      {profile.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handleMessage}
                disabled={messageDisabled}
                style={({ pressed }) => [
                  styles.messageWrap,
                  messageDisabled && styles.messageDisabled,
                  pressed && !messageDisabled && { opacity: 0.92 },
                ]}
              >
                <LinearGradient
                  colors={['#6C63FF', '#F5A623']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.messageGrad}
                >
                  {actionBusy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                      <Text style={styles.messageText}>{messageLabel}</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {relStatus === 'pending_in' && requestId ? (
            <Pressable
              style={styles.requestsLink}
              onPress={() => navigation.navigate('ChatRequests')}
            >
              <Text style={styles.requestsLinkText}>Open message requests →</Text>
            </Pressable>
          ) : null}

          <Text style={styles.sectionTitle}>Posts</Text>
          <View style={styles.tabRow}>
            {(
              [
                { key: 'posts' as const, label: 'All' },
                { key: 'shifted' as const, label: 'Shifted' },
                { key: 'media' as const, label: 'Media' },
              ] as const
            ).map((t) => {
              const active = gridTab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setGridTab(t.key)}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {profile.isPrivate === true && profile.canViewPosts === false ? (
            <View style={styles.privateCard}>
              <Ionicons name="lock-closed-outline" size={20} color="#475569" />
              <Text style={styles.privateTitle}>This account is private</Text>
              <Text style={styles.privateSub}>
                Follow to see their posts and shifts.
              </Text>
            </View>
          ) : postsLoading ? (
            <View style={styles.gridLoading}>
              <ActivityIndicator color="#6366f1" />
            </View>
          ) : gridRows.length === 0 ? (
            <Text style={styles.gridEmpty}>No posts in this tab yet.</Text>
          ) : (
            gridRows.map((row, ri) => (
              <View key={`row-${ri}`} style={styles.gridRow}>
                {row.map((p) => (
                  <Pressable
                    key={p.id}
                    style={styles.gridCell}
                    onPress={() =>
                      navigation.navigate('ReadComment', { postId: p.id, variant: 'standard' })
                    }
                  >
                    <View style={styles.thumbWrap}>
                      {p.mediaUrl ? (
                        <Image
                          source={{ uri: p.mediaUrl }}
                          style={styles.thumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.thumbPlaceholder}>
                          <Ionicons name="document-text-outline" size={26} color="#94a3b8" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.thumbCaption} numberOfLines={3}>
                      {truncateCaption(p.text)}
                    </Text>
                    <View style={styles.thumbMeta}>
                      <Ionicons name="heart" size={12} color="#3b82f6" />
                      <Text style={styles.thumbLikes}>{formatCompactCount(p.likesCount)}</Text>
                    </View>
                  </Pressable>
                ))}
                {row.length < 3
                  ? [...Array(3 - row.length)].map((_, i) => (
                      <View key={`pad-${ri}-${i}`} style={styles.gridCell} />
                    ))
                  : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.iconBtn}>
        <Ionicons name="chevron-back" size={22} color="#334155" />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { color: '#64748b', fontSize: 15 },
  scroll: { paddingBottom: 48 },
  coverWrap: {
    alignItems: 'center',
    marginBottom: 52,
  },
  cover: {
    width: '100%',
    height: 120,
  },
  avatarWrap: {
    position: 'absolute',
    bottom: -48,
    borderWidth: 4,
    borderColor: '#fff',
    borderRadius: 56,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  name: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  handle: {
    marginTop: 4,
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  statsRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: '#e2e8f0' },
  statNum: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  statLabel: { marginTop: 2, fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  bioCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bio: { fontSize: 15, color: '#334155', lineHeight: 22, textAlign: 'center' },
  bioEmpty: { fontSize: 14, color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' },
  outlineBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    backgroundColor: '#fff',
  },
  outlineBtnText: { fontSize: 16, fontWeight: '700', color: '#2563eb' },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  followBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  followBtnActive: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  followBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  followBtnTextActive: { color: '#475569' },
  messageWrap: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  messageDisabled: { opacity: 0.5 },
  messageGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  messageText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  requestsLink: { marginTop: 12, alignItems: 'center' },
  requestsLinkText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  sectionTitle: {
    marginTop: 28,
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  tabRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabChipActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  tabChipText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabChipTextActive: { color: '#4338ca' },
  gridLoading: { marginTop: 24, alignItems: 'center' },
  gridEmpty: { marginTop: 16, textAlign: 'center', color: '#94a3b8', fontSize: 14 },
  gridRow: {
    marginTop: GRID_GAP,
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
  },
  thumbWrap: {
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  thumbCaption: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 14,
  },
  thumbMeta: { marginTop: 4, flexDirection: 'row', alignItems: 'center' },
  thumbLikes: { marginLeft: 4, fontSize: 11, color: '#64748b' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  modalSub: { marginTop: 8, fontSize: 13, lineHeight: 18, color: '#64748b' },
  modalRow: { marginTop: 16, flexDirection: 'row', gap: 10 },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondaryText: { fontWeight: '800', color: '#0f172a' },
  modalBtnDanger: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnDangerText: { fontWeight: '800', color: '#fff' },
  privateCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    gap: 6,
  },
  privateTitle: { marginTop: 6, fontSize: 15, fontWeight: '800', color: '#0f172a' },
  privateSub: { textAlign: 'center', fontSize: 13, color: '#64748b' },
});
