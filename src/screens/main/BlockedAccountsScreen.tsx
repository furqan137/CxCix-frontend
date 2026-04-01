import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'BlockedAccounts'>;

const PAGE = '#F5F7F9';

type Blocked = { id: string; name: string; handle: string; avatar: any };

export default function BlockedAccountsScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [confirm, setConfirm] = useState<Blocked | null>(null);

  const blocked = useMemo<Blocked[]>(
    () => [
      { id: '1', name: 'Annette Black', handle: '@annette_black', avatar: Images.avatarSplit },
      { id: '2', name: 'Esther Howard', handle: '@ether_howard', avatar: Images.avatarWade },
      { id: '3', name: 'Leslie Alexander', handle: '@leslie_alex', avatar: Images.avatarSplit },
    ],
    [],
  );

  const filtered = blocked.filter(
    (b) =>
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.handle.toLowerCase().includes(query.toLowerCase()),
  );

  const empty = filtered.length === 0;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Blocked Accounts</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Ionicons name="search" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search by username..."
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            className="ml-2 flex-1 text-sm text-slate-900"
          />
        </View>

        {empty ? (
          <View className="mt-24 items-center px-8">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <Ionicons name="ban-outline" size={30} color="#2563eb" />
            </View>
            <Text className="mt-6 text-lg font-extrabold text-slate-900">No blocked accounts</Text>
            <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
              Users you block will appear here for easy management and review.
            </Text>
          </View>
        ) : (
          <View className="mt-4 gap-3">
            {filtered.map((b) => (
              <View
                key={b.id}
                className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm"
              >
                <View className="flex-row items-center">
                  <Image source={b.avatar} className="h-11 w-11 rounded-full" resizeMode="cover" />
                  <View className="ml-3">
                    <Text className="text-[15px] font-bold text-slate-900">{b.name}</Text>
                    <Text className="text-sm text-slate-500">{b.handle}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setConfirm(b)}
                  className="rounded-full border border-slate-300 bg-white px-5 py-2.5"
                >
                  <Text className="text-sm font-semibold text-slate-700">Unblock</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Unblock ${confirm?.handle ?? '@annette'}?`}
        message="They will be able to:"
        primaryLabel="Unblock"
        onPrimary={() => setConfirm(null)}
        icon={<Ionicons name="person-add-outline" size={22} color="#6366F1" />}
      >
        <View className="rounded-2xl bg-slate-50 p-4">
          <View className="flex-row items-center">
            <Ionicons name="eye-outline" size={18} color="#2563eb" />
            <Text className="ml-3 text-sm text-slate-700">See your posts (if public)</Text>
          </View>
          <View className="mt-3 flex-row items-center">
            <Ionicons name="chatbubble-outline" size={18} color="#2563eb" />
            <Text className="ml-3 text-sm text-slate-700">Reply / interact again</Text>
          </View>
        </View>
      </ConfirmDialog>
    </SafeAreaView>
  );
}

