import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MessagingScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
      <Text className="text-lg font-semibold text-slate-800">Messages</Text>
      <Text className="mt-2 text-slate-500">Real-time chat — coming soon.</Text>
    </SafeAreaView>
  );
}
