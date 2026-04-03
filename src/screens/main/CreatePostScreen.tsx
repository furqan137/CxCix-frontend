import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BRAND_GRADIENT } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'CreatePost'>;

/** Figma-aligned tokens (Create Post composer) */
const C = {
  pageBg: '#F4F7F9',
  ink: '#1A202C',
  muted: '#64748B',
  placeholder: '#A0AEC0',
  border: '#E2E8F0',
  borderHairline: '#EEF2F6',
  dashed: '#CBD5E1',
  radioOn: '#2563EB',
  radioOff: '#CBD5E1',
  closeBg: '#F1F5F9',
  white: '#FFFFFF',
} as const;

const AVATAR = 52;
const GAP = 12;
const PAD_SCREEN = 16;
const PAD_CARD = 20;
const SECTION_GAP = 24;
const LABEL_MB = 12;
const ROW_ICON = 22;

/**
 * Create Post — spacing, type, and CTAs aligned to Figma (Wade photo + pier preview).
 */
export default function CreatePostScreen({ navigation }: Props) {
  const [body, setBody] = useState('');
  const [mediaKind, setMediaKind] = useState<'human' | 'ai'>('human');
  const [showPreview, setShowPreview] = useState(true);
  const max = 280;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header — white bar, centered title, pill Post */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          accessibilityLabel="Close"
          hitSlop={8}
        >
          <Ionicons name="close" size={22} color={C.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Post</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Publish post"
          hitSlop={8}
        >
          <LinearGradient
            colors={[BRAND_GRADIENT[0], BRAND_GRADIENT[1]]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.postPill}
          >
            <Text style={styles.postPillText}>Post</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Main composer card */}
        <View style={styles.mainCard}>
          <View style={styles.profileRow}>
            <Image
              source={Images.avatarWade}
              style={styles.avatar}
              resizeMode="cover"
              accessibilityLabel="Wade Warren"
            />
            <View style={styles.nameBlock}>
              <Text style={styles.displayName}>Wade Warren</Text>
              <Text style={styles.handle}>@wade_warren</Text>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Write something..."
            placeholderTextColor={C.placeholder}
            multiline
            value={body}
            onChangeText={setBody}
            maxLength={max}
            textAlignVertical="top"
          />

          {showPreview ? (
            <View style={styles.previewWrap}>
              <Image
                source={Images.createPost.previewPier}
                style={styles.previewImg}
                resizeMode="cover"
              />
              <Pressable
                onPress={() => setShowPreview(false)}
                style={styles.removeMedia}
                accessibilityLabel="Remove media"
              >
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>
          ) : null}

          <Pressable style={styles.addMediaBtn} accessibilityRole="button">
            <Ionicons name="add" size={22} color={C.placeholder} />
            <Text style={styles.addMediaText}>+ Add Media</Text>
          </Pressable>

          <View style={styles.toolbarRow}>
            <View style={styles.toolbarIcons}>
              <Ionicons name="image-outline" size={24} color={C.placeholder} />
              <Ionicons name="videocam-outline" size={24} color={C.placeholder} />
              <Ionicons name="location-outline" size={24} color={C.placeholder} />
              <Ionicons name="person-add-outline" size={24} color={C.placeholder} />
            </View>
            <Text style={styles.counter}>
              {body.length} / {max}
            </Text>
          </View>
        </View>

        {/* Media Type */}
        <Text style={styles.sectionLabel}>Media Type</Text>

        <Pressable
          onPress={() => setMediaKind('human')}
          style={[styles.optionCard, styles.optionCardMargin]}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="person" size={ROW_ICON} color={C.radioOn} />
            <Text style={styles.optionText}>Human-made / Original</Text>
          </View>
          <Radio selected={mediaKind === 'human'} />
        </Pressable>

        <Pressable onPress={() => setMediaKind('ai')} style={styles.optionCard}>
          <View style={styles.optionLeft}>
            <Image
              source={Images.createPost.iconSparkles}
              style={{ width: ROW_ICON, height: ROW_ICON }}
              resizeMode="contain"
            />
            <Text style={styles.optionText}>AI-generated / AI-edited</Text>
          </View>
          <Radio selected={mediaKind === 'ai'} />
        </Pressable>

        {/* AI Writing Tools — side by side */}
        <Text style={[styles.sectionLabel, { marginTop: SECTION_GAP }]}>AI Writing Tools</Text>

        <View style={styles.aiRow}>
          <LinearGradient
            colors={[BRAND_GRADIENT[0], BRAND_GRADIENT[1]]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.aiGradient}
          >
            <Pressable style={styles.aiGradientInner} accessibilityRole="button">
              <Image
                source={Images.createPost.iconDraftAi}
                style={styles.aiIcon}
                resizeMode="contain"
              />
              <Text style={styles.aiGradientText} numberOfLines={2}>
                Draft with AI
              </Text>
            </Pressable>
          </LinearGradient>

          <Pressable style={styles.splitBtn} accessibilityRole="button">
            <Image
              source={Images.createPost.iconSplit}
              style={styles.aiIcon}
              resizeMode="contain"
            />
            <Text style={styles.splitText} numberOfLines={2}>
              Split into thread
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View
      style={[
        styles.radioOuter,
        {
          borderColor: selected ? C.radioOn : C.radioOff,
          backgroundColor: selected ? C.radioOn : 'transparent',
        },
      ]}
    >
      {selected ? <View style={styles.radioInner} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD_SCREEN,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.borderHairline,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.closeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.ink,
    letterSpacing: -0.2,
  },
  postPill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
    minWidth: 72,
    alignItems: 'center',
  },
  postPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },
  scrollContent: {
    paddingHorizontal: PAD_SCREEN,
    paddingTop: PAD_SCREEN,
    paddingBottom: 48,
  },
  mainCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: PAD_CARD,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  nameBlock: {
    marginLeft: GAP,
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
    lineHeight: 22,
  },
  handle: {
    marginTop: 2,
    fontSize: 14,
    color: C.muted,
    lineHeight: 20,
  },
  input: {
    marginTop: 16,
    minHeight: 100,
    fontSize: 16,
    lineHeight: 24,
    color: C.ink,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  previewWrap: {
    marginTop: 16,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImg: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeMedia: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.dashed,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: C.white,
  },
  addMediaText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: C.placeholder,
  },
  toolbarRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.borderHairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  counter: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    color: C.placeholder,
  },
  sectionLabel: {
    marginTop: SECTION_GAP,
    marginBottom: LABEL_MB,
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  optionCardMargin: {
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: C.ink,
    flexShrink: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.white,
  },
  aiRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  aiGradient: {
    flex: 1,
    borderRadius: 16,
    minHeight: 52,
    overflow: 'hidden',
  },
  aiGradientInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 8,
  },
  aiIcon: {
    width: 22,
    height: 22,
  },
  aiGradientText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
    textAlign: 'center',
  },
  splitBtn: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.ink,
    backgroundColor: C.white,
    gap: 8,
  },
  splitText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: C.ink,
    textAlign: 'center',
  },
});
