import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { apiBookmarkPost } from '../../api/posts';
import { getApiMessage } from '../../api/auth';
import { Images } from '../../constants/images';
import { MOOD_LABELS, MOODS, moodLabelToMoodId, type MoodId } from '../../constants/moods';
import { BottomSheetModal } from '../ui/BottomSheetModal';

/** Figma / brand: primary blue, readable label blue, CTA multi-stop. */
const BLUE = '#4A90E2';
const TITLE = '#0F172A';
/** List row labels — black (Figma body text). */
const ROW_LABEL = '#0F172A';
/** Figma: thin, soft grey card stroke */
const BORDER_MUTED = '#E5E7EB';
const RADIO_MUTED = '#94A3B8';
const ROW_GRADIENT = ['#4A90E2', '#C4B5FD', '#E1B767'] as const;
const SAVE_GRADIENT = ['#4A90E2', '#7C3AED', '#D4A24C'] as const;
const SAVE_LOCATIONS = [0, 0.5, 1] as const;

const ICON_BOX = 32;

type Draft = {
  author: string;
  handle: string;
  timeLabel: string;
  body: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  postId: string | null;
  initialCollectionMood?: string | null;
  draft?: Draft;
  onSaved?: () => void;
};

/** Figma: ~12–16px card radius */
const ROW_R = 14;
const GRADIENT_RING = 2;

function MoodRow({
  mood,
  isActive,
  isLast,
  onSelect,
}: {
  mood: MoodId;
  isActive: boolean;
  isLast: boolean;
  onSelect: () => void;
}) {
  const iconSource = Images.bookmarkMood[mood];
  const label = `Save for ${MOOD_LABELS[mood]}`;

  const body = (
    <View style={styles.rowBody}>
      <View style={styles.iconBox}>
        <Image source={iconSource} style={styles.moodIcon} resizeMode="contain" />
      </View>
      <View style={styles.labelCol}>
        <Text
          style={styles.labelText}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </View>
      <Radio selected={isActive} />
    </View>
  );

  if (isActive) {
    return (
      <Pressable
        onPress={onSelect}
        style={({ pressed }) => [styles.rowMargin, !isLast && styles.rowSpacer, pressed && { opacity: 0.95 }]}
        accessibilityLabel={label}
        accessibilityState={{ selected: true }}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[...ROW_GRADIENT]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.gradRing, { borderRadius: ROW_R + GRADIENT_RING, padding: GRADIENT_RING }]}
        >
          <View
            style={[
              styles.rowInnerOnGradient,
              { borderRadius: ROW_R },
            ]}
          >
            {body}
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.rowPlain,
        !isLast && styles.rowSpacer,
        pressed && { opacity: 0.95 },
      ]}
      accessibilityLabel={label}
      accessibilityState={{ selected: false }}
      accessibilityRole="button"
    >
      {body}
    </Pressable>
  );
}

export function SaveBookmarkSheet({
  visible,
  onClose,
  postId,
  initialCollectionMood,
  draft: _draft,
  onSaved,
}: Props) {
  const [selected, setSelected] = useState<MoodId>('calm');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelected(moodLabelToMoodId(initialCollectionMood ?? undefined));
    }
  }, [visible, initialCollectionMood]);

  const isSaved = Boolean(initialCollectionMood);
  const { height: windowH } = useWindowDimensions();
  /** Min height ~58% — slightly shorter than before while keeping a roomy sheet */
  const sheetMinHeight = Math.round(windowH * 0.58);
  const sheetMaxHeightRatio = 0.72;

  const onSave = async () => {
    if (!postId) {
      Alert.alert('Missing post', 'Could not determine which post to save.');
      return;
    }
    setSaving(true);
    try {
      await apiBookmarkPost(postId, { collectionMood: MOOD_LABELS[selected] });
      onSaved?.();
      onClose();
    } catch (e) {
      Alert.alert('Could not save', getApiMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async () => {
    if (!postId) return;
    setRemoving(true);
    try {
      await apiBookmarkPost(postId, { remove: true });
      onSaved?.();
      onClose();
    } catch (e) {
      Alert.alert('Could not remove', getApiMessage(e));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      maxHeightRatio={sheetMaxHeightRatio}
      topBorderRadius={32}
    >
      <View style={[styles.sheetInner, { minHeight: sheetMinHeight }]}>
        <Text style={styles.kicker}>SAVE BOOKMARK</Text>
        <Text style={styles.title}>Choose where to save this post</Text>

        <View style={styles.list}>
          {MOODS.map((m, index) => (
            <MoodRow
              key={m}
              mood={m}
              isActive={selected === m}
              isLast={index === MOODS.length - 1}
              onSelect={() => setSelected(m)}
            />
          ))}
        </View>

        <Pressable
          onPress={() => void onSave()}
          disabled={saving || removing || !postId}
          style={[styles.saveBtnOuter, (!postId || saving) && { opacity: 0.5 }]}
          accessibilityRole="button"
          accessibilityLabel="Save bookmark"
        >
          <LinearGradient
            colors={[...SAVE_GRADIENT]}
            locations={[...SAVE_LOCATIONS]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.saveGradient}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </LinearGradient>
        </Pressable>

        {isSaved ? (
          <Pressable
            onPress={() => void onRemove()}
            disabled={removing || saving}
            style={styles.removeBtn}
            accessibilityRole="button"
            accessibilityLabel="Remove bookmark"
          >
            {removing ? (
              <ActivityIndicator color="#6B7280" />
            ) : (
              <Text style={styles.removeText}>Remove bookmark</Text>
            )}
          </Pressable>
        ) : null}
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
          borderColor: selected ? BLUE : RADIO_MUTED,
          backgroundColor: selected ? BLUE : 'transparent',
        },
      ]}
    >
      {selected ? <View style={styles.radioInner} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheetInner: {
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: BLUE,
  },
  title: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '700',
    color: TITLE,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  list: {
    marginTop: 28,
    width: '100%',
    alignSelf: 'stretch',
  },
  rowPlain: {
    width: '100%',
    minHeight: 60,
    borderRadius: ROW_R,
    borderWidth: 1,
    borderColor: BORDER_MUTED,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rowBody: {
    width: '100%',
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  /** Figma: gradient “ring” around selected row, white content inside. */
  rowMargin: {
    width: '100%',
  },
  gradRing: {
    width: '100%',
  },
  rowInnerOnGradient: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  rowSpacer: {
    marginBottom: 14,
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodIcon: {
    width: 28,
    height: 28,
  },
  /**
   * Critical for RN: flex:1 + minWidth:0 so label text is measured and not clipped
   * (avoids a row where only icons/radios show on some devices).
   */
  labelCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: ROW_LABEL,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  saveBtnOuter: {
    marginTop: 32,
    borderRadius: 9999,
    overflow: 'hidden',
    width: '100%',
  },
  saveGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  removeBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  removeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
