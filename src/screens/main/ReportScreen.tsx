import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BRAND_GRADIENT } from '../../constants/brand';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Report'>;

const PAGE = '#F5F7F9';

const REASONS = [
  'Harassment / abuse',
  'Hate / violent content',
  'Spam / scam',
  'Misinformation',
  'Other',
] as const;

export default function ReportScreen({ navigation }: Props) {
  const [reason, setReason] = useState<(typeof REASONS)[number]>('Harassment / abuse');
  const [details, setDetails] = useState('');

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Report</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Ionicons name="settings-outline" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text className="text-base font-bold text-slate-900">What's happening?</Text>

        <View className="mt-3 gap-3">
          {REASONS.map((r) => {
            const active = r === reason;
            return (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm"
              >
                <Text className="text-[15px] text-slate-800">{r}</Text>
                <View
                  className="h-6 w-6 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: active ? '#2563eb' : '#cbd5e1',
                    backgroundColor: active ? '#2563eb' : 'transparent',
                  }}
                >
                  {active ? <View className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text className="mt-6 text-base font-bold text-slate-900">Details (optional)</Text>
        <View className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
          <TextInput
            placeholder="Write details..."
            placeholderTextColor="#94a3b8"
            value={details}
            onChangeText={setDetails}
            multiline
            className="min-h-[110px] text-[15px] text-slate-900"
          />
        </View>

        <Text className="mt-3 text-xs text-slate-400">
          Please provide as much context as possible to help us review this.
        </Text>

        <Pressable
          onPress={() => navigation.goBack()}
          className="mt-8 overflow-hidden rounded-full"
        >
          <LinearGradient
            colors={[...BRAND_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ paddingVertical: 16, alignItems: 'center' }}
          >
            <Text className="text-base font-bold text-white">Submit Report</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

