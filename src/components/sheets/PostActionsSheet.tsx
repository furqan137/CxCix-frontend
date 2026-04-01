import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import { BRAND_GRADIENT } from '../../constants/brand';
import { BottomSheetModal } from '../ui/BottomSheetModal';

type Props = {
  visible: boolean;
  onClose: () => void;
  variant: 'own' | 'other';
  onReport: () => void;
  onDelete?: () => void;
};

function Row({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center py-3">
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
        <Ionicons name={icon} size={20} color={danger ? '#ef4444' : '#2563eb'} />
      </View>
      <Text className={`ml-3 text-[15px] ${danger ? 'font-semibold text-red-500' : 'text-slate-700'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * More Options (post actions) — matches both hi-fi bottom sheets.
 */
export function PostActionsSheet({ visible, onClose, variant, onReport, onDelete }: Props) {
  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightRatio={0.74}>
      <View className="px-5 pb-3">
        <Text className="mt-2 text-base font-bold text-slate-900">Post Action</Text>

        <View className="mt-3 border-b border-slate-200 pb-3">
          {variant === 'own' ? (
            <>
              <Row icon="pin-outline" label="Pin to profile" />
              <Row icon="bar-chart-outline" label="View post insights" />
              <Row icon="create-outline" label="Edit post" />
              <Row icon="share-social-outline" label="Share" />
              <Row icon="link-outline" label="Copy link" />
            </>
          ) : (
            <>
              <Row icon="share-social-outline" label="Share" />
              <Row icon="link-outline" label="Copy link" />
              <Row icon="eye-off-outline" label="Don't want to see this post" />
            </>
          )}
        </View>

        {variant === 'other' ? (
          <>
            <Text className="mt-4 text-base font-bold text-slate-900">Conversation Controls</Text>
            <View className="mt-2 border-b border-slate-200 pb-3">
              <Row icon="eye-off-outline" label="Hide this post" />
              <Row icon="volume-mute-outline" label="Mute @username" />
              <Row icon="ban-outline" label="Block @username" />
            </View>

            <Text className="mt-4 text-base font-bold text-slate-900">Safety</Text>
            <View className="mt-2">
              <Row icon="warning-outline" label="Report..." danger onPress={onReport} />
            </View>
          </>
        ) : (
          <View className="mt-3">
            <Row icon="trash-outline" label="Delete post" danger onPress={onDelete} />
          </View>
        )}

        <Pressable onPress={onClose} className="mt-5 overflow-hidden rounded-full">
          <LinearGradient
            colors={[...BRAND_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ paddingVertical: 16, alignItems: 'center' }}
          >
            <Text className="text-base font-bold text-white">Cancel</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

