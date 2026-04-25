import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { apiGeneratePost } from '../../api/ai';
import { getApiMessage } from '../../api/auth';
import { apiCreatePost } from '../../api/posts';
import { apiSearchUsers, type PublicUser } from '../../api/users';
import { BRAND_GRADIENT } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

type Props = NativeStackScreenProps<MainStackParamList, 'CreatePost'>;

type PickedAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

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
 * Create Post — publishes via `POST /api/posts` (multipart). Mood classification runs on the server.
 * “Draft with AI” uses `POST /api/ai/draft` (Wavespeed).
 */
const SCREEN_H = Dimensions.get('window').height;

export default function CreatePostScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();

  const [body, setBody] = useState('');
  const [mediaKind, setMediaKind] = useState<'human' | 'ai'>('human');
  const [mediaAssets, setMediaAssets] = useState<PickedAsset[]>([]);
  const [posting, setPosting] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const [location, setLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [tagResults, setTagResults] = useState<PublicUser[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<PublicUser[]>([]);

  const max = 280;

  const displayName = formatUserDisplayName(
    {
      fullName: user?.fullName,
      displayName: user?.displayName,
      username: user?.username,
      email: user?.email,
    },
    'You',
  );
  const handle = user ? formatAtUsername(user.username) : formatAtUsername(null, 'you');
  const avatarSource = user?.avatarUrl ? { uri: user.avatarUrl } : Images.avatarWade;

  const pickMedia = async (kind: 'image' | 'video' | 'any' = 'any') => {
    if (mediaAssets.length >= 5) {
      Alert.alert('Limit', 'You can attach up to 5 files.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to add media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        kind === 'image'
          ? ImagePicker.MediaTypeOptions.Images
          : kind === 'video'
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 5 - mediaAssets.length),
      quality: 0.85,
    });
    if (result.canceled) return;
    setMediaAssets((prev) => {
      const added: PickedAsset[] = result.assets.map((a) => ({
        uri: a.uri,
        mimeType: a.mimeType,
        fileName: a.fileName,
      }));
      return [...prev, ...added].slice(0, 5);
    });
  };

  const removeMedia = (index: number) => {
    setMediaAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const onPickLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location', 'Permission denied.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    let label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const rows = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const r = rows?.[0];
      const parts = [r?.city, r?.region, r?.country].filter(Boolean);
      if (parts.length) label = parts.join(', ');
    } catch {
      // ignore; coords label is fine
    }
    setLocation({ lat, lng, label });
  };

  const toggleTaggedUser = (u: PublicUser) => {
    setTaggedUsers((prev) => {
      const exists = prev.some((x) => x._id === u._id);
      if (exists) return prev.filter((x) => x._id !== u._id);
      return [...prev, u].slice(0, 20);
    });
  };

  useEffect(() => {
    if (!tagModalOpen) return;
    const q = tagQuery.trim();
    if (q.length < 2) {
      setTagResults([]);
      return;
    }
    setTagLoading(true);
    const t = setTimeout(() => {
      void (async () => {
        try {
          const users = await apiSearchUsers(q);
          setTagResults(users);
        } catch {
          setTagResults([]);
        } finally {
          setTagLoading(false);
        }
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [tagModalOpen, tagQuery]);

  const appendFormFile = (form: FormData, asset: PickedAsset, index: number) => {
    const isVideo =
      asset.mimeType?.startsWith('video') ||
      /\.(mp4|mov|m4v)$/i.test(asset.uri) ||
      asset.fileName?.match(/\.(mp4|mov|m4v)$/i);
    const name =
      asset.fileName?.replace(/\s+/g, '_') ??
      (isVideo ? `clip_${index}.mp4` : `photo_${index}.jpg`);
    const type = asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg');
    // RN multipart expects local `uri` from the picker (see Expo upload guides).
    form.append('media', { uri: asset.uri, name, type } as unknown as Blob);
  };

  const submitPost = async () => {
    const trimmed = body.trim();
    if (!trimmed && mediaAssets.length === 0) {
      Alert.alert('Empty post', 'Add text or media before posting.');
      return;
    }
    if (trimmed.length > max) {
      Alert.alert('Too long', 'Posts are limited to 280 characters.');
      return;
    }
    setPosting(true);
    try {
      const form = new FormData();
      form.append('text', trimmed);
      form.append('mediaOrigin', mediaKind);
      mediaAssets.forEach((asset, i) => appendFormFile(form, asset, i));
      if (location) {
        form.append('locationLat', String(location.lat));
        form.append('locationLng', String(location.lng));
        form.append('locationLabel', location.label);
      }
      if (taggedUsers.length) {
        form.append('taggedUsers', JSON.stringify(taggedUsers.map((u) => u._id)));
      }
      await apiCreatePost(form);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not post', getApiMessage(e));
    } finally {
      setPosting(false);
    }
  };

  const onDraftAi = async () => {
    setDrafting(true);
    try {
      const prompt = body.trim();
      const text = await apiGeneratePost({
        prompt,
        mood: 'Calm',
      });
      setBody(text.slice(0, max));
    } catch (e) {
      Alert.alert('Draft failed', getApiMessage(e));
    } finally {
      setDrafting(false);
    }
  };

  const onSplitThread = () => {
    setBody((prev) => {
      const t = prev.trim();
      if (!t) return '\n\n---\n\n';
      if (t.includes('\n\n---\n\n')) return t;
      return `${t}\n\n---\n\n`;
    });
  };

  const canSubmit =
    !posting && (body.trim().length > 0 || mediaAssets.length > 0) && body.length <= max;

  const closeTagModal = () => {
    setTagModalOpen(false);
    setTagQuery('');
    setTagResults([]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Modal
        visible={tagModalOpen}
        animationType="slide"
        transparent
        onRequestClose={closeTagModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.tagModalRoot}
        >
          <Pressable style={styles.tagModalBackdrop} onPress={closeTagModal} accessibilityLabel="Dismiss" />
          <View
            style={[
              styles.tagSheet,
              {
                maxHeight: SCREEN_H * 0.88,
                paddingBottom: Math.max(insets.bottom, 14),
              },
            ]}
          >
            <View style={styles.tagSheetHandle} />
            <View style={styles.tagSheetHeader}>
              <Text style={styles.tagSheetTitle}>Tag people</Text>
              <Pressable onPress={closeTagModal} hitSlop={12} accessibilityRole="button">
                <Text style={styles.tagSheetDone}>Done</Text>
              </Pressable>
            </View>
            <Text style={styles.tagSheetHint}>Search by name or @username, then tap to tag.</Text>

            <TextInput
              value={tagQuery}
              onChangeText={setTagQuery}
              placeholder="Search…"
              placeholderTextColor={C.placeholder}
              style={styles.tagSearchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />

            {taggedUsers.length ? (
              <View style={styles.tagChipWrap}>
                {taggedUsers.map((u) => (
                  <Pressable
                    key={u._id}
                    onPress={() => toggleTaggedUser(u)}
                    style={styles.tagChip}
                  >
                    <Text style={styles.tagChipText}>@{u.username}</Text>
                    <Ionicons name="close" size={14} color={C.muted} />
                  </Pressable>
                ))}
              </View>
            ) : null}

            {tagLoading ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator color={C.radioOn} />
              </View>
            ) : null}

            {tagQuery.trim().length < 2 && !tagLoading ? (
              <Text style={styles.tagEmptyHint}>Type at least 2 characters to search.</Text>
            ) : null}

            <FlatList
              data={tagResults}
              keyExtractor={(u) => u._id}
              keyboardShouldPersistTaps="handled"
              style={styles.tagResultsList}
              contentContainerStyle={styles.tagResultsListContent}
              renderItem={({ item: u }) => {
                const selected = taggedUsers.some((x) => x._id === u._id);
                return (
                  <Pressable
                    onPress={() => toggleTaggedUser(u)}
                    style={[
                      styles.tagResultRow,
                      selected && { backgroundColor: '#f8fafc' },
                    ]}
                  >
                    <Image
                      source={u.avatarUrl ? { uri: u.avatarUrl } : Images.avatarWade}
                      style={styles.tagResultAvatar}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: C.ink }}>
                        {formatUserDisplayName({
                          fullName: u.fullName,
                          displayName: u.displayName,
                          username: u.username,
                        })}
                      </Text>
                      <Text style={{ fontSize: 13, color: C.muted }}>{formatAtUsername(u.username)}</Text>
                    </View>
                    <View
                      style={[
                        styles.tagRadioOuter,
                        {
                          borderColor: selected ? C.radioOn : C.radioOff,
                          backgroundColor: selected ? C.radioOn : 'transparent',
                        },
                      ]}
                    >
                      {selected ? <View style={styles.tagRadioInner} /> : null}
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                !tagLoading && tagQuery.trim().length >= 2 ? (
                  <Text style={{ paddingVertical: 20, color: C.muted, textAlign: 'center' }}>
                    No users found.
                  </Text>
                ) : null
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.flex}>
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
                onPress={submitPost}
                disabled={!canSubmit}
                accessibilityLabel="Publish post"
                hitSlop={8}
                style={{ opacity: canSubmit ? 1 : 0.45 }}
              >
                <LinearGradient
                  colors={[BRAND_GRADIENT[0], BRAND_GRADIENT[1]]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.postPill}
                >
                  {posting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.postPillText}>Post</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            <KeyboardAwareScrollView
              enableOnAndroid
              extraScrollHeight={20}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.mainCard}>
                <View style={styles.profileRow}>
                  <Image
                    source={avatarSource}
                    style={styles.avatar}
                    resizeMode="cover"
                    accessibilityLabel={displayName}
                  />
                  <View style={styles.nameBlock}>
                    <Text style={styles.displayName}>{displayName}</Text>
                    <Text style={styles.handle}>{handle}</Text>
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

          {location ? (
            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location" size={16} color={C.muted} />
              <Text style={{ marginLeft: 6, color: C.muted, fontSize: 13 }} numberOfLines={1}>
                {location.label}
              </Text>
              <Pressable onPress={() => setLocation(null)} hitSlop={8} style={{ marginLeft: 10 }}>
                <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 13 }}>Remove</Text>
              </Pressable>
            </View>
          ) : null}

          {taggedUsers.length ? (
            <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {taggedUsers.slice(0, 6).map((u) => (
                <View
                  key={u._id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#f1f5f9',
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ color: C.ink, fontSize: 12, fontWeight: '700' }}>@{u.username}</Text>
                  <Pressable onPress={() => toggleTaggedUser(u)} hitSlop={8} style={{ marginLeft: 6 }}>
                    <Ionicons name="close" size={14} color={C.muted} />
                  </Pressable>
                </View>
              ))}
              {taggedUsers.length > 6 ? (
                <Text style={{ color: C.muted, fontSize: 12, paddingVertical: 6 }}>
                  +{taggedUsers.length - 6} more
                </Text>
              ) : null}
            </View>
          ) : null}

          {mediaAssets.map((asset, index) => {
            const isVideo =
              asset.mimeType?.startsWith('video') ||
              /\.(mp4|mov|m4v)$/i.test(asset.uri);
            return (
              <View key={`${asset.uri}-${index}`} style={styles.previewWrap}>
                {isVideo ? (
                  <View style={[styles.previewImg, styles.videoPlaceholder]}>
                    <Ionicons name="videocam" size={44} color="#fff" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: asset.uri }}
                    style={styles.previewImg}
                    resizeMode="cover"
                  />
                )}
                <Pressable
                  onPress={() => removeMedia(index)}
                  style={styles.removeMedia}
                  accessibilityLabel="Remove media"
                >
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
              </View>
            );
          })}

          <Pressable
            style={styles.addMediaBtn}
            accessibilityRole="button"
            onPress={() => void pickMedia('any')}
          >
            <Ionicons name="add" size={22} color={C.placeholder} />
            <Text style={styles.addMediaText}>+ Add Media</Text>
          </Pressable>

          <View style={styles.toolbarRow}>
            <View style={styles.toolbarIcons}>
              <Pressable onPress={() => void pickMedia('image')} hitSlop={6}>
                <Ionicons name="image-outline" size={24} color={C.placeholder} />
              </Pressable>
              <Pressable onPress={() => void pickMedia('video')} hitSlop={6}>
                <Ionicons name="videocam-outline" size={24} color={C.placeholder} />
              </Pressable>
              <Pressable onPress={() => void onPickLocation()} hitSlop={6}>
                <Ionicons
                  name={location ? 'location' : 'location-outline'}
                  size={24}
                  color={location ? '#2563EB' : C.placeholder}
                />
              </Pressable>
              <Pressable onPress={() => setTagModalOpen(true)} hitSlop={6}>
                <Ionicons
                  name="person-add-outline"
                  size={24}
                  color={taggedUsers.length ? '#2563EB' : C.placeholder}
                />
              </Pressable>
            </View>
            <Text style={styles.counter}>
              {body.length} / {max}
            </Text>
          </View>
        </View>

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

        <Text style={[styles.sectionLabel, { marginTop: SECTION_GAP }]}>AI Writing Tools</Text>

        <View style={styles.aiRow}>
          <LinearGradient
            colors={[BRAND_GRADIENT[0], BRAND_GRADIENT[1]]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.aiGradient, { opacity: drafting ? 0.7 : 1 }]}
          >
            <Pressable
              style={styles.aiGradientInner}
              accessibilityRole="button"
              onPress={onDraftAi}
              disabled={drafting}
            >
              {drafting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Image
                  source={Images.createPost.iconDraftAi}
                  style={styles.aiIcon}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.aiGradientText} numberOfLines={2}>
                Draft with AI
              </Text>
            </Pressable>
          </LinearGradient>

          <Pressable
            style={styles.splitBtn}
            accessibilityRole="button"
            onPress={onSplitThread}
          >
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
            </KeyboardAwareScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  tagModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tagModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  tagSheet: {
    width: '100%',
    backgroundColor: C.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: PAD_SCREEN,
    paddingTop: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  tagSheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginBottom: 10,
  },
  tagSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tagSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
  },
  tagSheetDone: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 16,
  },
  tagSheetHint: {
    fontSize: 13,
    color: C.muted,
    marginBottom: 12,
    lineHeight: 18,
  },
  tagSearchInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: C.ink,
    fontSize: 16,
    marginBottom: 10,
  },
  tagChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    maxHeight: 120,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tagChipText: {
    color: C.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  tagEmptyHint: {
    paddingVertical: 10,
    color: C.muted,
    textAlign: 'center',
    fontSize: 14,
  },
  tagResultsList: {
    flexGrow: 0,
    minHeight: 120,
    maxHeight: SCREEN_H * 0.42,
  },
  tagResultsListContent: {
    paddingBottom: 8,
  },
  tagResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.borderHairline,
  },
  tagResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  tagRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.white,
  },
  safe: {
    flex: 1,
    backgroundColor: C.pageBg,
  },
  flex: {
    flex: 1,
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
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  videoPlaceholder: {
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
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
