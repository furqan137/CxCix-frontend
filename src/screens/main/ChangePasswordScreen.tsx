import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiChangePassword, getApiMessage } from '../../api/auth';
import { GradientButton } from '../../components/ui/GradientButton';
import { Input } from '../../components/ui/Input';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'ChangePassword'>;

const PAGE = '#F4F7F9';

export default function ChangePasswordScreen({ navigation }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!currentPassword) {
      Alert.alert('Password', 'Enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Password', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert('Password', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiChangePassword({ currentPassword, newPassword });
      Alert.alert('Success', res.message, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Could not update', getApiMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="close" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Change Password</Text>
        <View className="h-10 w-10" />
      </View>

      <View className="flex-1 px-4 pt-6">
        <Input
          label="Current password"
          placeholder="Current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <Input
          label="New password"
          placeholder="New password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <Input
          label="Confirm new password"
          placeholder="Confirm password"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />
        <GradientButton variant="primary" loading={loading} onPress={() => void onSave()}>
          Update password
        </GradientButton>
      </View>
    </SafeAreaView>
  );
}

