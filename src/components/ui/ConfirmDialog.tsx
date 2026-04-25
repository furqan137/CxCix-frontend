import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, Text, View } from 'react-native';

import { BRAND_GRADIENT } from '../../constants/brand';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  primaryLabel: string;
  onPrimary: () => void | Promise<void>;
  /** Disable primary action (e.g. while a request is in flight). */
  primaryDisabled?: boolean;
  icon?: React.ReactNode;
  /** Optional content area (e.g. “They will be able to…”) */
  children?: React.ReactNode;
};

/**
 * Centered confirmation dialog — matches Unblock/Delete hi-fi modals.
 */
export function ConfirmDialog({
  visible,
  onClose,
  title,
  message,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  icon,
  children,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View
          className="w-full max-w-[360px] rounded-3xl bg-white px-6 pb-5 pt-6"
          style={{
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.18,
            shadowRadius: 20,
            elevation: 18,
          }}
        >
          <View className="items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              {icon}
            </View>
            <Text className="mt-4 text-xl font-extrabold text-slate-900">{title}</Text>
            {message ? (
              <Text className="mt-2 text-center text-sm text-slate-500">{message}</Text>
            ) : null}
          </View>

          {children ? <View className="mt-4">{children}</View> : null}

          <Pressable
            onPress={() => void onPrimary()}
            disabled={primaryDisabled}
            className="mt-5 overflow-hidden rounded-full"
            style={{ opacity: primaryDisabled ? 0.55 : 1 }}
          >
            <LinearGradient
              colors={[...BRAND_GRADIENT]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ paddingVertical: 16, alignItems: 'center' }}
            >
              <Text className="text-base font-bold text-white">{primaryLabel}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={onClose} className="mt-3 items-center py-2">
            <Text className="text-base font-semibold text-slate-400">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

