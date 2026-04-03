import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

import { BottomSheetModal } from '../ui/BottomSheetModal';

/* ================= COLORS ================= */

const CANCEL_GRADIENT = ['#5B7FFF', '#8B5CF6', '#DDB363'] as const;

const ICON_BG = '#EEF2FF';
const ICON_COLOR = '#3B82F6';

const DANGER_BG = '#FDECEC';
const DANGER_COLOR = '#EF4444';

const TEXT_MAIN = '#0F172A';
const TEXT_SECONDARY = '#475569';

/* ================= ROW ================= */

function Row({ icon, label, danger, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      
      {/* ICON */}
      <View style={[
        styles.iconBox,
        danger && { backgroundColor: '#FDECEC' }
      ]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? '#EF4444' : '#3B82F6'}
        />
      </View>

      {/* TEXT */}
      <Text style={[
        styles.label,
        danger && { color: '#EF4444' }
      ]}>
        {label}
      </Text>

    </Pressable>
  );
}

/* ================= MAIN ================= */

export function PostActionsSheet({
  visible,
  onClose,
  variant,
  postHandle = '@username',
  onReport,
  onDelete,
}: any) {
  const target = postHandle.startsWith('@')
    ? postHandle
    : `@${postHandle}`;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      maxHeightRatio={0.88}
      topBorderRadius={32}
      handleWidth={42}
      handleHeight={5}
    >
      <View style={styles.container}>

        {/* CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          <Text style={styles.title}>Post Action</Text>

          {variant === 'own' ? (
            <>
              <View style={styles.group}>
                <Row icon="pin-outline" label="Pin to profile" />
                <Row icon="bar-chart-outline" label="View post insights" />
                <Row icon="create-outline" label="Edit post" />
                <Row icon="share-social-outline" label="Share" />
                <Row icon="link-outline" label="Copy link" />
              </View>

              <View style={styles.divider} />

              <Row
                icon="trash-outline"
                label="Delete post"
                danger
                onPress={onDelete}
              />
            </>
          ) : (
            <>
              <View style={styles.group}>
                <Row icon="share-social-outline" label="Share" />
                <Row icon="link-outline" label="Copy link" />
                <Row icon="eye-off-outline" label="Don’t want to see this post" />
              </View>

              <View style={styles.divider} />

              <Text style={styles.section}>Conversation Controls</Text>

              <View style={styles.groupSmall}>
                <Row icon="eye-off-outline" label="Hide this post" />
                <Row icon="notifications-off-outline" label={`Mute ${target}`} />
                <Row icon="ban-outline" label={`Block ${target}`} />
              </View>

              <View style={styles.divider} />

              <Text style={styles.section}>Safety</Text>

              <View style={styles.groupSmall}>
                <Row
                  icon="warning-outline"
                  label="Report..."
                  danger
                  onPress={onReport}
                />
              </View>
            </>
          )}

        </ScrollView>

        {/* 🔥 ALWAYS SHOW CANCEL (FIXED) */}
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
    height: '100%',        // ✅ IMPORTANT
    justifyContent: 'space-between', // ✅ pushes footer down
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
    flexDirection: 'row',        // ✅ MUST
    alignItems: 'center',        // ✅ vertical center
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
    textAlignVertical: 'center', // ✅ FIX alignment
  },

  dangerText: {
    color: DANGER_COLOR,
    fontWeight: '600',
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