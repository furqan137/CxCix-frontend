import { Ionicons } from '@expo/vector-icons';
import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  Video,
  ResizeMode,
} from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  type ImageSourcePropType,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  apiListConversations,
  type ApiConversation,
  type ConversationParticipant,
} from '../../api/conversations';
import { apiNotifyChatMessage } from '../../api/chatNotify';
import { apiNotifyDailyIncomingCall, apiStartDailyCall } from '../../api/calls';
import { apiSearchGifs, type GiphyGif } from '../../api/giphy';
import { getApiMessage } from '../../api/auth';
import { apiGetUserPublic, type PublicUser } from '../../api/users';
import { Images } from '../../constants/images';
import type { ChatAvatarKey, MainStackParamList } from '../../navigation/types';
import { auth } from '../../config/firebase';
import {
  buildChatId,
  deleteChatMessage,
  getMyChatParticipantId,
  getPeerChatParticipantId,
  isMessageFromMe,
  listenMessages,
  markChatRead,
  removeMessageReaction,
  sendChatMessage,
  setMessageReaction,
  setTypingState,
  startPresence,
  stopPresence,
  subscribeOtherUserTyping,
  subscribePeerReadAt,
  subscribePeerStatus,
  updateChatMessage,
} from '../../services/chatService';
import { getChatMediaUploadErrorMessage, uploadChatMedia } from '../../services/chatUpload';
import { useAuthStore } from '../../store/useAuthStore';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

type Props = NativeStackScreenProps<MainStackParamList, 'ChatThread'>;

const PAGE = '#F8F9FA';
const BUBBLE_THEIRS = '#F1F1F1';
/** Figma: warm gold → soft lavender → periwinkle blue (L → R), same as send control */
const OUT_GRADIENT = ['#FFD36E', '#9A8AFA', '#4A90E2'] as const;
const outGradientProps = {
  colors: [...OUT_GRADIENT],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
} as const;
const GUEST_USER_ID = 'local_guest';

const PEER_AVATARS: Record<ChatAvatarKey, ImageSourcePropType> = {
  annette: Images.mutedAccountAvatar.one,
  alex: Images.messages.listRow1,
  sarah: Images.messages.listRow2,
  wade: Images.avatarWade,
  ralph: Images.messages.listRow3,
  eleanor: Images.messages.listRow4,
  marvin: Images.messages.listRow5,
};

type ChatRowMessage = {
  id: string;
  type: 'text' | 'image' | 'video' | 'gif' | 'audio' | 'file' | 'call';
  text: string;
  callMode?: 'video' | 'audio' | null;
  callStatus?: 'answered' | 'missed' | null;
  senderId: string;
  mediaUrl: string | null;
  thumbnail?: string | null;
  fileName: string | null;
  mimeType: string | null;
  duration?: number | null;
  createdAt: Date | null;
  editedAt?: Date | null;
  seenBy?: string[];
  reactions?: Record<string, string>;
};

function receiptForOutgoing(peerReadAt: number, createdAt: Date | null) {
  const t = createdAt?.getTime() ?? 0;
  if (t <= 0) return { text: '✓', color: '#94a3b8' as const };
  if (peerReadAt <= 0) return { text: '✓', color: '#94a3b8' as const };
  if (peerReadAt < t) return { text: '✓✓', color: '#94a3b8' as const };
  return { text: '✓✓', color: '#2563eb' as const };
}

function formatPeerStatus(online: boolean, lastSeen: number) {
  if (online) return 'Online';
  if (!lastSeen) return '';
  const diff = Date.now() - lastSeen;
  if (diff < 60_000) return 'Last seen just now';
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `Last seen ${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Last seen ${hr}h ago`;
  const d = new Date(lastSeen);
  return `Last seen ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function formatTime(d: Date | null): string {
  if (!d) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatVoiceDur(sec: number | null): string {
  if (sec == null || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ReactionsPill({
  reactions,
  mine,
}: {
  reactions?: Record<string, string>;
  mine: boolean;
}) {
  const values = reactions ? Object.values(reactions).filter(Boolean) : [];
  if (values.length === 0) return null;
  const unique = Array.from(new Set(values)).slice(0, 6);
  return (
    <View style={[styles.reactionsPill, mine && styles.reactionsPillMine]}>
      <Text style={styles.reactionsText}>{unique.join(' ')}</Text>
    </View>
  );
}

function OutgoingMeta({
  peerReadAt,
  time,
  createdAt,
}: {
  peerReadAt: number;
  time: string;
  createdAt: Date | null;
}) {
  const r = receiptForOutgoing(peerReadAt, createdAt);
  return (
    <View style={styles.outMetaRow}>
      <Text style={styles.metaOut}>{time}</Text>
      <Text style={[styles.tickText, { color: r.color }]}>{r.text}</Text>
    </View>
  );
}

export default function ChatThreadScreen({ navigation, route }: Props) {
  const { peerId, peerFirebaseUid, name, handle, avatarUrl, avatarKey } = route.params;
  const peerAvatar =
    avatarUrl && avatarUrl.trim().length > 0
      ? { uri: avatarUrl.trim() }
      : avatarKey
        ? PEER_AVATARS[avatarKey]
        : Images.avatarSplit;
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const currentUserId = useMemo(() => {
    if (!user) {
      return auth.currentUser?.uid?.trim() || GUEST_USER_ID;
    }
    const id = getMyChatParticipantId(user);
    return id || GUEST_USER_ID;
  }, [user]);

  const peerParamUid = peerFirebaseUid && String(peerFirebaseUid).trim();
  const [peerChatId, setPeerChatId] = useState(() => peerParamUid || String(peerId));
  /**
   * Wait until we have the best peer id (Firebase from API) before listening to `messages/`.
   * Otherwise we subscribe to a wrong `buildChatId` and never see the other person's messages.
   */
  const [peerReady, setPeerReady] = useState(() => Boolean(peerParamUid));
  const [peerPublic, setPeerPublic] = useState<PublicUser | null>(null);

  useEffect(() => {
    if (peerParamUid) return;
    let cancelled = false;
    void (async () => {
      try {
        const u = await apiGetUserPublic(String(peerId));
        if (cancelled) return;
        setPeerChatId(getPeerChatParticipantId(u));
        setPeerPublic(u);
      } catch {
        if (!cancelled) setPeerChatId(String(peerId));
      } finally {
        if (!cancelled) setPeerReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [peerId, peerParamUid]);

  useEffect(() => {
    if (!peerParamUid) return;
    let cancelled = false;
    void (async () => {
      try {
        const u = await apiGetUserPublic(String(peerId));
        if (!cancelled) setPeerPublic(u);
      } catch {
        /* keep route params */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [peerId, peerParamUid]);

  const paramUsername = useMemo(() => {
    const h = (handle || '').trim();
    return h.startsWith('@') ? h.slice(1) : h;
  }, [handle]);

  const headerPeerName = useMemo(
    () =>
      peerPublic
        ? formatUserDisplayName({
            fullName: peerPublic.fullName,
            displayName: peerPublic.displayName,
            username: peerPublic.username,
          })
        : formatUserDisplayName({
            displayName: name,
            username: paramUsername || undefined,
          }),
    [peerPublic, name, paramUsername],
  );

  const headerPeerHandle = useMemo(
    () =>
      peerPublic ? formatAtUsername(peerPublic.username) : formatAtUsername(paramUsername || null),
    [peerPublic, paramUsername],
  );

  const chatId = useMemo(() => buildChatId(currentUserId, peerChatId), [currentUserId, peerChatId]);
  const participantIds = useMemo(() => [currentUserId, peerChatId], [currentUserId, peerChatId]);

  const [messages, setMessages] = useState<ChatRowMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [reactionTarget, setReactionTarget] = useState<ChatRowMessage | null>(null);
  const [actionMessage, setActionMessage] = useState<ChatRowMessage | null>(null);
  const [editTarget, setEditTarget] = useState<ChatRowMessage | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<ChatRowMessage | null>(null);
  const [forwardConversations, setForwardConversations] = useState<ApiConversation[]>([]);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifLoading, setGifLoading] = useState(false);
  const [gifResults, setGifResults] = useState<GiphyGif[]>([]);
  const [peerReadAt, setPeerReadAt] = useState(0);
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerLastSeen, setPeerLastSeen] = useState(0);
  const [otherTyping, setOtherTyping] = useState(false);
  const [startingCall, setStartingCall] = useState(false);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listRef = useRef<FlatList<ChatRowMessage>>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordStartedAt = useRef<number>(0);

  useEffect(() => {
    if (!peerReady || !chatId || chatId.includes(GUEST_USER_ID)) return;
    const unsub = listenMessages(chatId, (rows) => {
      setMessages(rows as unknown as ChatRowMessage[]);
    });
    return unsub;
  }, [peerReady, chatId]);

  useFocusEffect(
    useCallback(() => {
      if (!peerReady || !chatId || currentUserId === GUEST_USER_ID) return;
      void markChatRead(chatId, currentUserId);
    }, [peerReady, chatId, currentUserId]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId || currentUserId === GUEST_USER_ID) {
        return () => {};
      }
      startPresence(currentUserId);
      return () => {
        stopPresence();
      };
    }, [currentUserId]),
  );

  useEffect(() => {
    if (!peerReady || !chatId || !peerChatId) {
      return () => {};
    }
    const u1 = subscribePeerReadAt(chatId, peerChatId, (t) => setPeerReadAt(t));
    const u2 = subscribePeerStatus(peerChatId, (v) => {
      if (!v) {
        setPeerOnline(false);
        setPeerLastSeen(0);
        return;
      }
      setPeerOnline(!!v.online);
      setPeerLastSeen(v.lastSeen);
    });
    const u3 = subscribeOtherUserTyping(chatId, currentUserId, (v) => setOtherTyping(v));
    return () => {
      u1();
      u2();
      u3();
    };
  }, [peerReady, chatId, peerChatId, currentUserId]);

  useEffect(() => {
    return () => {
      if (typingStopRef.current) {
        clearTimeout(typingStopRef.current);
        typingStopRef.current = null;
      }
      if (peerReady && chatId && currentUserId !== GUEST_USER_ID) {
        void setTypingState(chatId, currentUserId, false);
      }
    };
  }, [peerReady, chatId, currentUserId]);

  useEffect(() => {
    return () => {
      void recordingRef.current?.stopAndUnloadAsync();
      recordingRef.current = null;
      void soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages.length, scrollToEnd, otherTyping]);

  const clearTyping = useCallback(() => {
    if (typingStopRef.current) {
      clearTimeout(typingStopRef.current);
      typingStopRef.current = null;
    }
    if (peerReady && chatId && currentUserId !== GUEST_USER_ID) {
      void setTypingState(chatId, currentUserId, false);
    }
  }, [peerReady, chatId, currentUserId]);

  const onComposerChange = useCallback(
    (text: string) => {
      setInput(text);
      if (!peerReady || !chatId || currentUserId === GUEST_USER_ID) return;
      void setTypingState(chatId, currentUserId, true);
      if (typingStopRef.current) {
        clearTimeout(typingStopRef.current);
        typingStopRef.current = null;
      }
      typingStopRef.current = setTimeout(() => {
        void setTypingState(chatId, currentUserId, false);
        typingStopRef.current = null;
      }, 2000);
    },
    [peerReady, chatId, currentUserId],
  );

  const sendText = async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      if (!auth.currentUser) {
        Alert.alert('Sign in required', 'Please sign in to send messages.');
        return;
      }
      clearTyping();
      await sendChatMessage(chatId, currentUserId, participantIds, {
        type: 'text',
        text: trimmed,
      });
      void apiNotifyChatMessage(peerId, trimmed, { chatId });
      setInput('');
    } catch (e) {
      console.warn('[ChatThread] sendText', e);
      Alert.alert('Could not send', 'Network error or permission denied.');
    } finally {
      setBusy(false);
    }
  };

  const afterPickSend = async (
    type: 'image' | 'video' | 'gif' | 'audio' | 'file',
    localUri: string,
    mimeType: string | undefined,
      extras: {
      duration?: number | null;
      text?: string;
      thumbnail?: string | null;
      fileName?: string | null;
    },
  ) => {
    setBusy(true);
    try {
      clearTyping();
      if (!auth.currentUser) {
        Alert.alert('Sign in required', 'Please sign in to send messages.');
        return;
      }
      const ext = mimeType?.includes('gif') ? 'gif' : undefined;
      const url = await uploadChatMedia(chatId, localUri, mimeType, ext);
      await sendChatMessage(chatId, currentUserId, participantIds, {
        type,
        text: extras.text ?? '',
        mediaUrl: url,
        thumbnail: extras.thumbnail ?? null,
        duration: extras.duration ?? null,
        fileName: type === 'file' ? (extras.fileName ?? null) : null,
        mimeType: type === 'file' ? (mimeType ?? null) : null,
      });
      const preview =
        type === 'file'
          ? `Sent a file: ${(extras.fileName && String(extras.fileName)) || 'attachment'}`
          : type === 'video'
            ? 'Sent a video'
            : type === 'audio'
              ? 'Sent a voice message'
              : 'Sent a photo';
      void apiNotifyChatMessage(peerId, preview, { chatId });
    } catch (e) {
      console.warn('[ChatThread] media send', e);
      Alert.alert('Upload failed', getChatMediaUploadErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const pickDocumentFile = async () => {
    if (busy) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      await afterPickSend('file', a.uri, a.mimeType || 'application/octet-stream', {
        fileName: a.name,
      });
    } catch (e) {
      console.warn('[ChatThread] document pick', e);
      Alert.alert('File', 'Could not add this file.');
    }
  };

  const showAttachmentOptions = () => {
    if (busy) return;
    Alert.alert('Attachments', 'What would you like to send?', [
      { text: 'Photo or video', onPress: () => void pickImageOrVideo() },
      { text: 'File', onPress: () => void pickDocumentFile() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickImageOrVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Photos', 'Allow photo library access to send pictures.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.6,
      videoMaxDuration: 60,
      base64: false,
      videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const uri = asset.uri;
    const mime = asset.mimeType ?? '';
    const type = asset.type === 'video' ? 'video' : 'image';
    const durationSec =
      typeof asset.duration === 'number' && asset.duration > 0 ? asset.duration / 1000 : null;
    await afterPickSend(type, uri, mime || (type === 'video' ? 'video/mp4' : 'image/jpeg'), {
      duration: type === 'video' ? durationSec : null,
    });
  };
 
  const openGifPicker = () => {
    setGifOpen(true);
    setGifQuery('');
    setGifResults([]);
  };

  const searchGifs = useCallback(async (q: string) => {
    setGifLoading(true);
    try {
      const items = await apiSearchGifs(q.trim());
      setGifResults(items);
    } catch (e) {
      console.warn('[ChatThread] giphy', e);
      Alert.alert('GIFs', 'Could not load GIFs. Check your connection.');
    } finally {
      setGifLoading(false);
    }
  }, []);

  const sendGif = async (gif: GiphyGif) => {
    const url =
      gif.images?.fixed_width?.url ||
      gif.images?.original?.url ||
      gif.images?.fixed_width_small?.url;
    if (!url) return;
    setGifOpen(false);
    setBusy(true);
    try {
      if (!auth.currentUser) {
        Alert.alert('Sign in required', 'Please sign in to send messages.');
        return;
      }
      clearTyping();
      await sendChatMessage(chatId, currentUserId, participantIds, {
        type: 'gif',
        mediaUrl: url,
        text: '',
        duration: null,
      });
      void apiNotifyChatMessage(peerId, 'Sent a GIF', { chatId });
    } catch (e) {
      console.warn('[ChatThread] sendGif', e);
      Alert.alert('Could not send', 'Network error or permission denied.');
    } finally {
      setBusy(false);
    }
  };

  const onMicPressIn = async () => {
    if (busy) return;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Microphone', 'Allow microphone access to send voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = rec;
      recordStartedAt.current = Date.now();
      setRecording(true);
    } catch (e) {
      console.warn('[ChatThread] record start', e);
      Alert.alert('Recording', 'Could not start recording.');
    }
  };

  const onMicPressOut = async () => {
    if (!recordingRef.current) {
      setRecording(false);
      return;
    }
    const rec = recordingRef.current;
    recordingRef.current = null;
    setRecording(false);
    try {
      const elapsed = Date.now() - recordStartedAt.current;
      const statusBefore = await rec.getStatusAsync();
      const durationSec =
        statusBefore.durationMillis > 0
          ? statusBefore.durationMillis / 1000
          : null;
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      });
      const uri = rec.getURI();
      if (!uri || elapsed < 400) return;
      await afterPickSend('audio', uri, 'audio/m4a', { duration: durationSec });
    } catch (e) {
      console.warn('[ChatThread] record stop', e);
    }
  };

  const togglePlayVoice = useCallback(async (msg: ChatRowMessage) => {
    if (!msg.mediaUrl) return;
    if (playingId === msg.id) {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setPlayingId(null);
      return;
    }
    try {
      await soundRef.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(
        { uri: msg.mediaUrl },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setPlayingId(msg.id);
      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.isLoaded && 'didJustFinish' in st && st.didJustFinish) {
          void sound.unloadAsync();
          soundRef.current = null;
          setPlayingId(null);
        }
      });
    } catch (e) {
      console.warn('[ChatThread] play', e);
      Alert.alert('Playback', 'Could not play this voice note.');
    }
  }, [playingId]);

  const openFileUrl = (url: string) => {
    void Linking.openURL(url);
  };

  const canEditType = (type: ChatRowMessage['type']) =>
    type === 'text' || type === 'image' || type === 'video' || type === 'gif' || type === 'file';

  const openMessageActions = useCallback((item: ChatRowMessage) => {
    setActionMessage(item);
  }, []);

  const onMenuReact = useCallback(() => {
    if (!actionMessage) return;
    setReactionTarget(actionMessage);
    setActionMessage(null);
  }, [actionMessage]);

  const onMenuEdit = useCallback(() => {
    if (!actionMessage) return;
    setEditTarget(actionMessage);
    setEditDraft(actionMessage.text || '');
    setActionMessage(null);
  }, [actionMessage]);

  const onMenuDelete = useCallback(() => {
    if (!actionMessage) return;
    const target = actionMessage;
    setActionMessage(null);
    Alert.alert('Delete this message?', 'It will be removed for everyone in this chat.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              if (!auth.currentUser) {
                Alert.alert('Sign in required', 'Please sign in to delete messages.');
                return;
              }
              await deleteChatMessage(chatId, target.id, participantIds);
            } catch (e) {
              console.warn('[ChatThread] delete', e);
              Alert.alert('Could not delete', 'Check your connection and try again.');
            }
          })();
        },
      },
    ]);
  }, [actionMessage, chatId, participantIds]);

  const onMenuForward = useCallback(() => {
    if (!actionMessage) return;
    setForwardingMessage(actionMessage);
    setActionMessage(null);
    setForwardOpen(true);
  }, [actionMessage]);

  const applyEdit = useCallback(async () => {
    if (!editTarget) return;
    if (!isMessageFromMe(editTarget.senderId, user, auth.currentUser?.uid ?? undefined)) return;
    if (!auth.currentUser) {
      Alert.alert('Sign in required', 'Please sign in to edit messages.');
      return;
    }
    setBusy(true);
    try {
      await updateChatMessage(chatId, editTarget.id, participantIds, { text: editDraft.trim() });
      setEditTarget(null);
    } catch (e) {
      console.warn('[ChatThread] edit', e);
      Alert.alert('Edit failed', 'Could not update the message.');
    } finally {
      setBusy(false);
    }
  }, [chatId, user, editDraft, editTarget, participantIds]);

  useEffect(() => {
    if (!forwardOpen) return;
    let cancelled = false;
    setForwardLoading(true);
    void (async () => {
      try {
        const list = await apiListConversations();
        if (!cancelled) setForwardConversations(list);
      } catch (e) {
        console.warn('[ChatThread] forward list', e);
        if (!cancelled) setForwardConversations([]);
      } finally {
        if (!cancelled) setForwardLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forwardOpen]);

  const forwardableConversations = useMemo(() => {
    if (!user?._id) return forwardConversations;
    const me = String(user._id);
    return forwardConversations.filter((conv) => {
      const other = conv.participants.find((p) => String(p._id) !== me);
      if (!other) return false;
      const otherKey = getPeerChatParticipantId(other);
      if (!otherKey) return true;
      return otherKey !== peerChatId;
    });
  }, [forwardConversations, peerChatId, user?._id]);

  const forwardToPeer = useCallback(
    async (other: ConversationParticipant) => {
      if (!forwardingMessage || !auth.currentUser) {
        Alert.alert('Error', 'Could not forward. Sign in and try again.');
        return;
      }
      const targetPeer = getPeerChatParticipantId(other);
      if (!targetPeer) {
        Alert.alert('Forward', 'This contact is not available for direct messages yet.');
        return;
      }
      const m = forwardingMessage;
      setBusy(true);
      try {
        const toCid = buildChatId(currentUserId, targetPeer);
        const toParts = [String(currentUserId), String(targetPeer)];
        if (m.type === 'call') {
          await sendChatMessage(toCid, currentUserId, toParts, {
            type: 'text',
            text: m.text || 'Call',
          });
        } else {
          await sendChatMessage(toCid, currentUserId, toParts, {
            type: m.type,
            text: m.text || '',
            mediaUrl: m.mediaUrl,
            thumbnail: m.thumbnail ?? null,
            fileName: m.fileName,
            mimeType: m.mimeType,
            duration: m.duration ?? null,
          });
        }
        const preview =
          m.type === 'call'
            ? m.text?.slice(0, 60) || 'Call'
            : m.type === 'file'
            ? `Sent: ${m.fileName || 'file'}`
            : m.type === 'image' || m.type === 'gif'
              ? 'Sent a photo'
              : m.type === 'video'
                ? 'Sent a video'
                : m.type === 'audio'
                  ? 'Sent a voice message'
                  : m.text?.slice(0, 60) || 'Forwarded';
        void apiNotifyChatMessage(String(other._id), preview, { chatId: toCid });
        setForwardOpen(false);
        setForwardingMessage(null);
        Alert.alert('Forwarded', 'Message was sent in the other chat.');
      } catch (e) {
        console.warn('[ChatThread] forward', e);
        Alert.alert('Forward failed', 'Check your connection and try again.');
      } finally {
        setBusy(false);
      }
    },
    [currentUserId, forwardingMessage],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatRowMessage }) => {
      const mine = isMessageFromMe(item.senderId, user, auth.currentUser?.uid ?? undefined);
      const time = formatTime(item.createdAt);

      if (item.type === 'call') {
        const isVideo =
          item.callMode === 'video' ||
          (item.text || '').toLowerCase().includes('video');
        const pill = (
          <View style={styles.callLogPill}>
            <Ionicons
              name={isVideo ? 'videocam' : 'call'}
              size={16}
              color="#64748b"
              style={styles.callLogIcon}
            />
            <Text style={styles.callLogLabel} numberOfLines={4}>
              {item.text}
            </Text>
          </View>
        );
        if (mine) {
          return (
            <View style={styles.outRow}>
              <View style={styles.outCol}>
                {pill}
                <OutgoingMeta
                  peerReadAt={peerReadAt}
                  time={time}
                  createdAt={item.createdAt}
                />
              </View>
            </View>
          );
        }
        return (
          <View style={styles.inRow}>
            <Image source={peerAvatar} style={styles.bubbleAvatar} resizeMode="cover" />
            <View style={styles.inCol}>
              {pill}
              <Text style={styles.metaIn}>{time}</Text>
            </View>
          </View>
        );
      }

      if (item.type === 'text' || !item.mediaUrl) {
        if (mine) {
          return (
            <View style={styles.outRow}>
              <View style={styles.outCol}>
                <LinearGradient {...outGradientProps} style={styles.outBubbleGrad}>
                  <Pressable onLongPress={() => openMessageActions(item)} style={styles.outBubblePress}>
                    <Text style={styles.outText}>
                      {item.text}
                      {item.editedAt ? (
                        <Text style={styles.outTextEdited}> (edited)</Text>
                      ) : null}
                    </Text>
                  </Pressable>
                </LinearGradient>
                <ReactionsPill reactions={item.reactions} mine={mine} />
                <OutgoingMeta peerReadAt={peerReadAt} time={time} createdAt={item.createdAt} />
              </View>
            </View>
          );
        }
        return (
          <View style={styles.inRow}>
            <Image source={peerAvatar} style={styles.bubbleAvatar} resizeMode="cover" />
            <View style={styles.inCol}>
              <Pressable style={styles.inBubble} onLongPress={() => openMessageActions(item)}>
                <Text style={styles.inText}>
                  {item.text}
                  {item.editedAt ? <Text style={styles.editedTag}> (edited)</Text> : null}
                </Text>
              </Pressable>
              <ReactionsPill reactions={item.reactions} mine={mine} />
              <Text style={styles.metaIn}>{time}</Text>
            </View>
          </View>
        );
      }

      if (item.type === 'audio' && item.mediaUrl) {
        const dur = formatVoiceDur(item.duration ?? null);
        const bubble = mine ? (
          <LinearGradient {...outGradientProps} style={styles.voiceGradOuter}>
            <Pressable
              onPress={() => togglePlayVoice(item)}
              onLongPress={() => openMessageActions(item)}
              style={styles.voiceGradInner}
            >
              <Ionicons
                name={playingId === item.id ? 'pause' : 'play'}
                size={22}
                color="#fff"
              />
              <Text style={styles.voiceTextOnGrad}>Voice · {dur}</Text>
            </Pressable>
          </LinearGradient>
        ) : (
          <Pressable
            onPress={() => togglePlayVoice(item)}
            style={styles.voiceBubble}
            onLongPress={() => openMessageActions(item)}
          >
            <Ionicons
              name={playingId === item.id ? 'pause' : 'play'}
              size={22}
              color="#2563eb"
            />
            <Text style={styles.voiceText}>Voice · {dur}</Text>
          </Pressable>
        );
        if (mine) {
          return (
            <View style={styles.outRow}>
              <View style={styles.outCol}>
                {bubble}
                <ReactionsPill reactions={item.reactions} mine={mine} />
                <OutgoingMeta peerReadAt={peerReadAt} time={time} createdAt={item.createdAt} />
              </View>
            </View>
          );
        }
        return (
          <View style={styles.inRow}>
            <Image source={peerAvatar} style={styles.bubbleAvatar} resizeMode="cover" />
            <View style={styles.inCol}>
              {bubble}
              <ReactionsPill reactions={item.reactions} mine={mine} />
              <Text style={styles.metaIn}>{time}</Text>
            </View>
          </View>
        );
      }

      if (
        (item.type === 'image' || item.type === 'gif') &&
        item.mediaUrl
      ) {
        const cap = item.text?.trim();
        const hasMediaCaption = Boolean(cap || item.editedAt);
        const mediaBlock = mine ? (
          <Pressable onLongPress={() => openMessageActions(item)}>
            <View style={styles.mediaMineOuter}>
              <LinearGradient
                {...outGradientProps}
                style={
                  hasMediaCaption
                    ? styles.mediaMineImageGradWithCaption
                    : styles.mediaMineImageGradFull
                }
              >
                <Image
                  source={{ uri: item.mediaUrl }}
                  style={styles.mediaImg}
                  resizeMode="cover"
                />
              </LinearGradient>
              {hasMediaCaption ? (
                <View style={styles.mediaCaptionWhite}>
                  <Text style={styles.mediaCaptionText}>
                    {cap}
                    {item.editedAt ? (
                      <Text style={styles.mediaCaptionEdited}> (edited)</Text>
                    ) : null}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ) : (
          <Pressable
            onLongPress={() => openMessageActions(item)}
            style={styles.mediaCard}
          >
            <Image source={{ uri: item.mediaUrl }} style={styles.mediaImg} resizeMode="cover" />
            {hasMediaCaption ? (
              <View style={styles.mediaCaptionWhite}>
                <Text style={styles.mediaCaptionText}>
                  {cap}
                  {item.editedAt ? (
                    <Text style={styles.mediaCaptionEdited}> (edited)</Text>
                  ) : null}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
        if (mine) {
          return (
            <View style={styles.outRow}>
              <View style={styles.outCol}>
                {mediaBlock}
                <ReactionsPill reactions={item.reactions} mine={mine} />
                <OutgoingMeta peerReadAt={peerReadAt} time={time} createdAt={item.createdAt} />
              </View>
            </View>
          );
        }
        return (
          <View style={styles.inRow}>
            <Image source={peerAvatar} style={styles.bubbleAvatar} resizeMode="cover" />
            <View style={styles.inCol}>
              {mediaBlock}
              <ReactionsPill reactions={item.reactions} mine={mine} />
              <Text style={styles.metaIn}>{time}</Text>
            </View>
          </View>
        );
      }

      if (item.type === 'video' && item.mediaUrl) {
        const cap = item.text?.trim();
        const hasMediaCaption = Boolean(cap || item.editedAt);
        const block = mine ? (
          <Pressable onLongPress={() => openMessageActions(item)}>
            {hasMediaCaption ? (
              <View style={styles.mediaMineOuterVideo}>
                <LinearGradient
                  {...outGradientProps}
                  style={styles.mediaVideoGradTopShell}
                >
                  <View style={styles.mediaVideoGradInnerWithCaption}>
                    <Video
                      source={{ uri: item.mediaUrl }}
                      style={styles.mediaVideoInCaptionFrame}
                      resizeMode={ResizeMode.COVER}
                      useNativeControls
                    />
                  </View>
                </LinearGradient>
                <View style={styles.mediaCaptionWhite}>
                  <Text style={styles.mediaCaptionText}>
                    {cap}
                    {item.editedAt ? (
                      <Text style={styles.mediaCaptionEdited}> (edited)</Text>
                    ) : null}
                  </Text>
                </View>
              </View>
            ) : (
              <LinearGradient {...outGradientProps} style={styles.mediaVideoGradShell}>
                <View style={styles.mediaVideoGradInner}>
                  <Video
                    source={{ uri: item.mediaUrl }}
                    style={styles.mediaVideo}
                    resizeMode={ResizeMode.COVER}
                    useNativeControls
                  />
                </View>
              </LinearGradient>
            )}
          </Pressable>
        ) : (
          <Pressable
            onLongPress={() => openMessageActions(item)}
            style={styles.mediaCard}
          >
            <Video
              source={{ uri: item.mediaUrl }}
              style={styles.mediaVideo}
              resizeMode={ResizeMode.COVER}
              useNativeControls
            />
            {hasMediaCaption ? (
              <View style={styles.mediaCaptionWhite}>
                <Text style={styles.mediaCaptionText}>
                  {cap}
                  {item.editedAt ? (
                    <Text style={styles.mediaCaptionEdited}> (edited)</Text>
                  ) : null}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
        if (mine) {
          return (
            <View style={styles.outRow}>
              <View style={styles.outCol}>
                {block}
                <ReactionsPill reactions={item.reactions} mine={mine} />
                <OutgoingMeta peerReadAt={peerReadAt} time={time} createdAt={item.createdAt} />
              </View>
            </View>
          );
        }
        return (
          <View style={styles.inRow}>
            <Image source={peerAvatar} style={styles.bubbleAvatar} resizeMode="cover" />
            <View style={styles.inCol}>
              {block}
              <ReactionsPill reactions={item.reactions} mine={mine} />
              <Text style={styles.metaIn}>{time}</Text>
            </View>
          </View>
        );
      }

      if (item.type === 'file' && item.mediaUrl) {
        const label = item.fileName || 'Attachment';
        const chip = mine ? (
          <LinearGradient {...outGradientProps} style={styles.fileGradOuter}>
            <Pressable
              onPress={() => openFileUrl(item.mediaUrl!)}
              onLongPress={() => openMessageActions(item)}
              style={styles.fileGradInner}
            >
              <Ionicons name="document-attach" size={20} color="#fff" />
              <Text numberOfLines={1} style={styles.fileNameOnGrad}>
                {label}
              </Text>
              <Ionicons name="open-outline" size={16} color="#fff" />
            </Pressable>
          </LinearGradient>
        ) : (
          <Pressable
            onPress={() => openFileUrl(item.mediaUrl!)}
            onLongPress={() => openMessageActions(item)}
            style={styles.fileBubble}
          >
            <Ionicons name="document-attach" size={20} color="#2563eb" />
            <Text numberOfLines={1} style={styles.fileName}>
              {label}
            </Text>
            <Ionicons name="open-outline" size={16} color="#2563eb" />
          </Pressable>
        );
        if (mine) {
          return (
            <View style={styles.outRow}>
              <View style={styles.outCol}>
                {chip}
                <ReactionsPill reactions={item.reactions} mine={mine} />
                <OutgoingMeta peerReadAt={peerReadAt} time={time} createdAt={item.createdAt} />
              </View>
            </View>
          );
        }
        return (
          <View style={styles.inRow}>
            <Image source={peerAvatar} style={styles.bubbleAvatar} resizeMode="cover" />
            <View style={styles.inCol}>
              {chip}
              <ReactionsPill reactions={item.reactions} mine={mine} />
              <Text style={styles.metaIn}>{time}</Text>
            </View>
          </View>
        );
      }

      return null;
    },
    [user, peerReadAt, peerAvatar, openMessageActions, playingId, togglePlayVoice],
  );

  const keyExtractor = useCallback((item: ChatRowMessage) => item.id, []);

  const listHeader = useMemo(
    () => (
      <View style={styles.dateRow}>
        <View style={styles.dateLine} />
        <Text style={styles.dateLabel}>TODAY</Text>
        <View style={styles.dateLine} />
      </View>
    ),
    [],
  );

  /** Daily.co room + server push to callee (FCM/Expo). */
  const startDailyCall = useCallback(
    (callMode: 'video' | 'audio') => {
      if (!currentUserId || currentUserId === GUEST_USER_ID) {
        Alert.alert('Sign in required', 'You need an account to start a call.');
        return;
      }
      if (startingCall) return;
      setStartingCall(true);
      void (async () => {
        try {
          const roomUrl = await apiStartDailyCall();
          if (!roomUrl) {
            Alert.alert('Call unavailable', 'Could not get a call room. Try again later.');
            return;
          }
          const callerName = formatUserDisplayName(
            {
              fullName: user?.fullName,
              displayName: user?.displayName,
              username: user?.username,
              email: user?.email,
            },
            'CxCix',
          );
          const chatId = buildChatId(currentUserId, peerChatId);
          void apiNotifyDailyIncomingCall({
            toUserId: String(peerId),
            roomUrl,
            callMode,
            callerName,
            chatId,
          });
          navigation.navigate('Call', {
            roomUrl,
            callMode,
            displayName: callerName,
            isCaller: true,
          });
        } catch (e) {
          Alert.alert('Call failed', getApiMessage(e));
        } finally {
          setStartingCall(false);
        }
      })();
    },
    [currentUserId, navigation, peerId, peerChatId, startingCall, user],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
                style={styles.headerIconBtn}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={22} color="#334155" />
              </Pressable>
              <View style={styles.headerCenter}>
                <Image source={peerAvatar} style={styles.headerAvatar} resizeMode="cover" />
                <View style={styles.headerTextCol}>
                  <Text style={styles.headerName} numberOfLines={2}>
                    {headerPeerName}
                  </Text>
                  <Text style={styles.headerMeta} numberOfLines={1}>
                    {headerPeerHandle}
                    {peerOnline || peerLastSeen > 0 ? (
                      <>
                        {' · '}
                        <Text style={peerOnline ? styles.online : styles.subtleMeta}>
                          {formatPeerStatus(peerOnline, peerLastSeen)}
                        </Text>
                      </>
                    ) : null}
                  </Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <Pressable
                  style={styles.headerIconBtn}
                  onPress={() => startDailyCall('video')}
                  disabled={startingCall}
                  accessibilityLabel="Video call"
                >
                  {startingCall ? (
                    <ActivityIndicator size="small" color="#334155" />
                  ) : (
                    <Ionicons name="videocam-outline" size={22} color="#334155" />
                  )}
                </Pressable>
                <Pressable
                  style={[styles.headerIconBtn, { marginLeft: 8 }]}
                  onPress={() => startDailyCall('audio')}
                  disabled={startingCall}
                  accessibilityLabel="Voice call"
                >
                  {startingCall ? (
                    <ActivityIndicator size="small" color="#334155" />
                  ) : (
                    <Ionicons name="call-outline" size={20} color="#334155" />
                  )}
                </Pressable>
              </View>
            </View>

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListHeaderComponent={listHeader}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={scrollToEnd}
              showsVerticalScrollIndicator={false}
              extraData={{ peerReadAt, otherTyping, peerOnline, user }}
              keyboardShouldPersistTaps="handled"
            />

            {recording ? (
              <View style={styles.recordingBar}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording… release to send</Text>
              </View>
            ) : null}

            {otherTyping ? (
              <View style={styles.typingBar}>
                <Text style={styles.typingText}>{headerPeerName} is typing…</Text>
              </View>
            ) : null}

            <View style={[styles.inputWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              {busy ? (
                <View style={styles.uploadBar}>
                  <ActivityIndicator color="#6366F1" />
                  <Text style={styles.uploadText}>Sending…</Text>
                </View>
              ) : null}
              <View style={styles.quickRow}>
                <Pressable
                  style={styles.quickBtn}
                  onPress={showAttachmentOptions}
                  disabled={busy}
                >
                  <Ionicons name="add" size={22} color="#2563eb" />
                </Pressable>
                <Pressable style={styles.quickBtn} onPress={pickImageOrVideo} disabled={busy}>
                  <Ionicons name="image-outline" size={22} color="#2563eb" />
                </Pressable>
                <Pressable style={styles.quickBtn} onPress={openGifPicker} disabled={busy}>
                  <Text style={styles.gifLabel}>GIF</Text>
                </Pressable>
                <Pressable
                  style={styles.quickBtn}
                  onPressIn={onMicPressIn}
                  onPressOut={onMicPressOut}
                  disabled={busy}
                >
                  <Ionicons name="mic-outline" size={22} color="#2563eb" />
                </Pressable>
              </View>
              <View style={styles.composerRow}>
                <View style={styles.inputField}>
                  <TextInput
                    placeholder="Message..."
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                    value={input}
                    onChangeText={onComposerChange}
                    multiline
                    maxLength={4000}
                    editable={!busy}
                  />
                  <Pressable hitSlop={8}>
                    <Ionicons name="happy-outline" size={22} color="#94a3b8" />
                  </Pressable>
                </View>
                <Pressable style={styles.sendOuter} onPress={sendText} disabled={busy || !input.trim()}>
                  <LinearGradient {...outGradientProps} style={styles.sendBtn}>
                    {busy ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 2 }} />
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Long-press: message actions */}
      <Modal
        visible={actionMessage != null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionMessage(null)}
      >
        <View style={styles.messageActionBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setActionMessage(null)}
          />
          <View style={[styles.messageActionCard, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Text style={styles.messageActionTitle}>Message</Text>
            {currentUserId === GUEST_USER_ID || !auth.currentUser ? (
              <Text style={styles.messageActionHint}>
                Sign in to react, forward, edit, or delete messages.
              </Text>
            ) : null}
            {currentUserId !== GUEST_USER_ID && auth.currentUser ? (
              <Pressable style={styles.messageActionRow} onPress={onMenuReact}>
                <Ionicons name="happy-outline" size={22} color="#0f172a" />
                <Text style={styles.messageActionLabel}>Add reaction</Text>
              </Pressable>
            ) : null}
            {actionMessage &&
            isMessageFromMe(actionMessage.senderId, user, auth.currentUser?.uid ?? undefined) &&
            currentUserId !== GUEST_USER_ID &&
            canEditType(actionMessage.type) ? (
              <Pressable style={styles.messageActionRow} onPress={onMenuEdit}>
                <Ionicons name="create-outline" size={22} color="#0f172a" />
                <Text style={styles.messageActionLabel}>
                  {actionMessage.type === 'text' ? 'Edit message' : 'Edit caption'}
                </Text>
              </Pressable>
            ) : null}
            {actionMessage &&
            isMessageFromMe(actionMessage.senderId, user, auth.currentUser?.uid ?? undefined) &&
            currentUserId !== GUEST_USER_ID ? (
              <Pressable style={styles.messageActionRow} onPress={onMenuDelete}>
                <Ionicons name="trash-outline" size={22} color="#b91c1c" />
                <Text style={[styles.messageActionLabel, { color: '#b91c1c' }]}>Delete</Text>
              </Pressable>
            ) : null}
            {currentUserId !== GUEST_USER_ID && auth.currentUser ? (
              <Pressable style={styles.messageActionRow} onPress={onMenuForward}>
                <Ionicons name="arrow-redo-outline" size={22} color="#0f172a" />
                <Text style={styles.messageActionLabel}>Forward</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.messageActionRow, styles.messageActionCancelRow]}
              onPress={() => setActionMessage(null)}
            >
              <Text style={styles.messageActionCancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Edit message / caption */}
      <Modal
        visible={editTarget != null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditTarget(null)}
      >
        <View style={styles.editModalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditTarget(null)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.editModalKb}
          >
            <View
              style={[styles.editModalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}
            >
              <Text style={styles.editModalTitle}>
                {editTarget && editTarget.type === 'text' ? 'Edit message' : 'Edit caption'}
              </Text>
              <TextInput
                value={editDraft}
                onChangeText={setEditDraft}
                placeholder="Message"
                placeholderTextColor="#94a3b8"
                style={styles.editModalInput}
                multiline
                maxLength={4000}
              />
              <View style={styles.editModalActions}>
                <Pressable
                  onPress={() => setEditTarget(null)}
                  style={styles.editModalBtn}
                >
                  <Text style={styles.editModalBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void applyEdit()}
                  style={[styles.editModalBtn, styles.editModalSave]}
                >
                  <Text style={[styles.editModalBtnText, styles.editModalSaveText]}>Save</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Forward to another chat */}
      <Modal
        visible={forwardOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setForwardOpen(false);
          setForwardingMessage(null);
        }}
      >
        <View style={styles.forwardModalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setForwardOpen(false);
              setForwardingMessage(null);
            }}
          />
          <View
            style={[styles.forwardModalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}
          >
            <View style={styles.forwardModalHeader}>
              <Text style={styles.forwardModalTitle}>Forward to</Text>
              <Pressable
                onPress={() => {
                  setForwardOpen(false);
                  setForwardingMessage(null);
                }}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color="#0f172a" />
              </Pressable>
            </View>
            {forwardLoading ? (
              <View style={styles.forwardLoading}>
                <ActivityIndicator color="#6366F1" />
              </View>
            ) : forwardableConversations.length === 0 ? (
              <Text style={styles.forwardEmpty}>
                {user?._id
                  ? 'No other conversations yet. Open Messages and start a chat to forward there.'
                  : 'Sign in to see conversations.'}
              </Text>
            ) : (
              <ScrollView style={styles.forwardList} keyboardShouldPersistTaps="handled">
                {forwardableConversations.map((conv) => {
                  const me = String(user?._id ?? '');
                  const other = conv.participants.find((p) => String(p._id) !== me);
                  if (!other) return null;
                  const label = formatUserDisplayName({
                    fullName: other.fullName,
                    displayName: other.displayName,
                    username: other.username,
                  });
                  return (
                    <Pressable
                      key={conv._id}
                      style={styles.forwardRow}
                      onPress={() => void forwardToPeer(other)}
                    >
                      <Ionicons name="person-circle-outline" size={28} color="#64748b" />
                      <View style={styles.forwardRowText}>
                        <Text style={styles.forwardRowName} numberOfLines={1}>
                          {label}
                        </Text>
                        {other.username ? (
                          <Text style={styles.forwardRowSub} numberOfLines={1}>
                            {formatAtUsername(other.username)}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Reaction picker */}
      <Modal
        visible={reactionTarget != null}
        transparent
        animationType="fade"
        onRequestClose={() => setReactionTarget(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setReactionTarget(null)}>
          <View style={styles.reactionSheet}>
            {['❤️', '😂', '😮', '😢', '👍', '👎'].map((e) => {
              const mine = reactionTarget?.reactions?.[String(currentUserId)];
              const isSelected = mine === e;
              return (
                <Pressable
                  key={e}
                  style={[styles.reactionChip, isSelected && styles.reactionChipSelected]}
                  onPress={async () => {
                    if (!reactionTarget) return;
                    const myEmoji = reactionTarget.reactions?.[String(currentUserId)];
                    try {
                      if (myEmoji === e) {
                        await removeMessageReaction(chatId, reactionTarget.id, currentUserId);
                      } else {
                        await setMessageReaction(chatId, reactionTarget.id, currentUserId, e);
                      }
                    } catch {
                      Alert.alert('Reaction', 'Could not update reaction. Check your connection.');
                    } finally {
                      setReactionTarget(null);
                    }
                  }}
                >
                  <Text style={styles.reactionEmoji}>{e}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* GIF Picker */}
      <Modal visible={gifOpen} animationType="slide" onRequestClose={() => setGifOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.gifHeader}>
            <Pressable onPress={() => setGifOpen(false)} style={styles.gifCloseBtn}>
              <Ionicons name="close" size={22} color="#0f172a" />
            </Pressable>
            <Text style={styles.gifTitle}>GIFs</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.gifSearchRow}>
            <Ionicons name="search" size={18} color="#64748b" />
            <TextInput
              value={gifQuery}
              onChangeText={setGifQuery}
              placeholder="Search GIFs..."
              placeholderTextColor="#94a3b8"
              style={styles.gifSearchInput}
              returnKeyType="search"
              onSubmitEditing={() => void searchGifs(gifQuery)}
            />
            <Pressable onPress={() => void searchGifs(gifQuery)} style={styles.gifSearchBtn}>
              <Text style={styles.gifSearchBtnText}>Search</Text>
            </Pressable>
          </View>
          {gifLoading ? (
            <View style={{ paddingTop: 18 }}>
              <ActivityIndicator color="#6366F1" />
            </View>
          ) : (
            <FlatList
              data={gifResults}
              keyExtractor={(it) => it.id}
              numColumns={3}
              contentContainerStyle={styles.gifGrid}
              renderItem={({ item }) => {
                const thumb = item.images?.fixed_width_small?.url || item.images?.fixed_width?.url;
                if (!thumb) return null;
                return (
                  <Pressable style={styles.gifCell} onPress={() => void sendGif(item)}>
                    <Image source={{ uri: thumb }} style={styles.gifImg} resizeMode="cover" />
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.gifEmpty}>
                  {gifQuery.trim().length === 0 ? 'Search for a GIF' : 'No GIFs found'}
                </Text>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
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
    alignSelf: 'flex-start',
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
    backgroundColor: BUBBLE_THEIRS,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  outBubbleGrad: {
    borderRadius: 20,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  outBubblePress: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  outText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
    fontWeight: '500',
  },
  outTextEdited: {
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.82)',
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
  tickText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  typingBar: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  typingText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  subtleMeta: {
    color: '#64748b',
    fontWeight: '500',
  },
  callLogPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8EEF4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: 280,
  },
  callLogIcon: {
    marginTop: 1,
  },
  callLogLabel: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 20,
  },
  mediaCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    maxWidth: 260,
  },
  /** Image/video + caption: gradient only on media; caption is Figma white / dark text */
  mediaMineOuter: {
    maxWidth: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  mediaMineOuterVideo: {
    maxWidth: 264,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  mediaMineImageGradFull: {
    borderRadius: 16,
    overflow: 'hidden',
    maxWidth: 260,
  },
  mediaMineImageGradWithCaption: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    maxWidth: 260,
  },
  mediaCaptionWhite: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    width: '100%',
    alignSelf: 'stretch',
  },
  mediaCaptionText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#0f172a',
  },
  mediaCaptionEdited: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#64748b',
  },
  mediaImg: {
    width: 260,
    height: 160,
    backgroundColor: '#e2e8f0',
  },
  mediaVideo: {
    width: 260,
    height: 180,
    backgroundColor: '#0f172a',
  },
  mediaVideoInCaptionFrame: {
    width: 256,
    height: 180,
    backgroundColor: '#0f172a',
  },
  mediaVideoGradShell: {
    borderRadius: 18,
    padding: 2,
    maxWidth: 264,
  },
  mediaVideoGradTopShell: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 2,
    paddingBottom: 2,
    maxWidth: 264,
  },
  mediaVideoGradInner: {
    borderRadius: 14,
    overflow: 'hidden',
    width: 260,
  },
  mediaVideoGradInnerWithCaption: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    width: 256,
  },
  voiceBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 160,
  },
  voiceGradOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 160,
    maxWidth: 280,
  },
  voiceGradInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  voiceText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
  },
  voiceTextOnGrad: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fileBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxWidth: 260,
  },
  fileGradOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    maxWidth: 260,
  },
  fileGradInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  fileNameOnGrad: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b91c1c',
  },
  uploadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 13,
    color: '#64748b',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  messageActionBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  messageActionCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 8,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  messageActionHint: {
    fontSize: 14,
    color: '#64748b',
    paddingHorizontal: 12,
    paddingBottom: 10,
    lineHeight: 20,
  },
  messageActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  messageActionLabel: {
    fontSize: 17,
    color: '#0f172a',
    fontWeight: '500',
  },
  messageActionCancelRow: {
    marginTop: 4,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  messageActionCancel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2563eb',
  },
  editedTag: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.75,
  },
  editModalRoot: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  editModalKb: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  editModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  editModalInput: {
    minHeight: 100,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  editModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  editModalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  editModalSave: {
    backgroundColor: '#4f46e5',
  },
  editModalSaveText: {
    color: '#fff',
  },
  forwardModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  forwardModalCard: {
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  forwardModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  forwardModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  forwardLoading: {
    padding: 32,
    alignItems: 'center',
  },
  forwardEmpty: {
    padding: 24,
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  forwardList: {
    maxHeight: 400,
  },
  forwardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  forwardRowText: {
    flex: 1,
  },
  forwardRowName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  forwardRowSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  reactionSheet: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reactionChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionChipSelected: {
    backgroundColor: '#E0E7FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  reactionEmoji: { fontSize: 20 },
  reactionsPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reactionsPillMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#F5F3FF',
    borderColor: '#ddd6fe',
  },
  reactionsText: { fontSize: 13 },
  gifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  gifCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  gifSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  gifSearchInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    color: '#0f172a',
  },
  gifSearchBtn: {
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifSearchBtnText: { color: '#fff', fontWeight: '800' },
  gifGrid: { paddingHorizontal: 10, paddingBottom: 20 },
  gifCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 4,
  },
  gifImg: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  gifEmpty: {
    paddingTop: 18,
    paddingHorizontal: 12,
    color: '#64748b',
    textAlign: 'center',
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
    maxHeight: 100,
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
