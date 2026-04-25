import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import {
  apiListMyFollowers,
  apiListMyFollowing,
  apiUnfollowUser,
  type PublicUser,
} from '../../api/users';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

type Props = NativeStackScreenProps<MainStackParamList, 'FollowConnections'>;

const PAGE = '#F9FAFB';
const AVATAR = 52;

type RowUser = {
  id: string;
  name: string;
  handle: string;
  avatar: ImageSourcePropType;
};

function toRow(u: PublicUser): RowUser {
  const name = formatUserDisplayName({
    fullName: u.fullName,
    displayName: u.displayName,
    username: u.username,
  });
  const handle = formatAtUsername(u.username);
  const avatar: ImageSourcePropType = u.avatarUrl?.trim()
    ? { uri: u.avatarUrl.trim() }
    : Images.avatarSplit;
  return { id: u._id, name, handle, avatar };
}

export default function FollowConnectionsScreen({ navigation, route }: Props) {
  const { mode } = route.params;
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [rows, setRows] = useState<RowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const title = mode === 'followers' ? 'Followers' : 'Following';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const users =
        mode === 'followers' ? await apiListMyFollowers() : await apiListMyFollowing();
      setRows(users.map(toRow));
    } catch (e) {
      setRows([]);
      Alert.alert(title, getApiMessage(e));
    } finally {
      setLoading(false);
    }
  }, [mode, title]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openProfile = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  const confirmUnfollow = (u: RowUser) => {
    Alert.alert('Unfollow', `Stop following ${u.handle}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unfollow',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusyId(u.id);
            try {
              await apiUnfollowUser(u.id);
              await refreshUser();
              setRows((prev) => prev.filter((x) => x.id !== u.id));
            } catch (e) {
              Alert.alert('Unfollow', getApiMessage(e));
            } finally {
              setBusyId(null);
            }
          })();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          hitSlop={6}
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconOuter}>
            <Ionicons name="people-outline" size={32} color="#2563eb" />
          </View>
          <Text style={styles.emptyTitle}>
            {mode === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </Text>
          <Text style={styles.emptySub}>
            {mode === 'followers'
              ? 'When people follow you, they will show up here.'
              : 'Accounts you follow will appear here. Search people to get started.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable
                onPress={() => openProfile(item.id)}
                style={styles.cardLeft}
                accessibilityRole="button"
                accessibilityLabel={`View ${item.name}`}
              >
                <View style={styles.avatarRing}>
                  <Image source={item.avatar} style={styles.avatarImg} resizeMode="cover" />
                </View>
                <View style={styles.nameCol}>
                  <Text style={styles.displayName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.handle} numberOfLines={1}>
                    {item.handle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </Pressable>
              {mode === 'following' ? (
                <Pressable
                  onPress={() => confirmUnfollow(item)}
                  disabled={busyId === item.id}
                  style={({ pressed }) => [
                    styles.unfollowBtn,
                    pressed && busyId === null && { opacity: 0.85 },
                  ]}
                >
                  {busyId === item.id ? (
                    <ActivityIndicator size="small" color="#64748b" />
                  ) : (
                    <Text style={styles.unfollowLabel}>Unfollow</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
          )}
        />
      )}
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
    paddingHorizontal: 16,
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
  headerSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  avatarRing: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  nameCol: {
    marginLeft: 12,
    flex: 1,
    minWidth: 0,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  handle: {
    marginTop: 2,
    fontSize: 14,
    color: '#64748b',
  },
  unfollowBtn: {
    marginLeft: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unfollowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  emptyWrap: {
    paddingHorizontal: 32,
    paddingTop: 48,
    alignItems: 'center',
  },
  emptyIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    textAlign: 'center',
  },
});
