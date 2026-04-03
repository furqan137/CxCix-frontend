import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BRAND_GRADIENT } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'AddCommentary'>;

const BG = '#F8F9FA';

/**
 * Add Commentary — quoted post + perspective + composer (hi-fi match).
 */
export default function AddCommentaryScreen({ navigation, route }: Props) {
  const perspectiveLabel = route.params?.perspectiveLabel ?? 'Advice';
  const [text, setText] = useState('');
  const max = 280;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-slate-100 px-3 py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Add Commentary</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="overflow-hidden rounded-full"
          style={{ minWidth: 72 }}
        >
          <LinearGradient
            colors={['#8E8FFA', '#F9D949']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' }}
          >
            <Text className="text-sm font-bold text-white">Post</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <ScrollView style={{ backgroundColor: BG }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="mb-4 flex-row items-center rounded-2xl bg-white px-4 py-3 shadow-sm">
          <Image
            source={Images.perspectiveLightbulb}
            resizeMode="contain"
            style={{ width: 22, height: 22 }}
            accessibilityLabel="Perspective"
          />
          <Text className="ml-2 text-sm font-semibold text-slate-700">
            Perspective: {perspectiveLabel}
          </Text>
        </View>

        <View
          className="rounded-3xl bg-white p-4 shadow-soft"
          style={{
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <TextInput
            className="min-h-[100px] text-[16px] leading-6 text-slate-900"
            placeholder="Write your commentary here..."
            placeholderTextColor="#A0AEC0"
            multiline
            value={text}
            onChangeText={setText}
            maxLength={max}
            textAlignVertical="top"
          />

          <View className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <View className="flex-row items-center">
              <Image
                source={Images.avatarSplit}
                className="h-9 w-9 rounded-full"
                resizeMode="cover"
              />
              <View className="ml-2">
                <Text className="text-sm font-bold text-slate-900">Elena Fisher</Text>
                <Text className="text-xs text-slate-500">@elenadesign · 2h</Text>
              </View>
            </View>
            <Text className="mt-2 text-sm leading-5 text-slate-800">
              Taking a moment to breathe today. The world is quiet and everything feels aligned.
              Sending peace to everyone on the timeline. 🌿
            </Text>
            <Image
              source={Images.feedPost1}
              className="mt-2 w-full overflow-hidden rounded-2xl"
              style={{ height: 140 }}
              resizeMode="cover"
            />
          </View>
        </View>

        <View className="mt-4 flex-row items-center justify-between px-1">
          <View className="flex-row gap-5">
            <Ionicons name="image-outline" size={24} color="#94a3b8" />
            <Ionicons name="at" size={24} color="#94a3b8" />
            <Ionicons name="happy-outline" size={24} color="#94a3b8" />
          </View>
          <Text className="text-sm text-slate-400">
            {text.length} / {max}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
