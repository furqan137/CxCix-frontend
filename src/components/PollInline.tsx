import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { apiCastPollVote, type ApiComment, type ReplyPoll } from '../api/comments';
import { useAuthStore } from '../store/useAuthStore';
import { getApiMessage } from '../api/auth';
import { showToast } from '../utils/toast';

type Props = {
  postId: string;
  comment: ApiComment;
  poll: ReplyPoll;
  onVoted?: (updated: ApiComment) => void;
};

export function PollInline({ postId, comment, poll, onVoted }: Props) {
  const me = useAuthStore((s) => s.user);
  const meId = me?._id ? String(me._id) : '';
  const [local, setLocal] = useState(poll);
  const [busy, setBusy] = useState(false);

  const votedOptionId = useMemo(() => {
    const v = local.voters?.find((x) => String(x.user) === meId);
    return v?.optionId ?? null;
  }, [local.voters, meId]);

  const totalVotes = useMemo(
    () => local.options.reduce((s, o) => s + (typeof o.votes === 'number' ? o.votes : 0), 0),
    [local.options],
  );

  const vote = async (optionId: string) => {
    if (!meId || votedOptionId) return;
    setBusy(true);
    try {
      const updated = await apiCastPollVote(postId, comment._id, optionId);
      if (updated.replyMeta?.poll) setLocal(updated.replyMeta.poll);
      onVoted?.(updated);
      showToast('Vote recorded');
    } catch (e) {
      const msg = getApiMessage(e);
      if (msg.toLowerCase().includes('already')) {
        showToast('You already voted');
      } else {
        Alert.alert('Poll', msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      className="mt-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-3"
      style={{
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <Text className="text-sm font-bold" style={{ color: '#1A1A1B' }}>
        {local.question}
      </Text>
      {local.options.map((o) => {
        const votes = typeof o.votes === 'number' ? o.votes : 0;
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const selected = votedOptionId === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => void vote(o.id)}
            disabled={busy || !!votedOptionId}
            className="mt-2 overflow-hidden rounded-xl border border-slate-100 bg-[#FAFBFC]"
          >
            <View
              className="absolute bottom-0 left-0 top-0 bg-blue-100"
              style={{ width: `${pct}%` }}
            />
            <View className="flex-row items-center justify-between px-3 py-2.5">
              <Text className="flex-1 pr-2 text-sm font-medium text-slate-800">{o.text}</Text>
              <Text className="text-xs font-semibold text-slate-600">
                {pct}% · {votes}
              </Text>
              {selected ? <Ionicons name="checkmark-circle" size={18} color="#3B82F6" /> : null}
            </View>
          </Pressable>
        );
      })}
      {busy ? (
        <View className="mt-2 items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      ) : null}
    </View>
  );
}
