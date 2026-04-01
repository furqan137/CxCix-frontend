import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Max sheet height as fraction of screen (0..1).
   * Defaults to 0.86 which matches the hi-fi “half sheet”.
   */
  maxHeightRatio?: number;
};

const BACKDROP = 'rgba(0,0,0,0.35)';

/**
 * Lightweight bottom-sheet modal (no extra deps) — rounded top, drag handle, backdrop.
 */
export function BottomSheetModal({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.86,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 30,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [opacity, translateY, visible]);

  const sheetStyle = useMemo<ViewStyle>(
    () => ({
      maxHeight: `${Math.round(maxHeightRatio * 100)}%`,
      paddingBottom: Math.max(insets.bottom, 12),
    }),
    [insets.bottom, maxHeightRatio],
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ flex: 1 }}>
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: BACKDROP,
              opacity,
            }}
          />
        </Pressable>
        <Animated.View
          style={{
            transform: [{ translateY }],
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            ...sheetStyle,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 16,
          }}
        >
          <View className="items-center pb-2 pt-3">
            <View className="h-1.5 w-12 rounded-full bg-slate-200" />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

