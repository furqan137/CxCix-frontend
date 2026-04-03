import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AnimatedBrainHero } from '../../components/animation/AnimatedBrainHero';
import { FadeStagger } from '../../components/animation/FadeStagger';
import { GradientButton } from '../../components/ui/GradientButton';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AIModeratorIntro'>;

/**
 * “Your personal AI Moderator” — animated brain + gears, train / skip.
 */
export default function AIModeratorIntroScreen({ navigation }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View className="flex-1 px-6 pt-6">
        <FadeStagger delayMs={40} variant="rise">
          <Text
            className="text-center text-[34px] font-extrabold leading-[40px]"
            style={{ color: BRAND.ink }}
          >
            Your personal AI{'\n'}Moderator
          </Text>
        </FadeStagger>

        <View className="min-h-[300px] flex-1 justify-center py-2">
          <FadeStagger delayMs={120} variant="fade">
            <AnimatedBrainHero source={Images.brain} maxWidth={320} />
          </FadeStagger>
        </View>

        <FadeStagger delayMs={200} variant="fade">
          <Text
            className="mb-6 text-center text-[16px] leading-6"
            style={{ color: BRAND.muted }}
          >
            Every user gets their own AI. It learns{'\n'}
            <Text className="font-bold" style={{ color: BRAND.ink }}>
              YOU
            </Text>
            . It filters what you dislike, highlights{'\n'}what you value.
          </Text>
        </FadeStagger>

        <View className="pb-2">
          <FadeStagger delayMs={280} variant="rise">
            <GradientButton variant="welcome" onPress={() => navigation.navigate('AIModerator')}>
              Train Your AI
            </GradientButton>
          </FadeStagger>
          <FadeStagger delayMs={340} variant="fade">
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.replace('Login')}
              className="items-center py-4"
            >
              <Text className="text-base font-semibold" style={{ color: BRAND.subtitle }}>
                Skip
              </Text>
            </Pressable>
          </FadeStagger>
        </View>
      </View>
    </SafeAreaView>
  );
}
