import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { apiGetMyPrivacy, apiUpdateMyPrivacy, type PrivacySettings } from '../../api/users';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'MentionsSettings'>;

const PAGE = '#F4F7F9';

function OptionRow({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm"
    >
      <Text className="text-[15px] font-semibold text-slate-800">{label}</Text>
      <View
        className="h-6 w-6 items-center justify-center rounded-full border-2"
        style={{
          borderColor: active ? '#2563eb' : '#cbd5e1',
          backgroundColor: active ? '#2563eb' : 'transparent',
        }}
      >
        {active ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
      </View>
    </Pressable>
  );
}

export default function MentionsSettingsScreen({ navigation }: Props) {
  const [value, setValue] = useState<PrivacySettings['mentions']>('everyone');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGetMyPrivacy();
      setValue(d.mentions);
    } catch {
      setValue('everyone');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const save = async (next: PrivacySettings['mentions']) => {
    setSaving(true);
    try {
      const d = await apiUpdateMyPrivacy({ mentions: next });
      setValue(d.mentions);
    } catch (e) {
      Alert.alert('Mentions', getApiMessage(e));
    } finally {
      setSaving(false);
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
        <Text className="text-lg font-bold text-slate-900">Mentions</Text>
        <View className="h-10 w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <View className="flex-1 px-4 pt-6">
          <Text className="mb-3 text-sm font-semibold text-slate-600">
            Who can mention you?
          </Text>
          <View className="gap-3">
            <OptionRow
              label="Everyone"
              active={value === 'everyone'}
              onPress={() => void save('everyone')}
            />
            <OptionRow
              label="People I follow"
              active={value === 'following'}
              onPress={() => void save('following')}
            />
            <OptionRow
              label="No one"
              active={value === 'no_one'}
              onPress={() => void save('no_one')}
            />
          </View>
          {saving ? <Text className="mt-3 text-xs text-slate-400">Saving…</Text> : null}
        </View>
      )}
    </SafeAreaView>
  );
}

