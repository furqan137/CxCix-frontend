import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Image, LayoutAnimation, Platform, Pressable, ScrollView, Text, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<MainStackParamList, 'ReadComment'>;

const SECTIONS = [
  { id: 'support', title: 'Support', count: 10, icon: 'heart-outline' as const, color: '#4A90E2' },
  { id: 'counterpoint', title: 'Counterpoint', count: 3, icon: 'bulb-outline' as const, color: '#64748b' },
  { id: 'question', title: 'Question', count: 8, icon: 'help-circle-outline' as const, color: '#64748b' },
  { id: 'build', title: 'Build', count: 20, icon: 'construct-outline' as const, color: '#64748b' },
  { id: 'reflect', title: 'Reflect', count: 8, icon: 'leaf-outline' as const, color: '#64748b' },
  { id: 'vawulence', title: 'Vawulence', count: 40, icon: 'flash-outline' as const, color: '#64748b' },
];

/**
 * Read Comment — main post + structured comment accordions (hi-fi).
 */
export default function ReadCommentScreen({ navigation }: Props) {
  const [openId, setOpenId] = useState<string | null>('support');

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F5F7F9' }} edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-slate-200/80 bg-white px-3 py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Read Comment</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Ionicons name="settings-outline" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <View className="rounded-3xl bg-white p-4 shadow-sm">
          <View className="flex-row items-start justify-between">
            <View className="flex-row">
              <Image
                source={Images.avatarSplit}
                className="h-11 w-11 rounded-full"
                resizeMode="cover"
              />
              <View className="ml-3">
                <Text className="text-[15px] font-bold text-slate-900">Annette Black</Text>
                <Text className="text-sm text-slate-500">@elenadesign · 2h</Text>
              </View>
            </View>
            <Ionicons name="bookmark-outline" size={22} color="#64748b" />
          </View>
          <Text className="mt-3 text-[15px] leading-6 text-slate-800">
            Weekend mood: soft light, good coffee, and a cat that thinks it owns the couch.
          </Text>
          <Image
            source={Images.mediaCat}
            className="mt-3 w-full overflow-hidden rounded-2xl"
            style={{ height: 200 }}
            resizeMode="cover"
          />
          <View className="mt-4 flex-row flex-wrap items-center gap-x-4 border-t border-slate-100 pt-3">
            <View className="flex-row items-center">
              <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
              <Text className="ml-1 text-sm text-slate-600">7.50k</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="heart" size={18} color="#3b82f6" />
              <Text className="ml-1 text-sm text-slate-600">24.4k</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="sync" size={18} color="#64748b" />
              <Text className="ml-1 text-sm text-slate-600">Shift</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="eye-outline" size={18} color="#64748b" />
              <Text className="ml-1 text-sm text-slate-600">900K</Text>
            </View>
          </View>
        </View>

        <Text className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Structured comments
        </Text>

        {SECTIONS.map((s) => {
          const expanded = openId === s.id;
          return (
            <View key={s.id} className="mb-2 overflow-hidden rounded-2xl bg-white shadow-sm">
              <Pressable
                onPress={() => toggle(s.id)}
                className="flex-row items-center justify-between px-4 py-3.5"
              >
                <View className="flex-row items-center">
                  <Ionicons name={s.icon} size={20} color={s.color} />
                  <Text className="ml-3 font-semibold text-slate-900">
                    {s.title} ({s.count})
                  </Text>
                </View>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#94a3b8"
                />
              </Pressable>
              {expanded && s.id === 'support' ? (
                <View className="border-t border-slate-100 bg-slate-50/80 px-4 pb-4 pt-2">
                  <View className="rounded-2xl bg-white p-3">
                    <View className="flex-row items-center">
                      <Image
                        source={Images.avatarSplit}
                        className="h-9 w-9 rounded-full"
                        resizeMode="cover"
                      />
                      <View className="ml-2">
                        <Text className="text-sm font-bold text-slate-900">Elena Fisher</Text>
                        <Text className="text-xs text-slate-500">@elenadesign · 1h</Text>
                      </View>
                    </View>
                    <Text className="mt-2 text-sm leading-5 text-slate-800">
                      This resonates 💙 — thank you for the calm energy.
                    </Text>
                    <View className="mt-3 flex-row gap-4 border-t border-slate-100 pt-2">
                      <Ionicons name="chatbubble-outline" size={16} color="#94a3b8" />
                      <Ionicons name="heart-outline" size={16} color="#94a3b8" />
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}

        <Pressable
          onPress={() => navigation.navigate('Reply', { replyToHandle: '@elenadesign' })}
          className="mt-4 items-center rounded-full bg-white py-3 shadow-sm"
        >
          <Text className="font-semibold text-blue-600">Open full reply panel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
