import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Images } from '../../constants/images';
import { MOOD_LABELS, MOODS, type MoodId } from '../../constants/moods';
import { useBookmarksStore } from '../../store/useBookmarksStore';
import { BottomSheetModal } from '../ui/BottomSheetModal';

/** Figma: blue → purple → gold */
const BOOKMARK_GRADIENT = ['#5B7FFF', '#A78BFA', '#E9C46A'] as const;

type Draft = {
  author: string;
  handle: string;
  timeLabel: string;
  body: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  draft?: Draft;
};

const ICON_SIZE = 28;
const ROW_R = 16;
const RING = 2;

/**
 * Save Bookmark sheet — Figma: mood icons, gradient selected ring, Save CTA.
 * Row content must be a single View (not Fragment) so flex row lays out on RN.
 */
export function SaveBookmarkSheet({ visible, onClose, draft }: Props) {
  const save = useBookmarksStore((s) => s.save);
  const [selected, setSelected] = useState<MoodId>('calm');

  const item = useMemo(
    () =>
      draft ?? {
        author: 'Elena Fisher',
        handle: '@elenadesign',
        timeLabel: '2h',
        body: 'Taking a moment to breathe today. The world is quiet and everything feels aligned. Sending peace to everyone on the timeline. 🌿',
      },
    [draft],
  );

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightRatio={0.78}>
      <View style={styles.sheetInner}>
        <Text style={styles.kicker}>SAVE BOOKMARK</Text>
        <Text style={styles.title}>Choose where to save this post</Text>

        <View style={styles.list}>
          {MOODS.map((m) => {
            const active = selected === m;
            const iconSource = Images.bookmarkMood[m];

            const rowContent = (
              <View style={styles.rowContent}>
                <Image
                  source={iconSource}
                  style={{ width: ICON_SIZE, height: ICON_SIZE }}
                  resizeMode="contain"
                />
                <Text style={styles.rowLabel} numberOfLines={2}>
                  Save for {MOOD_LABELS[m]}
                </Text>
                <Radio selected={active} />
              </View>
            );

            if (active) {
              return (
                <LinearGradient
                  key={m}
                  colors={BOOKMARK_GRADIENT}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.ring}
                >
                  <Pressable
                    onPress={() => setSelected(m)}
                    style={({ pressed }) => [styles.rowActivePressable, pressed && { opacity: 0.95 }]}
                  >
                    {rowContent}
                  </Pressable>
                </LinearGradient>
              );
            }

            return (
              <Pressable
                key={m}
                onPress={() => setSelected(m)}
                style={({ pressed }) => [styles.rowIdle, pressed && { opacity: 0.95 }]}
              >
                {rowContent}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            save({ mood: selected, ...item });
            onClose();
          }}
          style={styles.saveBtnOuter}
          accessibilityRole="button"
          accessibilityLabel="Save bookmark"
        >
          <LinearGradient
            colors={BOOKMARK_GRADIENT}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.saveGradient}
          >
            <Text style={styles.saveText}>Save</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View
      style={[
        styles.radioOuter,
        {
          borderColor: selected ? '#2563EB' : '#CBD5E1',
          backgroundColor: selected ? '#2563EB' : 'transparent',
        },
      ]}
    >
      {selected ? <View style={styles.radioInner} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheetInner: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#2563EB',
  },
  title: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  list: {
    marginTop: 20,
    gap: 12,
    width: '100%',
  },
  ring: {
    width: '100%',
    borderRadius: ROW_R + RING,
    padding: RING,
  },
  rowActivePressable: {
    borderRadius: ROW_R,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  rowIdle: {
    width: '100%',
    borderRadius: ROW_R,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  rowLabel: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  saveBtnOuter: {
    marginTop: 24,
    borderRadius: 9999,
    overflow: 'hidden',
    width: '100%',
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
