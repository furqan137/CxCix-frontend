import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Images } from '../../constants/images';
import type { ChatAvatarKey, MainStackParamList } from '../../navigation/types';

const PAGE = '#F9FAFB';
const GRADIENT = ['#6C63FF', '#F5A623'] as const;

type Row = {
  id: string;
  name: string;
  handle: string;
  preview: string;
  time: string;
  avatarKey: ChatAvatarKey;
};

const PINNED: Row[] = [
  {
    id: 'p1',
    name: 'Alex Johnson',
    handle: '@alexjohnson',
    preview: 'Hey, did you see the new design…',
    time: '2m ago',
    avatarKey: 'alex',
  },
  {
    id: 'p2',
    name: 'Sarah Miller',
    handle: '@sarahmiller',
    preview: 'Sounds good — I’ll send the file tonight.',
    time: '1h ago',
    avatarKey: 'sarah',
  },
];

const RECENT: Row[] = [
  {
    id: 'r1',
    name: 'Annette Black',
    handle: '@annette_black',
    preview: 'Can we sync on the chat thread tomorrow?',
    time: 'yesterday',
    avatarKey: 'annette',
  },
  {
    id: 'r2',
    name: 'Wade Warren',
    handle: '@wade_warren',
    preview: 'Uploaded the revised mockups ✓',
    time: 'Feb 01',
    avatarKey: 'wade',
  },
  {
    id: 'r3',
    name: 'Ralph Edwards',
    handle: '@ralph_e',
    preview: 'Thanks for the feedback!',
    time: 'Jan 28',
    avatarKey: 'ralph',
  },
  {
    id: 'r4',
    name: 'Eleanor Pena',
    handle: '@eleanor_p',
    preview: 'Let me know when you’re free to hop on a call.',
    time: 'Jan 20',
    avatarKey: 'eleanor',
  },
  {
    id: 'r5',
    name: 'Marvin McKinney',
    handle: '@marvin_m',
    preview: '👍',
    time: 'Jan 12',
    avatarKey: 'marvin',
  },
];

const AVATAR_MAP: Record<ChatAvatarKey, ImageSourcePropType> = {
  annette: Images.mutedAccountAvatar.one,
  alex: Images.messages.listRow1,
  sarah: Images.messages.listRow2,
  wade: Images.avatarWade,
  ralph: Images.messages.listRow3,
  eleanor: Images.messages.listRow4,
  marvin: Images.messages.listRow5,
};

function peerAvatar(key: ChatAvatarKey) {
  return AVATAR_MAP[key];
}

/**
 * Messages inbox — PINNED / RECENT, search, Requests pill, FAB → ChatThread.
 */
export default function MessagingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const stackNav = useCallback(() => {
    return navigation.getParent() as
      | { navigate: (name: keyof MainStackParamList, params?: object) => void }
      | undefined;
  }, [navigation]);

  const openThread = (row: Row) => {
    stackNav()?.navigate('ChatThread', {
      peerId: row.id,
      name: row.name,
      handle: row.handle,
      avatarKey: row.avatarKey,
    });
  };

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

  const pinned = useMemo(() => filterRows(PINNED), [filterRows]);
  const recent = useMemo(() => filterRows(RECENT), [filterRows]);

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
        <Pressable style={styles.requestsPill}>
          <Text style={styles.requestsText}>Requests (3)</Text>
        </Pressable>
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
        {pinned.length > 0 ? (
          <>
            <View style={styles.sectionHead}>
              <Ionicons name="pin" size={14} color="#64748b" />
              <Text style={styles.sectionLabel}> PINNED</Text>
            </View>
            {pinned.map((row) => (
              <MessageRow key={row.id} row={row} onPress={() => openThread(row)} />
            ))}
          </>
        ) : null}

        {recent.length > 0 ? (
          <>
            <View style={[styles.sectionHead, { marginTop: pinned.length ? 20 : 8 }]}>
              <Text style={styles.sectionLabel}>RECENT</Text>
            </View>
            {recent.map((row) => (
              <MessageRow key={row.id} row={row} onPress={() => openThread(row)} />
            ))}
          </>
        ) : (
          <Text style={styles.emptySearch}>No conversations match your search.</Text>
        )}
      </ScrollView>

      <Pressable
        style={[
          styles.fab,
          { bottom: Math.max(insets.bottom, 12) + 72 },
        ]}
        onPress={() =>
          stackNav()?.navigate('ChatThread', {
            peerId: 'annette',
            name: 'Annette Black',
            handle: '@annette_black',
            avatarKey: 'annette',
          })
        }
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

function MessageRow({ row, onPress }: { row: Row; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image source={peerAvatar(row.avatarKey)} style={styles.avatar} resizeMode="cover" />
      <View style={styles.cardMid}>
        <Text style={styles.name} numberOfLines={1}>
          {row.name}
        </Text>
        <Text style={styles.preview} numberOfLines={1}>
          {row.preview}
        </Text>
      </View>
      <Text style={styles.time}>{row.time}</Text>
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
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#475569',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  preview: {
    marginTop: 3,
    fontSize: 13,
    color: '#64748b',
  },
  time: {
    marginLeft: 8,
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptySearch: {
    marginTop: 32,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 15,
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
