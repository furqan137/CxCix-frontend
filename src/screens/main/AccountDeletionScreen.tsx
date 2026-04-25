import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { disconnectSocket } from '../../api/socket';
import { apiDeleteMyAccount } from '../../api/users';
import { GradientButton } from '../../components/ui/GradientButton';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';

type Props = NativeStackScreenProps<MainStackParamList, 'AccountDeletion'>;

const PAGE = '#F4F7F9';

function getNavigationRoot(navigation: Props['navigation']) {
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

export default function AccountDeletionScreen({ navigation }: Props) {
  const clearSession = useAuthStore((s) => s.clearSession);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and content. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await apiDeleteMyAccount();
                await clearSession();
                disconnectSocket();
                const root = getNavigationRoot(navigation);
                root.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  }),
                );
              } catch (e) {
                Alert.alert('Delete failed', getApiMessage(e));
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
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
        <Text className="text-lg font-bold text-slate-900">Account Deletion</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="flex-1 px-4 pt-6">
        <View className="rounded-3xl bg-white p-5 shadow-sm">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
            <Ionicons name="trash-outline" size={26} color="#EF4444" />
          </View>
          <Text className="mt-4 text-lg font-extrabold text-slate-900">Permanently delete your account</Text>
          <Text className="mt-2 text-sm leading-6 text-slate-500">
            This will remove your profile and content from CxCix. You will be logged out immediately.
          </Text>

          <GradientButton
            variant="primary"
            loading={busy}
            onPress={() => void run()}
            className="mt-5"
          >
            Delete my account
          </GradientButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

