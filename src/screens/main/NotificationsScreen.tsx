import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Images } from '../../constants/images';

const PAGE = '#F5F7F9';

type Notif = {
  id: string;
  avatar: any;
  user: string;
  message: string;
  time: string;
  badge?: string;
};

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();

  const data = useMemo<Notif[]>(
    () => [
      { id: '1', avatar: Images.avatarSplit, user: '@lily_smith', message: 'followed you', time: '2m ago' },
      { id: '2', avatar: Images.avatarWade, user: '@jane_cooper', message: 'Liked your photo', time: '5m ago' },
      { id: '3', avatar: Images.avatarSplit, user: '@leslie', message: 'followed you', time: '10m ago' },
      { id: '4', avatar: Images.avatarSplit, user: '@kristin_watson', message: 'mentioned\nyou in a respond', time: '15m ago' },
      { id: '5', avatar: Images.avatarWade, user: '@guy_hawkins', message: 'shifted your post', time: '30m ago', badge: 'PERSPECTIVE: COUNTERPOINT' },
      { id: '6', avatar: Images.avatarSplit, user: '@robert_fox', message: 'mentioned you\nin a comment', time: '1h ago' },
      { id: '7', avatar: Images.avatarSplit, user: '@femmyapson', message: 'replied under\nyour post', time: '2h ago' },
      { id: '8', avatar: Images.avatarSplit, user: '@cody_fisher', message: 'liked your post', time: 'Jan 11' },
    ],
    [],
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Notifications</Text>
        <Pressable
          onPress={() => navigation.getParent()?.navigate('Settings')}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="settings-outline" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {data.map((n) => (
          <View
            key={n.id}
            className="mb-3 flex-row items-center rounded-2xl bg-white px-4 py-3 shadow-sm"
          >
            <Image source={n.avatar} className="h-10 w-10 rounded-full" resizeMode="cover" />
            <View className="ml-3 flex-1">
              <Text className="text-[15px] font-bold text-slate-900">
                {n.user}{' '}
                <Text className="font-normal text-slate-700">{n.message}</Text>
              </Text>
              {n.badge ? (
                <View className="mt-2 self-start rounded-md bg-slate-100 px-2 py-1">
                  <Text className="text-[10px] font-bold tracking-widest text-slate-500">
                    {n.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="text-xs text-slate-400">{n.time}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
