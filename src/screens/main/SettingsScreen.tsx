import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

const PAGE = '#F5F7F9';

function SectionTitle({ children }: { children: string }) {
  return <Text className="mb-2 mt-4 text-sm font-bold text-slate-700">{children}</Text>;
}

function Row({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm"
    >
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
          <Ionicons name={icon} size={20} color="#2563eb" />
        </View>
        <Text className="ml-3 text-[15px] font-semibold text-slate-800">{label}</Text>
      </View>
      <Ionicons name="chevron-down" size={18} color="#94a3b8" />
    </Pressable>
  );
}

/**
 * Settings — sections + rows + Log out (hi-fi match).
 */
export default function SettingsScreen({ navigation }: Props) {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Settings</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-3xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image source={Images.avatarSplit} className="h-12 w-12 rounded-full" resizeMode="cover" />
              <View className="ml-3">
                <Text className="text-[15px] font-bold text-slate-900">Wade Warren</Text>
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

        <SectionTitle>Account</SectionTitle>
        <View className="gap-3">
          <Row icon="person-circle-outline" label="Account & Security" />
          <Row icon="notifications-outline" label="Notifications" />
        </View>

        <SectionTitle>Privacy</SectionTitle>
        <View className="gap-3">
          <Row icon="lock-closed-outline" label="Privacy Settings" />
          <Row icon="ban-outline" label="Blocked Accounts" onPress={() => navigation.navigate('BlockedAccounts')} />
          <Row
            icon="volume-mute-outline"
            label="Muted Accounts"
            onPress={() => navigation.navigate('MutedAccounts')}
          />
        </View>

        <SectionTitle>AI</SectionTitle>
        <View className="gap-3">
          <Row icon="sparkles-outline" label="My AI Moderator" onPress={() => navigation.navigate('AIModeratorInsights')} />
          <Row icon="chatbubble-ellipses-outline" label="AI Labels & Explanations" />
        </View>

        <SectionTitle>Help</SectionTitle>
        <View className="gap-3">
          <Row icon="help-circle-outline" label="Help / FAQ" />
          <Row icon="mail-outline" label="Contact Support" onPress={() => navigation.navigate('ContactSupport')} />
        </View>

        <SectionTitle>Legal</SectionTitle>
        <View className="gap-3">
          <Row icon="document-text-outline" label="Terms of Service" />
          <Row icon="shield-outline" label="Privacy Policy" />
          <Row icon="people-outline" label="Community Guidelines" />
        </View>

        <Pressable className="mt-6 items-center rounded-full border border-slate-200 bg-white py-4">
          <Text className="text-base font-bold text-slate-700">Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

