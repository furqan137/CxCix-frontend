import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'MutedAccounts'>;

const PAGE = '#F9FAFB';
const GRADIENT = ['#6C63FF', '#F5A623'] as const;

type MutedUser = {
  id: string;
  name: string;
  handle: string;
  avatar: ImageSourcePropType;
};

const INITIAL_MUTED: MutedUser[] = [
  {
    id: '1',
    name: 'Annette Black',
    handle: '@annette_black',
    avatar: Images.mutedAccountAvatar.one,
  },
  {
    id: '2',
    name: 'Cameron Williamson',
    handle: '@cameron_w',
    avatar: Images.mutedAccountAvatar.two,
  },
  {
    id: '3',
    name: 'Jacob Jones',
    handle: '@jacob_jones',
    avatar: Images.mutedAccountAvatar.three,
  },
];

/**
 * Muted Accounts — search, list with circular avatars + gradient-border Unmute, empty state, confirm dialog.
 */
export default function MutedAccountsScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<MutedUser[]>(INITIAL_MUTED);
  const [confirm, setConfirm] = useState<MutedUser | null>(null);

  const filtered = useMemo(
    () =>
      rows.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.handle.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, rows],
  );

  const noMatches = rows.length > 0 && filtered.length === 0;
  const fullyEmpty = rows.length === 0;

  const unmute = (u: MutedUser) => {
    setRows((prev) => prev.filter((x) => x.id !== u.id));
    setConfirm(null);
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
        <Text style={styles.headerTitle}>Muted Accounts</Text>
        <Pressable style={styles.headerIconBtn} hitSlop={6}>
          <Ionicons name="search" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search by username..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        {fullyEmpty ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconOuter}>
              <View style={styles.emptyIconInner}>
                <Ionicons name="volume-mute" size={32} color="#2563eb" />
              </View>
            </View>
            <Text style={styles.emptyTitle}>No muted accounts</Text>
            <Text style={styles.emptySub}>
              Accounts you mute will appear here for easy management and review.
            </Text>
          </View>
        ) : noMatches ? (
          <View style={styles.noMatchWrap}>
            <Text style={styles.noMatchText}>No matches for “{query.trim()}”</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((m) => (
              <View key={m.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={styles.avatarRing}>
                    <Image source={m.avatar} style={styles.avatarImg} resizeMode="cover" />
                  </View>
                  <View style={styles.nameCol}>
                    <Text style={styles.displayName}>{m.name}</Text>
                    <Text style={styles.handle}>{m.handle}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setConfirm(m)} style={styles.unmuteOuter}>
                  <LinearGradient colors={[...GRADIENT]} style={styles.unmuteBorder}>
                    <View style={styles.unmuteInner}>
                      <Text style={styles.unmuteLabel}>Unmute</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? `Unmute ${confirm.handle}?` : ''}
        message="Their posts and replies may show up again depending on your mood + AI settings."
        primaryLabel="Unmute"
        onPrimary={() => confirm && unmute(confirm)}
        icon={
          <LinearGradient colors={[...GRADIENT]} style={styles.dialogIconGrad}>
            <Ionicons name="volume-medium" size={26} color="#fff" />
          </LinearGradient>
        }
      />
    </SafeAreaView>
  );
}

const AVATAR = 52;

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 0,
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  /** Figma — circular container, thin border, cover (no stretch) */
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
  unmuteOuter: {
    marginLeft: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  unmuteBorder: {
    borderRadius: 999,
    padding: 2,
  },
  unmuteInner: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  unmuteLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptyWrap: {
    marginTop: 56,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  emptyIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  emptyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: '#64748b',
    textAlign: 'center',
  },
  noMatchWrap: {
    marginTop: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noMatchText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  dialogIconGrad: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
