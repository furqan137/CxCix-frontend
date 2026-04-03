import { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<MainStackParamList, 'ReadComment'>;

const PAGE_BG = '#F2F4F7';

type CategoryRow = {
  id: string;
  title: string;
  count: number;
  kind: 'image' | 'tools' | 'flash';
  source?: ImageSourcePropType;
};

const CATEGORIES: CategoryRow[] = [
  { id: 'support', title: 'Support', count: 10, kind: 'image', source: Images.readComment.categorySupport },
  {
    id: 'counterpoint',
    title: 'Counterpoint',
    count: 3,
    kind: 'image',
    source: Images.readComment.categoryCounterpoint,
  },
  { id: 'question', title: 'Question', count: 8, kind: 'image', source: Images.readComment.categoryQuestion },
  { id: 'build', title: 'Build', count: 20, kind: 'tools' },
  { id: 'reflect', title: 'Reflect', count: 8, kind: 'image', source: Images.readComment.categoryReflect },
  { id: 'vawulence', title: 'Vawulence', count: 40, kind: 'flash' },
];

function CategoryIcon({ row }: { row: CategoryRow }) {
  const wrap = 'h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#F2F4F7] border border-slate-200/90' as const;

  if (row.kind === 'image' && row.source) {
    return (
      <Image
        source={row.source}
        style={{ width: 44, height: 44 }}
        resizeMode="contain"
      />
    );
  }
  if (row.kind === 'tools') {
    return (
      <View className={wrap}>
        <Image
          source={Images.readComment.iconTools}
          style={{ width: 26, height: 26 }}
          resizeMode="contain"
        />
      </View>
    );
  }
  return (
    <View className={wrap}>
      <Ionicons name="flash-outline" size={20} color="#3B82F6" />
    </View>
  );
}

/**
 * Read Comment — main post + structured accordions (Figma-aligned).
 */
export default function ReadCommentScreen({ navigation, route }: Props) {
  const variant = route.params?.variant ?? 'standard';
  const [openId, setOpenId] = useState<string | null>('support');

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE_BG }} edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-slate-200/80 bg-white px-3 py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <View className="items-center">
          <Text className="text-lg font-bold text-slate-900">Read Comment</Text>
          {variant === 'shifted' ? (
            <Text className="mt-0.5 text-xs font-semibold text-sky-700">Shifted post</Text>
          ) : null}
        </View>
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Original post */}
        <View
          className="rounded-3xl bg-white p-4"
          style={{
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 flex-row">
              <Image
                source={Images.readComment.avatarPost}
                className="h-12 w-12 rounded-full"
                resizeMode="cover"
                accessibilityLabel="Annette Black"
              />
              <View className="ml-3 flex-1">
                <Text className="text-[16px] font-bold text-slate-900">Annette Black</Text>
                <Text className="mt-0.5 text-sm text-slate-500">
                  <Text className="text-slate-400">2h</Text>
                  {' · '}
                  <Text>@elenadesign</Text>
                </Text>
              </View>
            </View>
            <Pressable hitSlop={8} accessibilityLabel="Bookmark">
              <Ionicons name="bookmark-outline" size={22} color="#64748b" />
            </Pressable>
          </View>

          <Text className="mt-4 text-[15px] leading-6 text-slate-800">
            Everyone has different animal preferences. It&apos;s important to respect the choices people make about their
            pets and companions — calm isn&apos;t one-size-fits-all.
          </Text>

          <Image
            source={Images.mediaCat}
            className="mt-4 w-full overflow-hidden rounded-2xl"
            style={{ height: 200 }}
            resizeMode="cover"
          />

          <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
            <View className="flex-row items-center">
              <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
              <Text className="ml-1 text-sm text-slate-600">7.50k</Text>
            </View>
            <View className="flex-row items-center">
              <Image
                source={Images.readComment.iconHeartMark}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
              <Text className="ml-1 text-sm text-slate-600">24.4k</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="sync" size={18} color="#64748b" />
              <Text className="ml-1 text-sm font-semibold text-slate-700">Shift</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="eye-outline" size={18} color="#64748b" />
              <Text className="ml-1 text-sm text-slate-600">900K</Text>
            </View>
            <Pressable hitSlop={8} className="ml-auto">
              <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
            </Pressable>
          </View>
        </View>

        {/* Accordion categories */}
        <View className="mt-5">
          {CATEGORIES.map((row) => {
            const expanded = openId === row.id;
            return (
              <View
                key={row.id}
                className="mb-2 overflow-hidden rounded-2xl bg-white"
                style={{
                  shadowColor: '#0f172a',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 1,
                }}
              >
                <Pressable
                  onPress={() => toggle(row.id)}
                  className="flex-row items-center justify-between px-4 py-3.5"
              >
                  <View className="flex-row items-center">
                    <CategoryIcon row={row} />
                    <Text className="ml-3 text-base font-semibold text-slate-900">
                      {row.title} ({row.count})
                    </Text>
                  </View>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#94a3b8"
                  />
                </Pressable>

                {expanded && row.id === 'support' ? (
                  <View className="border-t border-slate-100 bg-slate-50/90 px-4 pb-4 pt-2">
                    <View
                      className="rounded-2xl border border-slate-200/80 bg-white p-3"
                      style={{
                        shadowColor: '#0f172a',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 flex-row">
                          <Image
                            source={Images.readComment.avatarComment}
                            className="h-10 w-10 rounded-full"
                            resizeMode="cover"
                            accessibilityLabel="Elena Fisher"
                          />
                          <View className="ml-2.5 flex-1">
                            <Text className="text-sm font-bold text-slate-900">Elena Fisher</Text>
                            <Text className="text-xs text-slate-500">@elenadesign · 2h</Text>
                          </View>
                        </View>
                      </View>
                      <Text className="mt-2 text-sm leading-5 text-slate-800">
                        This resonates 💙 — thank you for the calm energy and the reminder to meet people where they are.
                      </Text>
                      <View className="mt-3 flex-row flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3">
                        <View className="flex-row items-center">
                          <Ionicons name="chatbubble-outline" size={16} color="#94a3b8" />
                          <Text className="ml-1 text-xs text-slate-500">7.50k</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Image
                            source={Images.readComment.iconHeartMark}
                            style={{ width: 16, height: 16 }}
                            resizeMode="contain"
                          />
                          <Text className="ml-1 text-xs text-slate-500">24.4k</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="sync" size={16} color="#94a3b8" />
                          <Text className="ml-1 text-xs font-semibold text-slate-600">Shift</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="eye-outline" size={16} color="#94a3b8" />
                          <Text className="ml-1 text-xs text-slate-500">900K</Text>
                        </View>
                        <Pressable hitSlop={6} className="ml-auto">
                          <Ionicons name="ellipsis-horizontal" size={18} color="#94a3b8" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={() => navigation.navigate('Reply', { replyToHandle: '@elenadesign' })}
          className="mt-2 items-center rounded-full border border-slate-200 bg-white py-3.5"
          style={{
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <Text className="font-semibold text-blue-600">Open full reply panel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
