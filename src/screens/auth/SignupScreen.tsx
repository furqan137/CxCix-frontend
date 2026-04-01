import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/ui/Button';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

/** Placeholder until full signup + onboarding ships */
export default function SignupScreen({ navigation }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-surface px-6" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View className="flex-1 justify-center">
        <Text className="text-2xl font-bold text-zinc-900">Create account</Text>
        <Text className="mt-2 text-base text-zinc-500">
          Full signup flow arrives in the next milestone (onboarding + AI setup).
        </Text>
        <Button variant="outline" className="mt-8" onPress={() => navigation.goBack()}>
          Back to login
        </Button>
      </View>
    </SafeAreaView>
  );
}
