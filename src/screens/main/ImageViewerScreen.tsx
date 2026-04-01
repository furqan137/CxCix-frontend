import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MEDIA_BY_ID } from '../../constants/mediaMap';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'ImageViewer'>;

/**
 * Full-bleed media preview with close — Tap Post mock.
 */
export default function ImageViewerScreen({ navigation, route }: Props) {
  const mediaId = route.params?.mediaId ?? 'dock';
  const source = MEDIA_BY_ID[mediaId] ?? MEDIA_BY_ID.dock;

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="absolute left-0 right-0 top-0 z-10" edges={['top']}>
        <View className="flex-row justify-end px-4 pt-2">
          <Pressable
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
      <View className="flex-1 items-center justify-center px-4">
        <Image
          source={source}
          className="w-full overflow-hidden rounded-3xl"
          style={{ maxHeight: '80%' }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}
