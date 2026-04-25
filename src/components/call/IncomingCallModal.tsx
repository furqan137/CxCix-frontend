import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  callerName: string;
  callMode: 'video' | 'audio';
  onAccept: () => void;
  onReject: () => void;
};

/**
 * Full-screen incoming call surface (used inside a dedicated screen; also suitable as a root Modal).
 */
export function IncomingCallModal({
  visible,
  callerName,
  callMode,
  onAccept,
  onReject,
}: Props) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) {
      Vibration.cancel();
      return;
    }
    Vibration.vibrate([0, 500, 400, 500], true);
    return () => {
      Vibration.cancel();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={[styles.backdrop, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <Ionicons
            name={callMode === 'video' ? 'videocam' : 'call'}
            size={48}
            color="#e2e8f0"
          />
        </View>
        <Text style={styles.sub}>Incoming {callMode === 'video' ? 'video' : 'voice'} call</Text>
        <Text style={styles.name} numberOfLines={2}>
          {callerName}
        </Text>
        <View style={styles.row}>
          <Pressable
            onPress={onReject}
            style={({ pressed }) => [styles.btn, styles.btnReject, pressed && { opacity: 0.9 }]}
            accessibilityLabel="Decline call"
          >
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </Pressable>
          <Pressable
            onPress={onAccept}
            style={({ pressed }) => [styles.btn, styles.btnAccept, pressed && { opacity: 0.9 }]}
            accessibilityLabel="Accept call"
          >
            <Ionicons name="call" size={28} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** When you need a true RN `Modal` wrapper (e.g. overlaying tabs). */
export function IncomingCallModalInModal(props: Props & { transparent?: boolean }) {
  const { transparent = true, ...rest } = props;
  return (
    <Modal
      visible={rest.visible}
      animationType="slide"
      transparent={transparent}
      onRequestClose={rest.onReject}
    >
      {rest.visible ? <IncomingCallModal {...rest} /> : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
  },
  content: { alignItems: 'center', paddingHorizontal: 24 },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sub: { color: '#94a3b8', fontSize: 15, marginBottom: 6 },
  name: { color: '#f8fafc', fontSize: 26, fontWeight: '600', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    marginTop: 48,
  },
  btn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnReject: { backgroundColor: '#ef4444' },
  btnAccept: { backgroundColor: '#22c55e' },
});
