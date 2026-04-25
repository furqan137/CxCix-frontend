import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

import type { RewriteType } from '../services/aiService';

const ACTIONS = [
  { type: 'rewrite' as const, label: 'Rewrite reply', icon: 'create-outline' as const },
  { type: 'funny' as const, label: 'Make it funny', icon: 'happy-outline' as const },
  { type: 'serious' as const, label: 'Make it serious', icon: 'document-text-outline' as const },
  { type: 'short' as const, label: 'Shorten', icon: 'remove-outline' as const },
  { type: 'expand' as const, label: 'Expand', icon: 'add-outline' as const },
] satisfies { type: RewriteType; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: RewriteType) => void;
  loading?: boolean;
};

export function ReplyAISheet({ visible, onClose, onSelect, loading }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/45" onPress={onClose}>
        <Pressable
          className="rounded-t-3xl bg-white px-2 pb-10 pt-3"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="mb-3 items-center">
            <View className="mb-2 h-1 w-10 rounded-full bg-slate-200" />
            <Text className="text-base font-bold text-slate-900">AI helper</Text>
            <Text className="mt-1 px-4 text-center text-xs text-slate-500">
              Polishes your draft. Requires a Wavespeed-backed server.
            </Text>
          </View>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.type}
              disabled={loading}
              onPress={() => onSelect(a.type)}
              className="flex-row items-center border-b border-slate-100 px-4 py-3.5 active:bg-slate-50"
            >
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                <Ionicons name={a.icon} size={22} color="#4f46e5" />
              </View>
              <Text className="flex-1 text-[16px] font-semibold text-slate-800">{a.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </Pressable>
          ))}
          {loading ? (
            <View className="items-center py-4">
              <ActivityIndicator color="#6366f1" />
              <Text className="mt-2 text-sm text-slate-500">Working…</Text>
            </View>
          ) : null}
          <Pressable onPress={onClose} className="mt-2 items-center py-3">
            <Text className="font-semibold text-slate-500">Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
