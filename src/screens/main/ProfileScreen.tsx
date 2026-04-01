import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Images } from '../../constants/images';

const PAGE = '#F5F7F9';

const TABS = ['Posts', 'Shifted', 'Bookmarks', 'Likes', 'Media'] as const;

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Posts');

  const openSaved = () => {
    navigation.getParent()?.navigate('Saved');
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Profile</Text>
        <Pressable
          onPress={() => navigation.getParent()?.navigate('Search')}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="search" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-3xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <LinearGradient
                colors={['#6366F1', '#FDE047']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' }}
              >
                <View className="h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-full bg-white">
                  <Image source={Images.avatarSplit} style={{ width: 62, height: 62 }} resizeMode="cover" />
                </View>
              </LinearGradient>
              <View className="ml-4">
                <Text className="text-lg font-bold text-slate-900">Wade Warren</Text>
                <Text className="text-sm text-slate-500">@wade_warren</Text>
              </View>
            </View>
            <Pressable className="overflow-hidden rounded-full">
              <LinearGradient
                colors={['#6366F1', '#FDE047']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Ionicons name="pencil" size={14} color="#fff" />
                <Text className="text-xs font-bold text-white">Edit</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <View className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-900">Mood Distribution</Text>
            <Text className="text-xs font-semibold text-blue-600">This Week</Text>
          </View>
          <View className="mt-3 overflow-hidden rounded-full bg-slate-100">
            <View className="h-3 flex-row">
              <View style={{ flex: 2, backgroundColor: '#8B5CF6' }} />
              <View style={{ flex: 1, backgroundColor: '#F97316' }} />
              <View style={{ flex: 1, backgroundColor: '#F59E0B' }} />
              <View style={{ flex: 2, backgroundColor: '#22C55E' }} />
              <View style={{ flex: 2, backgroundColor: '#3B82F6' }} />
            </View>
          </View>
          <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-2">
            <Legend dot="#8B5CF6" label="Creative" />
            <Legend dot="#F97316" label="Debate" />
            <Legend dot="#F59E0B" label="Funny" />
            <Legend dot="#22C55E" label="Calm" />
            <Legend dot="#3B82F6" label="Serious" />
          </View>
        </View>

        <View className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-900">Mood Passport</Text>
            <Text className="text-xs font-semibold text-slate-400">Last 30 Days Summary</Text>
          </View>
          <Text className="mt-2 text-xs text-slate-500">
            Time-Of-Day Mood Band / Peaks Timeline
          </Text>
          <View className="mt-3 overflow-hidden rounded-full bg-slate-100">
            <View className="h-3 flex-row">
              <View style={{ flex: 1, backgroundColor: '#60A5FA' }} />
              <View style={{ flex: 2, backgroundColor: '#A78BFA' }} />
              <View style={{ flex: 2, backgroundColor: '#FDE047' }} />
              <View style={{ flex: 2, backgroundColor: '#FB923C' }} />
              <View style={{ flex: 1, backgroundColor: '#F59E0B' }} />
            </View>
          </View>
          <View className="mt-2 flex-row justify-between">
            {['00:00', '06:00', '12:00', '18:00', '24:00'].map((t) => (
              <Text key={t} className="text-[10px] text-slate-400">
                {t}
              </Text>
            ))}
          </View>
        </View>

        <Text className="mt-6 text-base font-bold text-slate-900">AI Insights</Text>
        <View className="mt-3 gap-3">
          <Insight
            icon="sparkles-outline"
            title="Your creativity peaks at night"
            sub="Based on your activity patterns from 10 PM to 2 AM."
          />
          <Insight
            icon="shield-checkmark-outline"
            title="You avoided Debate for 3 weeks"
            sub="Consistency is key to maintaining your current calm state."
          />
        </View>

        <View className="mt-6 border-b border-slate-200">
          <View className="flex-row justify-between">
            {TABS.map((t) => {
              const active = tab === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    setTab(t);
                    if (t === 'Bookmarks') openSaved();
                  }}
                  className="flex-1 items-center pb-3"
                >
                  <Text className={`text-sm font-semibold ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                    {t}
                  </Text>
                  {active ? <View className="mt-2 h-1 w-10 rounded-full bg-blue-500" /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          {[Images.tileCalmMan, Images.feedPost2, Images.tileSilence].map((img, idx) => (
            <View key={idx} className="flex-1">
              <Image source={img} className="h-24 w-full overflow-hidden rounded-2xl" resizeMode="cover" />
              <Text className="mt-2 text-xs font-semibold text-slate-800">
                {idx === 0 ? 'Find peace within\nthe noise' : idx === 1 ? 'Clarity begins with\na breath' : 'Silence is the loudest\nstrength'}
              </Text>
              <View className="mt-1 flex-row items-center">
                <Ionicons name="heart" size={14} color="#3b82f6" />
                <Text className="ml-1 text-xs text-slate-500">24.4k</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dot }} />
      <Text className="ml-2 text-xs text-slate-600">{label}</Text>
    </View>
  );
}

function Insight({
  icon,
  title,
  sub,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  sub: string;
}) {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-start">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
          <Ionicons name={icon} size={18} color="#2563eb" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-sm font-bold text-slate-900">{title}</Text>
          <Text className="mt-1 text-xs leading-5 text-slate-500">{sub}</Text>
        </View>
      </View>
    </View>
  );
}
