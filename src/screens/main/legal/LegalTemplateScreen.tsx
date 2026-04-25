import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MainStackParamList } from '../../../navigation/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type LegalSection = {
  id: string;
  title: string;
  body: string;
};

type Props = NativeStackScreenProps<MainStackParamList, 'TermsOfService' | 'PrivacyPolicy' | 'CommunityGuidelines'>;

const PAGE = '#F5F7F9';

export function LegalTemplateScreen({
  navigation,
  title,
  subtitle,
  accent,
  sections,
}: Props & {
  title: string;
  subtitle: string;
  accent: [string, string];
  sections: LegalSection[];
}) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null);

  const lastUpdated = useMemo(() => new Date().toLocaleDateString(), []);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">{title}</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <LinearGradient
            colors={accent}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ padding: 16 }}
          >
            <Text className="text-base font-extrabold text-white">{title}</Text>
            <Text className="mt-1 text-sm text-white/90">{subtitle}</Text>
            <Text className="mt-2 text-xs font-semibold text-white/80">Last updated: {lastUpdated}</Text>
          </LinearGradient>
        </View>

        <View className="mt-4 gap-3">
          {sections.map((s) => {
            const expanded = openId === s.id;
            return (
              <View key={s.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <Pressable
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setOpenId((prev) => (prev === s.id ? null : s.id));
                  }}
                  className="flex-row items-center justify-between px-4 py-4"
                >
                  <Text className="flex-1 pr-3 text-[15px] font-semibold text-slate-900">
                    {s.title}
                  </Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#94a3b8"
                  />
                </Pressable>
                {expanded ? (
                  <View className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <Text className="text-[13px] leading-6 text-slate-700">{s.body}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

