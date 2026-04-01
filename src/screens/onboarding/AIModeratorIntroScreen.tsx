import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GradientButton } from '../../components/ui/GradientButton';
import { BRAND } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AIModeratorIntro'>;

/**
 * “Your personal AI Moderator” — brain illustration + train / skip.
 */
export default function AIModeratorIntroScreen({ navigation }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-center text-2xl font-bold leading-8" style={{ color: BRAND.ink }}>
          Your personal AI Moderator
        </Text>

        <View className="items-center py-8">
          <Image
            source={Images.brain}
            resizeMode="contain"
            style={{ width: '100%', height: 260 }}
            accessibilityLabel="AI brain illustration"
          />
        </View>

        <Text
          className="text-center text-base leading-6"
          style={{ color: BRAND.subtitle }}
        >
          Every user gets their own AI. It learns YOU. It filters what you dislike, highlights what
          you value.
        </Text>

        <View className="mt-10 gap-4">
          <GradientButton onPress={() => navigation.navigate('AIModerator')}>
            Train Your AI
          </GradientButton>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.replace('Login')}
            className="items-center py-3"
          >
            <Text className="text-base font-bold" style={{ color: BRAND.ink }}>
              Skip
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
