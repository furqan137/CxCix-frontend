import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { apiGetNotificationSettings, apiUpdateNotificationSettings } from '../../api/users';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'QuietMode'>;

const PAGE = '#F4F7F9';

const PRESETS = [
  { label: '1 hour', hours: 1 },
  { label: '8 hours', hours: 8 },
  { label: '24 hours', hours: 24 },
  { label: 'Until tomorrow', hours: 12 }, // simple preset
] as const;

export default function QuietModeScreen({ navigation }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [until, setUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGetNotificationSettings();
      setEnabled(d.quietModeEnabled === true);
      setUntil(d.quietModeUntil);
    } catch (e) {
      Alert.alert('Quiet Mode', getApiMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const untilLabel = useMemo(() => {
    if (!enabled) return 'Off';
    if (!until) return 'On';
    const d = new Date(until);
    if (Number.isNaN(d.getTime())) return 'On';
    return `Until ${d.toLocaleString()}`;
  }, [enabled, until]);

  const setQuiet = async (nextEnabled: boolean, nextUntil: string | null) => {
    setSaving(true);
    try {
      const d = await apiUpdateNotificationSettings({
        quietModeEnabled: nextEnabled,
        quietModeUntil: nextUntil,
      });
      setEnabled(d.quietModeEnabled);
      setUntil(d.quietModeUntil);
    } catch (e) {
      Alert.alert('Quiet Mode', getApiMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const turnOff = () => void setQuiet(false, null);

  const applyPreset = (hours: number) => {
    const d = new Date(Date.now() + hours * 60 * 60 * 1000);
    void setQuiet(true, d.toISOString());
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
        <Text className="text-lg font-bold text-slate-900">Quiet Mode</Text>
        <View className="h-10 w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <View className="flex-1 px-4 pt-6">
          <View className="rounded-3xl bg-white p-5 shadow-sm">
            <Text className="text-base font-bold text-slate-900">Mute push temporarily</Text>
            <Text className="mt-1 text-sm leading-6 text-slate-500">
              Quiet Mode disables push alerts. You can still see notifications inside the app.
            </Text>
            <Text className="mt-3 text-sm font-semibold text-slate-700">{untilLabel}</Text>

            <View className="mt-4 gap-3">
              {PRESETS.map((p) => (
                <Pressable
                  key={p.label}
                  onPress={() => applyPreset(p.hours)}
                  disabled={saving}
                  className="flex-row items-center justify-between rounded-2xl bg-slate-50 px-4 py-4"
                  style={{ opacity: saving ? 0.6 : 1 }}
                >
                  <Text className="text-[15px] font-semibold text-slate-800">{p.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={turnOff}
              disabled={saving}
              className="mt-5 items-center rounded-full bg-slate-200 py-3"
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              <Text className="text-sm font-bold text-slate-800">Turn off</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

