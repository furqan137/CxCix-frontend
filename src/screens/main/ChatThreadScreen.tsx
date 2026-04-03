import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import {
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
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

type Props = NativeStackScreenProps<MainStackParamList, 'ChatThread'>;

const PAGE = '#F4F7F9';
/** Outgoing bubble + send — gold → indigo (Figma) */
const OUT_GRADIENT = ['#FACC15', '#F59E0B', '#6366F1'] as const;

const PEER_AVATARS: Record<ChatAvatarKey, ImageSourcePropType> = {
  annette: Images.mutedAccountAvatar.one,
  alex: Images.messages.listRow1,
  sarah: Images.messages.listRow2,
  wade: Images.avatarWade,
  ralph: Images.messages.listRow3,
  eleanor: Images.messages.listRow4,
  marvin: Images.messages.listRow5,
};

type Msg =
  | { id: string; kind: 'in'; text: string; time: string }
  | { id: string; kind: 'out'; text: string; time: string; read?: boolean }
  | { id: string; kind: 'media'; caption: string; time: string };

const DEMO_MESSAGES: Msg[] = [
  {
    id: '1',
    kind: 'in',
    text: 'Hi Wade, did you get a chance to review the latest mocks?',
    time: '10:24 AM',
  },
  {
    id: '2',
    kind: 'out',
    text: 'Yes! Just left a few comments on the chat thread.',
    time: '10:26 AM',
    read: true,
  },
  {
    id: '3',
    kind: 'in',
    text: 'Perfect — I’ll sync with design today.',
    time: '10:27 AM',
  },
  {
    id: '4',
    kind: 'media',
    caption: 'Hey, are you free to look at this real quick?',
    time: '10:28 AM',
  },
];

export default function ChatThreadScreen({ navigation, route }: Props) {
  const { name, handle, avatarKey } = route.params;
  const peerAvatar = PEER_AVATARS[avatarKey];
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.headerIconBtn}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color="#334155" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Image source={peerAvatar} style={styles.headerAvatar} resizeMode="cover" />
            <View style={styles.headerTextCol}>
              <Text style={styles.headerName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.headerMeta} numberOfLines={1}>
                {handle} · <Text style={styles.online}>Online</Text>
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.headerIconBtn}>
              <Ionicons name="videocam-outline" size={22} color="#334155" />
            </Pressable>
            <Pressable style={[styles.headerIconBtn, { marginLeft: 8 }]}>
              <Ionicons name="call-outline" size={20} color="#334155" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dateRow}>
            <View style={styles.dateLine} />
            <Text style={styles.dateLabel}>TODAY</Text>
            <View style={styles.dateLine} />
          </View>

          {DEMO_MESSAGES.map((m) => {
            if (m.kind === 'in') {
              return (
                <View key={m.id} style={styles.inRow}>
                  <Image source={peerAvatar} style={styles.bubbleAvatar} resizeMode="cover" />
                  <View style={styles.inCol}>
                    <View style={styles.inBubble}>
                      <Text style={styles.inText}>{m.text}</Text>
                    </View>
                    <Text style={styles.metaIn}>{m.time}</Text>
                  </View>
                </View>
              );
            }
            if (m.kind === 'out') {
              return (
                <View key={m.id} style={styles.outRow}>
                  <View style={styles.outCol}>
                    <LinearGradient
                      colors={[...OUT_GRADIENT]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.outBubble}
                    >
                      <Text style={styles.outText}>{m.text}</Text>
                    </LinearGradient>
                    <View style={styles.outMetaRow}>
                      <Text style={styles.metaOut}>{m.time}</Text>
                      {m.read ? (
                        <Ionicons
                          name="checkmark-done"
                          size={14}
                          color="#2563eb"
                          style={styles.readIcon}
                        />
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            }
            return (
              <View key={m.id} style={styles.inRow}>
                <Image source={peerAvatar} style={styles.bubbleAvatar} resizeMode="cover" />
                <View style={styles.inCol}>
                  <View style={styles.mediaCard}>
                    <Image
                      source={Images.messages.chatMedia}
                      style={styles.mediaImg}
                      resizeMode="cover"
                    />
                    <View style={styles.mediaCaptionBox}>
                      <Text style={styles.inText}>{m.caption}</Text>
                    </View>
                  </View>
                  <Text style={styles.metaIn}>{m.time}</Text>
                </View>
              </View>
            );
          })}

          <View style={styles.typingRow}>
            <Image source={peerAvatar} style={styles.bubbleAvatar} resizeMode="cover" />
            <View style={styles.typingBubble}>
              <View style={styles.dot} />
              <View style={[styles.dot, styles.dotMid]} />
              <View style={styles.dot} />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.inputWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.quickRow}>
            <Pressable style={styles.quickBtn}>
              <Ionicons name="add" size={22} color="#2563eb" />
            </Pressable>
            <Pressable style={styles.quickBtn}>
              <Ionicons name="image-outline" size={22} color="#2563eb" />
            </Pressable>
            <Pressable style={styles.quickBtn}>
              <Text style={styles.gifLabel}>GIF</Text>
            </Pressable>
            <Pressable style={styles.quickBtn}>
              <Ionicons name="mic-outline" size={22} color="#2563eb" />
            </Pressable>
          </View>
          <View style={styles.composerRow}>
            <View style={styles.inputField}>
              <TextInput
                placeholder="Message..."
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
              <Pressable hitSlop={8}>
                <Ionicons name="happy-outline" size={22} color="#94a3b8" />
              </Pressable>
            </View>
            <Pressable style={styles.sendOuter}>
              <LinearGradient
                colors={[...OUT_GRADIENT]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.sendBtn}
              >
                <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 2 }} />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const AV = 36;
const HEADER_AV = 40;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 0,
  },
  headerAvatar: {
    width: HEADER_AV,
    height: HEADER_AV,
    borderRadius: HEADER_AV / 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerTextCol: {
    marginLeft: 10,
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  online: {
    color: '#2563eb',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dateLabel: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#94a3b8',
  },
  inRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    maxWidth: '92%',
  },
  bubbleAvatar: {
    width: AV,
    height: AV,
    borderRadius: AV / 2,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inCol: {
    maxWidth: '82%',
  },
  inBubble: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inText: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 21,
  },
  metaIn: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 11,
    color: '#94a3b8',
  },
  outRow: {
    alignSelf: 'flex-end',
    marginBottom: 14,
    maxWidth: '88%',
  },
  outCol: {
    alignItems: 'flex-end',
  },
  outBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  outText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 21,
    fontWeight: '500',
  },
  outMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaOut: {
    fontSize: 11,
    color: '#94a3b8',
  },
  readIcon: {
    marginLeft: 4,
  },
  mediaCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    maxWidth: 260,
  },
  mediaImg: {
    width: '100%',
    height: 140,
    backgroundColor: '#e2e8f0',
  },
  mediaCaptionBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  dotMid: {
    marginHorizontal: 5,
  },
  inputWrap: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  quickBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    marginRight: 8,
    paddingVertical: 0,
  },
  sendOuter: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
