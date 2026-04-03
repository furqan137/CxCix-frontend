import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';

const PAGE = '#F9FAFB';
const H_PAD = 16;
const AVATAR = 48;

type Notif = {
  id: string;
  avatar: ImageSourcePropType;
  user: string;
  message: string;
  time: string;
  perspectiveBadge?: string;
};

const ROWS: Notif[] = [
  {
    id: '1',
    avatar: Images.notificationAvatar.row1,
    user: '@lily_smith',
    message: 'followed you',
    time: '2m ago',
  },
  {
    id: '2',
    avatar: Images.notificationAvatar.row2,
    user: '@jane_cooper',
    message: 'liked your photo',
    time: '5m ago',
  },
  {
    id: '3',
    avatar: Images.notificationAvatar.row3,
    user: '@leslie',
    message: 'followed you',
    time: '10m ago',
  },
  {
    id: '4',
    avatar: Images.notificationAvatar.row4,
    user: '@kristin_watson',
    message: 'mentioned you in a respond',
    time: '15m ago',
  },
  {
    id: '5',
    avatar: Images.notificationAvatar.row5,
    user: '@guy_hawkins',
    message: 'shifted your post',
    time: '30m ago',
    perspectiveBadge: 'PERSPECTIVE: COUNTERPOINT',
  },
  {
    id: '6',
    avatar: Images.notificationAvatar.row6,
    user: '@robert_fox',
    message: 'mentioned you in a comment',
    time: '1h ago',
  },
  {
    id: '7',
    avatar: Images.notificationAvatar.row7,
    user: '@femmyapson',
    message: 'replied under your post',
    time: '2h ago',
  },
  {
    id: '8',
    avatar: Images.notificationAvatar.row8,
    user: '@cody_fisher',
    message: 'liked your post',
    time: 'Jan 11',
  },
];

/**
 * Notifications — Figma: light page, white elevated cards, circular avatars, perspective tag.
 */
export default function NotificationsScreen() {
  const navigation = useNavigation();

  const stackNav = useCallback(() => {
    return navigation.getParent() as
      | { navigate: (name: keyof MainStackParamList, params?: object) => void }
      | undefined;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable
          onPress={() => stackNav()?.navigate('Settings')}
          style={styles.headerIconBtn}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {ROWS.map((n) => (
          <View key={n.id} style={styles.card}>
            <Image source={n.avatar} style={styles.avatar} resizeMode="cover" />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <View style={styles.textBlock}>
                  <Text style={styles.line}>
                    <Text style={styles.user}>{n.user}</Text>
                    <Text style={styles.message}> {n.message}</Text>
                  </Text>
                </View>
                <Text style={styles.time}>{n.time}</Text>
              </View>
              {n.perspectiveBadge ? (
                <View style={styles.badgeWrap}>
                  <Text style={styles.badgeText}>
                    | {n.perspectiveBadge}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
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
