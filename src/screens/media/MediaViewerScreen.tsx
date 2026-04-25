import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ResizeMode, Video } from 'expo-av';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MainStackParamList } from '../../navigation/types';
import { inferMediaResourceType } from '../../utils/inferMediaResourceType';

type Props = NativeStackScreenProps<MainStackParamList, 'MediaViewer'>;

type ViewerItem = { url: string; resourceType: 'video' | 'image' };

function normalizeItems(
  raw: { url: string; resourceType: 'image' | 'video' | 'raw' }[] | undefined,
): ViewerItem[] {
  if (!raw?.length) return [];
  const out: ViewerItem[] = [];
  for (const it of raw) {
    const url = String(it?.url || '').trim();
    if (!url || !/^https?:\/\//i.test(url)) continue;
    let resourceType: 'image' | 'video' =
      it.resourceType === 'video' ? 'video' : it.resourceType === 'image' ? 'image' : inferMediaResourceType(url);
    if (it.resourceType === 'raw') {
      resourceType = inferMediaResourceType(url);
    }
    out.push({ url, resourceType });
  }
  return out;
}

export default function MediaViewerScreen({ navigation, route }: Props) {
  const { width: winW, height: winH } = useWindowDimensions();
  const screenW = Math.max(1, winW);
  const screenH = Math.max(1, winH);
  const rawItems = route.params?.items;
  const requestedIndex = route.params?.initialIndex ?? 0;

  const data = useMemo(() => normalizeItems(rawItems), [rawItems]);
  const initialIndex = useMemo(() => {
    if (!data.length) return 0;
    return Math.max(0, Math.min(requestedIndex, data.length - 1));
  }, [data.length, requestedIndex]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx != null) setActiveIndex(idx);
    },
    [],
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!screenW) return;
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / screenW);
      if (idx >= 0 && idx < data.length) setActiveIndex(idx);
    },
    [data.length, screenW],
  );

  const renderItem: ListRenderItem<ViewerItem> = useCallback(
    ({ item, index }) => (
      <View
        style={{
          width: screenW,
          height: screenH,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.resourceType === 'video' ? (
          <Video
            source={{ uri: item.url }}
            style={{ width: screenW, height: screenH }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={activeIndex === index}
            isLooping={false}
          />
        ) : (
          <Image
            source={{ uri: item.url }}
            style={{ width: screenW, height: screenH }}
            resizeMode="contain"
          />
        )}
      </View>
    ),
    [activeIndex, screenH, screenW],
  );

  if (!data.length) {
    return (
      <View className="flex-1 bg-black">
        <SafeAreaView className="absolute left-0 right-0 top-0 z-10" edges={['top']}>
          <View className="flex-row px-4 pt-2">
            <Pressable
              onPress={() => navigation.goBack()}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
            >
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>
        </SafeAreaView>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="image-outline" size={48} color="#64748b" />
          <Text className="mt-4 text-center text-base text-slate-300">
            No media to display (missing or invalid link).
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaView className="absolute left-0 right-0 top-0 z-10" edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pt-2">
          <Pressable
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/40"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          {data.length > 1 ? (
            <Text className="rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-white">
              {activeIndex + 1} / {data.length}
            </Text>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <FlatList
        data={data}
        keyExtractor={(item, index) => `${item.url}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: screenW,
          offset: screenW * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        renderItem={renderItem}
        style={{ flex: 1 }}
        /** Required for `initialScrollIndex` with dynamic length */
        initialNumToRender={Math.min(data.length, 3)}
        windowSize={5}
        removeClippedSubviews={false}
      />
    </View>
  );
}
