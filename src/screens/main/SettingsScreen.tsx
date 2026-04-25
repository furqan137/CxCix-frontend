import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { disconnectSocket } from '../../api/socket';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

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
function getNavigationRoot(navigation: Props['navigation']) {
  // Walk up to the root stack (Login / Main live here), not the nested Main stack only.
  let current: { getParent?: () => unknown; dispatch: (a: unknown) => void } = navigation as {
    getParent?: () => unknown;
    dispatch: (a: unknown) => void;
  };
  let parent = current.getParent?.() as typeof current | undefined;
  while (parent) {
    current = parent;
    parent = current.getParent?.() as typeof current | undefined;
  }
  return current;
}

export default function SettingsScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const avatarSource =
    user?.avatarUrl && user.avatarUrl.length > 0
      ? { uri: user.avatarUrl }
      : Images.avatarSplit;
  const displayName = formatUserDisplayName(
    {
      fullName: user?.fullName,
      displayName: user?.displayName,
      username: user?.username,
      email: user?.email,
    },
    'Your name',
  );
  const handle = user?.username ? formatAtUsername(user.username) : formatAtUsername(null, 'username');

  const onLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await clearSession();
            disconnectSocket();
            const root = getNavigationRoot(navigation);
            root.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
            );
          })();
        },
      },
    ]);
  };

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
              <Image source={avatarSource} className="h-12 w-12 rounded-full" resizeMode="cover" />
              <View className="ml-3">
                <Text className="text-[15px] font-bold text-slate-900">{displayName}</Text>
                <Text className="text-sm text-slate-500">{handle}</Text>
              </View>
            </View>
            <Pressable
              className="overflow-hidden rounded-full"
              onPress={() => navigation.navigate('EditProfile')}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
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
          <Row
            icon="person-circle-outline"
            label="Account & Security"
            onPress={() => navigation.navigate('AccountSecurity')}
          />
          <Row
            icon="notifications-outline"
            label="Notifications"
            onPress={() => navigation.navigate('NotificationsSettings')}
          />
        </View>

        <SectionTitle>Privacy</SectionTitle>
        <View className="gap-3">
          <Row
            icon="lock-closed-outline"
            label="Privacy Settings"
            onPress={() => navigation.navigate('PrivacySettings')}
          />
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
          <Row
            icon="chatbubble-ellipses-outline"
            label="AI Labels & Explanations"
            onPress={() => navigation.navigate('AILabels')}
          />
        </View>

        <SectionTitle>Help</SectionTitle>
        <View className="gap-3">
          <Row icon="help-circle-outline" label="Help / FAQ" onPress={() => navigation.navigate('HelpFAQ')} />
          <Row icon="mail-outline" label="Contact Support" onPress={() => navigation.navigate('ContactSupport')} />
        </View>

        <SectionTitle>Legal</SectionTitle>
        <View className="gap-3">
          <Row
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => navigation.navigate('TermsOfService')}
          />
          <Row icon="shield-outline" label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
          <Row
            icon="people-outline"
            label="Community Guidelines"
            onPress={() => navigation.navigate('CommunityGuidelines')}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={onLogout}
          className="mt-6 items-center rounded-full border border-slate-200 bg-white py-4 active:opacity-80"
        >
          <Text className="text-base font-bold text-slate-700">Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

