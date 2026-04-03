import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Images } from '../../constants/images';
import { MOOD_LABELS, MOODS, type MoodId } from '../../constants/moods';
import type { MainStackParamList } from '../../navigation/types';
import { useBookmarksStore } from '../../store/useBookmarksStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<MainStackParamList, 'Saved'>;

const PAGE = '#F8FAFC';
const CARD = '#FFFFFF';
const INK = '#0F172A';
const MUTED = '#64748B';
const BADGE_BG = '#E0E7FF';
const BADGE_TEXT = '#2563EB';

export default function SavedScreen({ navigation }: Props) {
  const items = useBookmarksStore((s) => s.items);
  const [openMood, setOpenMood] = useState<MoodId | null>('serious');

  const counts = useMemo(() => {
    return {
      calm: 14,
      serious: 4,
      creative: 9,
      satire: 5,
      debate: 3,
      vawulence: 14,
    };
  }, []);

  const toggle = (m: MoodId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenMood((prev) => (prev === m ? null : m));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>

        <Text style={styles.title}>Saved</Text>

        <Pressable
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.section}>Your bookmark collections</Text>

        {MOODS.map((m) => {
          const open = openMood === m;
          const preview = items.find((x) => x.mood === m);

          return (
            <View key={m} style={styles.card}>
              
              {/* HEADER ROW */}
              <Pressable onPress={() => toggle(m)} style={styles.row}>
                
                <Image
                  source={Images.bookmarkMood[m]}
                  style={styles.icon}
                />

                <Text style={styles.mood}>{MOOD_LABELS[m]}</Text>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{counts[m]}</Text>
                </View>

                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94a3b8"
                />
              </Pressable>

              {/* EXPAND */}
              {open && (
                <View style={styles.expand}>
                  
                  {preview ? (
                    <>
                      <View style={styles.preview}>
                        
                        <View style={styles.previewHeader}>
                          <Image source={Images.avatarSplit} style={styles.avatar} />

                          <View>
                            <Text style={styles.author}>{preview.author}</Text>
                            <Text style={styles.sub}>
                              {preview.handle} · {preview.timeLabel}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.body}>{preview.body}</Text>
                      </View>

                      <Pressable style={styles.link}>
                        <Text style={styles.linkText}>See All Items →</Text>
                      </Pressable>
                    </>
                  ) : (
                    <View style={styles.preview}>
                      <Text style={styles.empty}>
                        No bookmarks in {MOOD_LABELS[m]} yet.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: INK,
  },

  scroll: {
    padding: 16,
    paddingBottom: 120,
  },

  section: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    color: INK,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    marginBottom: 12,
    paddingVertical: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  icon: {
    width: 26,
    height: 26,
  },

  mood: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: INK,
  },

  badge: {
    minWidth: 36,
    height: 28,
    borderRadius: 14,
    backgroundColor: BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginRight: 8,
  },

  badgeText: {
    color: BADGE_TEXT,
    fontWeight: '700',
  },

  expand: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },

  preview: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 14,
  },

  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },

  author: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },

  sub: {
    fontSize: 12,
    color: MUTED,
  },

  body: {
    marginTop: 10,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },

  empty: {
    fontSize: 14,
    color: MUTED,
  },

  link: {
    alignItems: 'center',
    marginTop: 10,
  },

  linkText: {
    color: '#2563EB',
    fontWeight: '600',
  },
});