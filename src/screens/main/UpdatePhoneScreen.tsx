import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiChangePhone, getApiMessage } from '../../api/auth';
import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';

type Props = NativeStackScreenProps<MainStackParamList, 'UpdatePhone'>;

const PAGE = '#F4F7F9';

export default function UpdatePhoneScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [phone, setPhone] = useState(user?.phone?.trim() || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!phone.trim()) {
      Alert.alert('Phone', 'Enter a phone number.');
      return;
    }
    setSaving(true);
    try {
      await apiChangePhone({ phone: phone.trim() });
      await refreshUser();
      Alert.alert('Updated', 'Your phone number has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Could not update', getApiMessage(e));
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
        <Text className="text-lg font-bold text-slate-900">Phone Number</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="flex-1 px-4 pt-6">
        <Input
          label="Phone"
          placeholder="+1 555 123 4567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Text className="mb-4 text-xs text-slate-500">
          Note: SMS verification isn’t enabled yet. This updates your profile phone in the CxCix database.
        </Text>
        <GradientButton variant="primary" loading={saving} onPress={() => void save()}>
          Update phone
        </GradientButton>
      </View>
    </SafeAreaView>
  );
}

