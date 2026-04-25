import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  apiAcceptChatRequest,
  apiDeclineChatRequest,
  apiListIncomingChatRequests,
  type ChatRequestItem,
} from '../../api/chatRequests';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

type Props = NativeStackScreenProps<MainStackParamList, 'ChatRequests'>;

export default function ChatRequestsScreen({ navigation }: Props) {
  const [list, setList] = useState<ChatRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await apiListIncomingChatRequests();
      setList(rows);
    } catch {
      setList([]);
      Alert.alert('Requests', 'Could not load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onAccept = async (item: ChatRequestItem) => {
    setBusyId(item._id);
    try {
      await apiAcceptChatRequest(item._id);
      const from = item.fromUser;
      navigation.replace('ChatThread', {
        peerId: String(from._id),
        peerFirebaseUid: from.firebaseUid?.trim() || undefined,
        name: formatUserDisplayName({
          fullName: from.fullName,
          displayName: from.displayName,
          username: from.username,
        }),
        handle: formatAtUsername(from.username),
        avatarUrl: from.avatarUrl?.trim() || undefined,
      });
    } catch {
      Alert.alert('Accept failed', 'Try again.');
    } finally {
      setBusyId(null);
      void load();
    }
  };

  const onDecline = async (item: ChatRequestItem) => {
    setBusyId(item._id);
    try {
      await apiDeclineChatRequest(item._id);
      setList((prev) => prev.filter((r) => r._id !== item._id));
    } catch {
      Alert.alert('Decline failed', 'Try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text style={styles.headerTitle}>Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          contentContainerStyle={list.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending message requests.</Text>
          }
          renderItem={({ item }) => {
            const u = item.fromUser;
            const src =
              u.avatarUrl && u.avatarUrl.length > 0 ? { uri: u.avatarUrl } : Images.avatarSplit;
            const busy = busyId === item._id;
            return (
              <View style={styles.row}>
                <Image source={src} style={styles.avatar} resizeMode="cover" />
                <View style={styles.mid}>
                  <Text style={styles.name} numberOfLines={2}>
                    {formatUserDisplayName({
                      fullName: u.fullName,
                      displayName: u.displayName,
                      username: u.username,
                    })}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {formatAtUsername(u.username)} wants to chat
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => onDecline(item)}
                    disabled={busy}
                    style={[styles.declineBtn, busy && styles.btnDisabled]}
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onAccept(item)}
                    disabled={busy}
                    style={[styles.acceptBtn, busy && styles.btnDisabled]}
                  >
                    {busy ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.acceptText}>Accept</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  emptyList: { flexGrow: 1, padding: 24 },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 15, marginTop: 48 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mid: { flex: 1, marginLeft: 12, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  sub: { marginTop: 2, fontSize: 13, color: '#64748b' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  declineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  declineText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  acceptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    minWidth: 72,
    alignItems: 'center',
  },
  acceptText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
});
