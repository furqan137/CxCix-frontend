import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { Images } from '../../constants/images';
import { MOOD_LABELS } from '../../constants/moods';
import { useMoodStore } from '../../store/useMoodStore';

const PAGE = '#F5F7F9';

const TOPICS = ['Personal Growth', 'Creative Ideas', 'Deep Explanations'] as const;

export default function ExploreScreen() {
  const navigation = useNavigation();
  const mood = useMoodStore((s) => s.currentMood);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
        <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Explore</Text>
        <Pressable
          onPress={() => navigation.getParent()?.navigate('Search')}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="search" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Ask your AI... ('best productivity hacks', 'urban...')"
            placeholderTextColor="#94a3b8"
            className="ml-2 flex-1 text-sm text-slate-900"
          />
        </View>

        <Text className="mt-6 text-center text-xl font-bold text-slate-900">
          You're in {MOOD_LABELS[mood]} 😌
        </Text>

        <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
          {[
            { label: 'Feeling curious?', icon: 'book-outline' as const },
            { label: 'Need a laugh?', icon: 'happy-outline' as const },
            { label: 'Vawulence?', icon: 'flame-outline' as const },
            { label: 'Want to create?', icon: 'color-palette-outline' as const },
            { label: 'Ready to engage?', icon: 'chatbubbles-outline' as const },
            { label: 'Need Calm?', icon: 'flower-outline' as const },
          ].map((c) => (
            <View key={c.label} className="w-[32%] items-center">
              <View className="w-full flex-row items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 py-2.5">
                <Ionicons name={c.icon} size={16} color="#2563eb" />
                <Text className="ml-1 text-[10px] font-semibold text-slate-700">{c.label}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text className="mt-6 text-base font-bold text-slate-900">AI Topics For You</Text>
        <View className="mt-3 flex-row gap-3">
          {TOPICS.map((t, idx) => (
            <Pressable
              key={t}
              className={`rounded-full px-4 py-2 ${idx === 0 ? 'bg-slate-200' : 'bg-white'} border border-slate-200`}
            >
              <Text className="text-sm font-semibold text-slate-700">{t}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="mt-6 text-base font-bold text-slate-900">Explore By Mood</Text>

        <View className="mt-3 rounded-3xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="flower-outline" size={18} color="#2563eb" />
              <Text className="ml-2 text-sm font-bold text-slate-900">Calm</Text>
            </View>
            <LinearGradient
              colors={['#6366F1', '#FDE047']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text className="text-xs font-bold text-white">Switch to Calm</Text>
            </LinearGradient>
          </View>
          <View className="mt-3 flex-row gap-3">
            {[
              { title: 'Find peace within\nthe noise', img: Images.tileCalmMan },
              { title: 'Clarity begins with\na breath', img: Images.feedPost2 },
              { title: 'Silence is the loudest\nstrength', img: Images.tileSilence },
            ].map((c) => (
              <View key={c.title} className="flex-1">
                <Image source={c.img} className="h-20 w-full overflow-hidden rounded-2xl" resizeMode="cover" />
                <Text className="mt-2 text-xs font-semibold text-slate-800">{c.title}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="book-outline" size={18} color="#2563eb" />
              <Text className="ml-2 text-sm font-bold text-slate-900">Serious</Text>
            </View>
            <LinearGradient
              colors={['#E0E7FF', '#FEF3C7']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text className="text-xs font-bold text-slate-700">View Mood</Text>
            </LinearGradient>
          </View>
          <View className="mt-3 flex-row gap-3">
            {[
              { title: 'Focus demands\nabsolute sacrifice', img: Images.tileEconomy },
              { title: 'Results require\nsilent work', img: Images.feedPost1 },
              { title: 'Build depth, not\nnoise', img: Images.tileVr },
            ].map((c) => (
              <View key={c.title} className="flex-1">
                <Image source={c.img} className="h-20 w-full overflow-hidden rounded-2xl" resizeMode="cover" />
                <Text className="mt-2 text-xs font-semibold text-slate-800">{c.title}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
