import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { apiGetMySecurity, apiSetTwoFactor } from '../../api/users';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'TwoFactor'>;

const PAGE = '#F4F7F9';

export default function TwoFactorScreen({ navigation }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGetMySecurity();
      setEnabled(d.twoFactorEnabled);
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const toggle = async (next: boolean) => {
    setSaving(true);
    try {
      const v = await apiSetTwoFactor(next);
      setEnabled(v);
      Alert.alert('Updated', v ? 'Two-factor enabled.' : 'Two-factor disabled.');
    } catch (e) {
      Alert.alert('Two-factor', getApiMessage(e));
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
        <Text className="text-lg font-bold text-slate-900">Two-Factor Authentication</Text>
        <View className="h-10 w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <View className="flex-1 px-4 pt-6">
          <View className="rounded-3xl bg-white p-5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-base font-bold text-slate-900">Protect your account</Text>
                <Text className="mt-1 text-sm leading-5 text-slate-500">
                  Turn on an extra security step. (This stores your preference now; full login enforcement can be added next.)
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={(v) => {
                  if (saving) return;
                  void toggle(v);
                }}
              />
            </View>
            {saving ? <Text className="mt-3 text-xs text-slate-400">Saving…</Text> : null}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

