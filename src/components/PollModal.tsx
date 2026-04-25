import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { ReplyPoll } from '../api/comments';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (poll: ReplyPoll) => void;
  initial?: ReplyPoll | null;
};

export function PollModal({ visible, onClose, onConfirm, initial }: Props) {
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [opt1, setOpt1] = useState(initial?.options?.[0]?.text ?? '');
  const [opt2, setOpt2] = useState(initial?.options?.[1]?.text ?? '');
  const [extra, setExtra] = useState<string[]>(() => {
    const rest = initial?.options?.slice(2).map((o) => o.text) ?? [];
    return rest.length ? rest : [];
  });

  const reset = useCallback(() => {
    setQuestion(initial?.question ?? '');
    setOpt1(initial?.options?.[0]?.text ?? '');
    setOpt2(initial?.options?.[1]?.text ?? '');
    const rest = initial?.options?.slice(2).map((o) => o.text) ?? [];
    setExtra(rest.length ? rest : []);
  }, [initial]);

  const addOption = () => {
    if (opt1.trim().length + opt2.trim().length === 0 && extra.length === 0) {
      Alert.alert('Poll', 'Add at least two options.');
      return;
    }
    if (2 + extra.length >= 8) {
      Alert.alert('Poll', 'Maximum 8 options.');
      return;
    }
    setExtra((x) => [...x, '']);
  };

  const submit = () => {
    const q = question.trim();
    const o1 = opt1.trim();
    const o2 = opt2.trim();
    const more = extra.map((t) => t.trim()).filter(Boolean);
    if (!q) {
      Alert.alert('Poll', 'Enter a question.');
      return;
    }
    if (!o1 || !o2) {
      Alert.alert('Poll', 'Add at least two options.');
      return;
    }
    const options = [o1, o2, ...more].map((text) => ({ id: '', text, votes: 0 }));
    onConfirm({ question: q, options });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/40"
      >
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Dismiss poll modal" />
        <View className="max-h-[88%] rounded-t-3xl bg-white px-4 pb-8 pt-3">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-900">Create poll</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={26} color="#64748b" />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text className="mb-1 text-xs font-semibold uppercase text-slate-500">Question</Text>
            <TextInput
              className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[16px] text-slate-900"
              placeholder="Ask something…"
              placeholderTextColor="#94a3b8"
              value={question}
              onChangeText={setQuestion}
              maxLength={500}
            />
            <Text className="mb-1 text-xs font-semibold uppercase text-slate-500">Options</Text>
            <TextInput
              className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[16px] text-slate-900"
              placeholder="Option 1"
              placeholderTextColor="#94a3b8"
              value={opt1}
              onChangeText={setOpt1}
            />
            <TextInput
              className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[16px] text-slate-900"
              placeholder="Option 2"
              placeholderTextColor="#94a3b8"
              value={opt2}
              onChangeText={setOpt2}
            />
            {extra.map((t, i) => (
              <TextInput
                key={`e-${i}`}
                className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[16px] text-slate-900"
                placeholder={`Option ${i + 3}`}
                placeholderTextColor="#94a3b8"
                value={t}
                onChangeText={(v) =>
                  setExtra((prev) => {
                    const copy = [...prev];
                    copy[i] = v;
                    return copy;
                  })
                }
              />
            ))}
            <Pressable onPress={addOption} className="mb-4 self-start rounded-full bg-slate-100 px-4 py-2">
              <Text className="text-sm font-semibold text-indigo-600">+ Add option</Text>
            </Pressable>
          </ScrollView>
          <View className="mt-2 flex-row gap-2">
            <Pressable
              onPress={() => {
                reset();
                onClose();
              }}
              className="flex-1 items-center rounded-2xl border border-slate-200 py-3.5"
            >
              <Text className="font-semibold text-slate-600">Cancel</Text>
            </Pressable>
            <Pressable onPress={submit} className="flex-1 items-center rounded-2xl bg-indigo-600 py-3.5">
              <Text className="font-bold text-white">Attach poll</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
