import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { apiGetMyPrivacy, apiUpdateMyPrivacy, type ConnectedAccount } from '../../api/users';
import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'ConnectedAccounts'>;

const PAGE = '#F4F7F9';

export default function ConnectedAccountsScreen({ navigation }: Props) {
  const [rows, setRows] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState('');
  const [handle, setHandle] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGetMyPrivacy();
      setRows(d.connectedAccounts || []);
    } catch (e) {
      Alert.alert('Connected accounts', getApiMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const save = async (next: ConnectedAccount[]) => {
    setSaving(true);
    try {
      const d = await apiUpdateMyPrivacy({ connectedAccounts: next });
      setRows(d.connectedAccounts || []);
      setProvider('');
      setHandle('');
    } catch (e) {
      Alert.alert('Connected accounts', getApiMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const add = async () => {
    const p = provider.trim();
    const h = handle.trim();
    if (!p || !h) {
      Alert.alert('Connected accounts', 'Enter provider and handle.');
      return;
    }
    await save([...rows, { provider: p, handle: h }]);
  };

  const remove = async (idx: number) => {
    const next = rows.filter((_, i) => i !== idx);
    await save(next);
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
        <Text className="text-lg font-bold text-slate-900">Connected Accounts</Text>
        <View className="h-10 w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <View className="flex-1 px-4 pt-6">
          <Text className="mb-3 text-xs text-slate-500">
            This stores connected accounts in CxCix. OAuth linking is not enabled yet.
          </Text>

          <Input label="Provider" placeholder="Instagram" value={provider} onChangeText={setProvider} />
          <Input label="Handle" placeholder="@yourhandle" value={handle} onChangeText={setHandle} />
          <GradientButton variant="welcome" loading={saving} onPress={() => void add()} className="mb-4">
            Add account
          </GradientButton>

          <View className="gap-3">
            {rows.length === 0 ? (
              <Text className="text-sm text-slate-500">No connected accounts.</Text>
            ) : (
              rows.map((r, idx) => (
                <View key={`${r.provider}-${r.handle}-${idx}`} className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="text-[15px] font-bold text-slate-900">{r.provider}</Text>
                      <Text className="mt-0.5 text-sm text-slate-500">{r.handle}</Text>
                    </View>
                    <Pressable
                      onPress={() => void remove(idx)}
                      className="rounded-full bg-slate-100 px-4 py-2"
                      disabled={saving}
                      style={{ opacity: saving ? 0.6 : 1 }}
                    >
                      <Text className="text-sm font-semibold text-slate-700">Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

