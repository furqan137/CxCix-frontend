import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientButton } from '../../components/ui/GradientButton';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountCreated'>;

export default function AccountCreatedScreen({ navigation }: Props) {
  const markOnboardingComplete = useAuthStore((s) => s.markOnboardingComplete);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [loading, setLoading] = useState(false);

  const onGoFeed = async () => {
    setLoading(true);
    try {
      await markOnboardingComplete();
      await refreshUser();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (e) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-8">
        <Image
          source={Images.logo}
          resizeMode="contain"
          style={{ width: 280, height: 120 }}
        />
        <Text
          className="mt-8 text-center text-2xl font-bold"
          style={{ color: BRAND.ink }}
        >
          Account Created 🥳
        </Text>
        <Text className="mt-3 text-center text-base" style={{ color: BRAND.muted }}>
          Your account has been successfully created.
        </Text>
        <View className="mt-12 w-full max-w-md">
          <GradientButton variant="welcome" loading={loading} onPress={() => void onGoFeed()}>
            Go to Feed
          </GradientButton>
        </View>
      </View>
    </SafeAreaView>
  );
}
