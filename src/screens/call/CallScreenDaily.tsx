import { Ionicons } from '@expo/vector-icons';
import { DailyMediaView } from '@daily-co/react-native-daily-js';
import type { DailyParticipant } from '@daily-co/react-native-daily-js';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import type { MainStackParamList } from '../../navigation/types';
import { createCallObject, destroyCallObject, getCallObject, requestCallPermissions } from '../../services/callService';

type Props = NativeStackScreenProps<MainStackParamList, 'Call'>;

function pickParticipants(map: Record<string, DailyParticipant>) {
  const list = Object.values(map);
  const local = list.find((p) => p.local) || null;
  const remote = list.find((p) => !p.local) || null;
  return { local, remote };
}

function getPlayableVideoTrack(p: DailyParticipant | null) {
  if (!p) return null;
  const t = p.tracks?.video;
  if (t?.state === 'playable' && t.track) return t.track;
  const vt = p.videoTrack;
  if (vt && typeof vt !== 'boolean') return vt;
  return null;
}

function getPlayableAudioTrack(p: DailyParticipant | null) {
  if (!p) return null;
  const t = p.tracks?.audio;
  if (t?.state === 'playable' && t.track) return t.track;
  const at = p.audioTrack;
  if (at && typeof at !== 'boolean') return at;
  return null;
}

function formatCallDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Real Daily call UI & logic — only loaded when `WebRTCModule` exists (dev / release build, not Expo Go).
 */
export default function CallScreenDaily({ navigation, route }: Props) {
  const { roomUrl, callMode, displayName, isCaller } = route.params;
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [map, setMap] = useState<Record<string, DailyParticipant>>({});
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(callMode === 'audio');
  const [secs, setSecs] = useState(0);
  const [inCall, setInCall] = useState(false);

  const { local, remote } = useMemo(() => pickParticipants(map), [map]);

  const refresh = useCallback(() => {
    const c = getCallObject();
    if (c) setMap({ ...c.participants() });
  }, []);

  useEffect(() => {
    if (!inCall) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [inCall]);

  useEffect(() => {
    let gone = false;
    setError(null);
    setConnecting(true);

    void (async () => {
      const ok = await requestCallPermissions();
      if (gone) return;
      if (!ok) {
        setError('Camera and microphone access are required for calls.');
        setConnecting(false);
        return;
      }

      const call = createCallObject();

      const onUpdate = () => {
        if (gone) return;
        refresh();
      };

      call.on('participant-joined', onUpdate);
      call.on('participant-updated', onUpdate);
      call.on('participant-left', onUpdate);
      call.on('joined-meeting', () => {
        if (gone) return;
        if (callMode === 'audio') {
          call.setLocalVideo(false);
        }
        setConnecting(false);
        setInCall(true);
        refresh();
      });
      call.on('left-meeting', () => {
        if (gone) return;
        setInCall(false);
        destroyCallObject();
        navigation.goBack();
      });
      call.on('error', (e) => {
        if (gone) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = (e as any)?.errorMsg || (e as any)?.message || 'Call error';
        setError(String(msg));
        setConnecting(false);
      });

      try {
        await call.join({ url: roomUrl });
        if (gone) return;
        refresh();
      } catch (e) {
        if (gone) return;
        setError(getApiMessage(e) || 'Could not join the call');
        setConnecting(false);
        destroyCallObject();
      }
    })();

    return () => {
      gone = true;
      const c = getCallObject();
      void c
        ?.leave()
        .catch(() => {})
        .finally(() => destroyCallObject());
    };
  }, [callMode, navigation, refresh, roomUrl]);

  const toggleMute = useCallback(() => {
    const c = getCallObject();
    if (!c) return;
    const next = !muted;
    c.setLocalAudio(!next);
    setMuted(next);
  }, [muted]);

  const toggleVideo = useCallback(() => {
    if (callMode === 'audio') return;
    const c = getCallObject();
    if (!c) return;
    const next = !videoOff;
    c.setLocalVideo(!next);
    setVideoOff(next);
  }, [callMode, videoOff]);

  const end = useCallback(() => {
    const c = getCallObject();
    void c
      ?.leave()
      .catch(() => {})
      .finally(() => {
        destroyCallObject();
        navigation.goBack();
      });
  }, [navigation]);

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.peerLabel} numberOfLines={1}>
          {displayName || (isCaller ? 'Calling…' : 'In call')}
        </Text>
        <Text style={styles.timer}>{inCall ? formatCallDuration(secs) : ' '}</Text>
      </View>

      <View style={styles.stage}>
        {remote ? (
          <DailyMediaView
            style={styles.full}
            videoTrack={getPlayableVideoTrack(remote)}
            audioTrack={getPlayableAudioTrack(remote)}
            mirror={false}
            zOrder={0}
            objectFit="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="person" size={72} color="#64748b" />
            <Text style={styles.placeholderText}>{displayName || 'Participant'}</Text>
          </View>
        )}

        {local && callMode === 'video' && !videoOff ? (
          <View style={styles.pip}>
            <DailyMediaView
              style={styles.pipInner}
              videoTrack={getPlayableVideoTrack(local)}
              audioTrack={getPlayableAudioTrack(local)}
              mirror
              zOrder={1}
              objectFit="cover"
            />
          </View>
        ) : null}
      </View>

      {connecting ? (
        <View style={styles.overlayCenter}>
          <ActivityIndicator size="large" color="#e2e8f0" />
          <Text style={styles.mutedText}>Connecting…</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errBox}>
          <Text style={styles.errText}>{error}</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.hangSm}>
            <Text style={styles.hangSmText}>Close</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable
          onPress={toggleMute}
          style={[styles.roundBtn, muted && styles.roundOff]}
          accessibilityLabel={muted ? 'Unmute' : 'Mute'}
        >
          <Ionicons name={muted ? 'mic-off' : 'mic'} size={26} color="#fff" />
        </Pressable>
        {callMode === 'video' ? (
          <Pressable
            onPress={toggleVideo}
            style={[styles.roundBtn, videoOff && styles.roundOff]}
            accessibilityLabel={videoOff ? 'Camera on' : 'Camera off'}
          >
            <Ionicons name={videoOff ? 'videocam-off' : 'videocam'} size={26} color="#fff" />
          </Pressable>
        ) : null}
        <Pressable onPress={end} style={styles.hang} accessibilityLabel="End call">
          <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020617' },
  topBar: { paddingHorizontal: 16, paddingBottom: 8, alignItems: 'center' },
  peerLabel: { color: '#f1f5f9', fontSize: 18, fontWeight: '600' },
  timer: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  stage: { flex: 1, position: 'relative' },
  full: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0f172a' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#94a3b8', marginTop: 12, fontSize: 18 },
  pip: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 110,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  pipInner: { flex: 1 },
  overlayCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  mutedText: { color: '#e2e8f0', marginTop: 12 },
  errBox: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 160,
    backgroundColor: 'rgba(15,23,42,0.95)',
    padding: 12,
    borderRadius: 12,
  },
  errText: { color: '#fecaca' },
  hangSm: { marginTop: 8, alignSelf: 'flex-end' },
  hangSmText: { color: '#93c5fd' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingTop: 12,
  },
  roundBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundOff: { backgroundColor: '#7f1d1d' },
  hang: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
