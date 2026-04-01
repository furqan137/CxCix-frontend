import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BRAND_GRADIENT } from '../../constants/brand';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'ContactSupport'>;

const PAGE = '#F5F7F9';
const TABS = ['Bug', 'Feedback', 'Safety', 'Other'] as const;

export default function ContactSupportScreen({ navigation }: Props) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Bug');
  const [msg, setMsg] = useState('');

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Contact Support</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                className="overflow-hidden rounded-full"
                style={{ flex: 1 }}
              >
                {active ? (
                  <LinearGradient
                    colors={[...BRAND_GRADIENT]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ paddingVertical: 10, alignItems: 'center' }}
                  >
                    <Text className="text-sm font-bold text-white">{t}</Text>
                  </LinearGradient>
                ) : (
                  <View className="items-center rounded-full bg-white py-2.5">
                    <Text className="text-sm font-semibold text-slate-500">{t}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Text className="mt-6 text-base font-bold text-slate-900">Message</Text>
        <View className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
          <TextInput
            placeholder="Describe your issue or feedback here..."
            placeholderTextColor="#94a3b8"
            value={msg}
            onChangeText={setMsg}
            multiline
            className="min-h-[110px] text-[15px] text-slate-900"
          />
        </View>

        <Text className="mt-6 text-base font-bold text-slate-900">Attach Screenshot</Text>
        <Pressable className="mt-3 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-8">
          <Ionicons name="add" size={26} color="#94a3b8" />
          <Text className="mt-2 text-sm font-semibold text-slate-400">Add Media</Text>
        </Pressable>

        <Pressable className="mt-10 overflow-hidden rounded-full">
          <LinearGradient
            colors={[...BRAND_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ paddingVertical: 16, alignItems: 'center' }}
          >
            <Text className="text-base font-bold text-white">Send Message</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

