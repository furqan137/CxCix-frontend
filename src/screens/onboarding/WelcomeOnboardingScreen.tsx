import { StatusBar } from 'expo-status-bar';
import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientButton } from '../../components/ui/GradientButton';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WelcomeOnboarding'>;

/**
 * Welcome step — hero surf illustration + “Get Started” gradient CTA (hi-fi layout).
 */
export default function WelcomeOnboardingScreen({ navigation }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View className="flex-1 px-6">
        <View className="items-center pt-4">
          <Image
            source={Images.logo}
            resizeMode="contain"
            style={{ width: '100%', maxWidth: 320, height: 96 }}
            accessibilityLabel="CxCix logo"
          />
          <Text className="mt-2 text-center text-2xl font-bold" style={{ color: BRAND.ink }}>
            Surf Your Mood
          </Text>
          <Text
            className="mt-1 max-w-md text-center text-sm leading-5"
            style={{ color: BRAND.muted }}
          >
            Emotion-Intelligent Social Platform
          </Text>
        </View>

        <View className="flex-1 justify-center py-4">
          <Image
            source={Images.welcomeSurf}
            resizeMode="contain"
            style={{ width: '100%', height: '100%', maxHeight: 360 }}
            accessibilityLabel="Surfing moods illustration"
          />
        </View>

        <View className="pb-2">
          <GradientButton variant="welcome" onPress={() => navigation.navigate('AIModeratorIntro')}>
            Get Started
          </GradientButton>
        </View>
      </View>
    </SafeAreaView>
  );
}
