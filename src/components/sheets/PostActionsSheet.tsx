import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

import { BottomSheetModal } from '../ui/BottomSheetModal';

/* ================= COLORS ================= */

const CANCEL_GRADIENT = ['#5B7FFF', '#8B5CF6', '#DDB363'] as const;

const TEXT_MAIN = '#0F172A';

/* ================= ROW ================= */

function Row({
  icon,
  label,
  danger,
  onPress,
  loading,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const dim = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={dim || !onPress}
      style={[styles.row, dim && { opacity: 0.5 }]}
    >
      <View style={[styles.iconBox, danger && { backgroundColor: '#FDECEC' }]}>
        {loading ? (
          <ActivityIndicator size="small" color={danger ? '#EF4444' : '#3B82F6'} />
        ) : (
          <Ionicons
            name={icon}
            size={20}
            color={danger ? '#EF4444' : '#3B82F6'}
          />
        )}
      </View>
      <Text style={[styles.label, danger && { color: '#EF4444' }]}>{label}</Text>
    </Pressable>
  );
}

export type PostActionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  variant: 'own' | 'other';
  postId: string;
  postHandle?: string;
  /** Own post — from API `pinnedToProfile` */
  isPinned?: boolean;
  pinBusy?: boolean;
  onReport?: () => void;
  onDelete?: () => void;
  onPinToggle?: () => void;
  onViewInsights?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onCopyLink?: () => void;
  /** Other’s post — server-backed hide from Home / Explore / Search. */
  onHidePost?: () => void;
  onMuteUser?: () => void;
  onBlockUser?: () => void;
  hideBusy?: boolean;
};

/* ================= MAIN ================= */

export function PostActionsSheet({
  visible,
  onClose,
  variant,
  postId,
  postHandle = '@username',
  isPinned = false,
  pinBusy = false,
  onReport,
  onDelete,
  onPinToggle,
  onViewInsights,
  onEdit,
  onShare,
  onCopyLink,
  onHidePost,
  onMuteUser,
  onBlockUser,
  hideBusy = false,
}: PostActionsSheetProps) {
  const target = postHandle.startsWith('@') ? postHandle : `@${postHandle}`;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      maxHeightRatio={0.88}
      topBorderRadius={32}
      handleWidth={42}
      handleHeight={5}
    >
      <View style={styles.container} accessibilityLabel={`Post actions ${postId}`}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>Post Actions</Text>

          {variant === 'own' ? (
            <>
              <View style={styles.group}>
                <Row
                  icon={isPinned ? 'pin' : 'pin-outline'}
                  label={isPinned ? 'Unpin from profile' : 'Pin to profile'}
                  onPress={onPinToggle}
                  loading={pinBusy}
                  disabled={pinBusy}
                />
                <Row icon="bar-chart-outline" label="View post insights" onPress={onViewInsights} />
                <Row icon="create-outline" label="Edit post" onPress={onEdit} />
                <Row icon="share-social-outline" label="Share" onPress={onShare} />
                <Row icon="link-outline" label="Copy link" onPress={onCopyLink} />
              </View>

              <View style={styles.divider} />

              <Row icon="trash-outline" label="Delete post" danger onPress={onDelete} />
            </>
          ) : (
            <>
              <View style={styles.group}>
                <Row icon="share-social-outline" label="Share" onPress={onShare} />
                <Row icon="link-outline" label="Copy link" onPress={onCopyLink} />
                <Row
                  icon="eye-off-outline"
                  label="Don’t want to see this post"
                  onPress={onHidePost}
                  loading={hideBusy}
                  disabled={hideBusy}
                />
              </View>

              <View style={styles.divider} />

              <Text style={styles.section}>Conversation Controls</Text>

              <View style={styles.groupSmall}>
                <Row
                  icon="eye-off-outline"
                  label="Hide this post"
                  onPress={onHidePost}
                  loading={hideBusy}
                  disabled={hideBusy}
                />
                <Row
                  icon="notifications-off-outline"
                  label={`Mute ${target}`}
                  onPress={onMuteUser}
                />
                <Row icon="ban-outline" label={`Block ${target}`} onPress={onBlockUser} />
              </View>

              <View style={styles.divider} />

              <Text style={styles.section}>Safety</Text>

              <View style={styles.groupSmall}>
                <Row icon="warning-outline" label="Report..." danger onPress={onReport} />
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={onClose} style={styles.cancelWrap}>
            <LinearGradient
              colors={CANCEL_GRADIENT}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </BottomSheetModal>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    height: '100%',
    justifyContent: 'space-between',
  },

  scrollContent: {
    paddingBottom: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 10,
  },

  section: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MAIN,
  },

  group: {
    gap: 6,
  },

  groupSmall: {
    gap: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    marginLeft: 14,
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
    textAlignVertical: 'center',
    flex: 1,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5EAF1',
    marginVertical: 14,
  },

  footer: {
    paddingTop: 10,
    paddingBottom: 6,
  },

  cancelWrap: {
    borderRadius: 999,
    overflow: 'hidden',
  },

  cancel: {
    paddingVertical: 16,
    alignItems: 'center',
  },

  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
