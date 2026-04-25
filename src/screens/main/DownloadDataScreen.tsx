import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiMessage } from '../../api/auth';
import { apiExportMyData } from '../../api/users';
import type { MainStackParamList } from '../../navigation/types';
import { GradientButton } from '../../components/ui/GradientButton';

type Props = NativeStackScreenProps<MainStackParamList, 'DownloadData'>;

const PAGE = '#F4F7F9';

export default function DownloadDataScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [jsonPreview, setJsonPreview] = useState<string>('');
  const [fullJson, setFullJson] = useState<string>('');

  const run = async () => {
    setLoading(true);
    try {
      const data = await apiExportMyData();
      const text = JSON.stringify(data, null, 2);
      setFullJson(text);
      setJsonPreview(text.slice(0, 2500));
      try {
        await Clipboard.setStringAsync(text);
        Alert.alert('Export ready', 'Your data has been copied to clipboard as JSON.');
      } catch {
        Alert.alert('Export ready', 'JSON generated. Copy to clipboard failed on this device.');
      }
    } catch (e) {
      Alert.alert('Export failed', getApiMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const copyAgain = async () => {
    if (!fullJson) return;
    try {
      await Clipboard.setStringAsync(fullJson);
      Alert.alert('Copied', 'JSON copied to clipboard.');
    } catch {
      Alert.alert('Clipboard', 'Could not copy to clipboard.');
    }
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
        <Text className="text-lg font-bold text-slate-900">Download Your Data</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-3xl bg-white p-5 shadow-sm">
          <Text className="text-base font-bold text-slate-900">Export JSON</Text>
          <Text className="mt-2 text-sm leading-6 text-slate-500">
            Tap below to generate a JSON export of your account data from CxCix. The export will be copied to your clipboard.
          </Text>

          <GradientButton variant="welcome" loading={loading} onPress={() => void run()} className="mt-4">
            Generate export
          </GradientButton>

          {loading ? (
            <View className="mt-4 items-center">
              <ActivityIndicator />
            </View>
          ) : null}
        </View>

        {jsonPreview ? (
          <View className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
            <Text className="text-sm font-bold text-slate-900">Preview</Text>
            <Text className="mt-2 font-mono text-[11px] leading-5 text-slate-600">{jsonPreview}</Text>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-xs text-slate-400">Full JSON is ready.</Text>
              <Pressable
                onPress={() => void copyAgain()}
                className="rounded-full bg-slate-100 px-4 py-2"
                accessibilityRole="button"
                accessibilityLabel="Copy JSON to clipboard"
              >
                <Text className="text-xs font-bold text-slate-700">Copy</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

