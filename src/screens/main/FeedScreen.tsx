import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '../../components/feed/PostCard';
import { ShiftedPostCard } from '../../components/feed/ShiftedPostCard';
import { MoodBridgesSheet } from '../../components/sheets/MoodBridgesSheet';
import { PostActionsSheet } from '../../components/sheets/PostActionsSheet';
import { SaveBookmarkSheet } from '../../components/sheets/SaveBookmarkSheet';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { BRAND_GRADIENT } from '../../constants/brand';
import { Images } from '../../constants/images';
import type { MediaId } from '../../constants/mediaMap';
import { MOOD_LABELS } from '../../constants/moods';
import type { MainStackParamList } from '../../navigation/types';
import { useMoodStore } from '../../store/useMoodStore';

const PAGE = '#F8FAFC';

/** Logged-in user — own posts get Pin/Edit/Delete; everyone else gets Share/Mute/Report. */
const CURRENT_USER_HANDLE = '@wade_warren';

/** Default home = standard posts only (no “Shifted original post” banner). */
const INCLUDE_SHIFTED_FEED = true;

type StandardPost = {
  id: string;
  author: string;
  handle: string;
  timeLabel: string;
  body: string;
  image: ImageSourcePropType;
  avatar: ImageSourcePropType;
  mediaId: MediaId;
  comments: string;
  likes: string;
  views: string;
};

const FEED_POSTS: StandardPost[] = [
  {
    id: '1',
    author: 'Elena Fisher',
    handle: '@elenadesign',
    timeLabel: '2h',
    body: 'Taking a moment to breathe today. The world is quiet and everything feels aligned. Sending peace to everyone on the timeline. 🌿',
    image: Images.feedPost1,
    avatar: Images.avatarSplit,
    mediaId: 'dock',
    comments: '7.50k',
    likes: '24.4k',
    views: '900K',
  },
  {
    id: '2',
    author: 'Jane Cooper',
    handle: '@janecooper',
    timeLabel: '4h',
    body: 'Weekend mode: hammock, shade, and a book that actually slows you down.',
    image: Images.feedPost2,
    avatar: Images.avatarWade,
    mediaId: 'hammock',
    comments: '2.1k',
    likes: '15.2k',
    views: '340K',
  },
  {
    id: '3',
    author: 'Alex Rivers',
    handle: '@alexrivers',
    timeLabel: '5h',
    body: 'Finding stillness before the week picks up. Small rituals — tea, quiet light, no scroll for an hour.',
    image: Images.feedPost3,
    avatar: Images.avatarSplit,
    mediaId: 'calm',
    comments: '1.2k',
    likes: '8.1k',
    views: '120K',
  },
  {
    id: '4',
    author: 'Wade Warren',
    handle: CURRENT_USER_HANDLE,
    timeLabel: '1d',
    body: 'Sharing a frame that actually feels like “calm” — blues and greens, no noise.',
    image: Images.feedPost2,
    avatar: Images.avatarWade,
    mediaId: 'hammock',
    comments: '412',
    likes: '3.4k',
    views: '45K',
  },
];

/**
 * Home feed — mood pill, standard posts (default); optional shifted block.
 * Tap post → Read Comment; Shift → Shift perspective (separate flows).
 */
export default function FeedScreen() {
  const navigation = useNavigation();
  const currentMood = useMoodStore((s) => s.currentMood);
  const setMood = useMoodStore((s) => s.setMood);
  const [moodSheetOpen, setMoodSheetOpen] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsVariant, setActionsVariant] = useState<'own' | 'other'>('other');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionsPostId, setActionsPostId] = useState<string>('1');
  const [actionsPostHandle, setActionsPostHandle] = useState<string>('@username');

  const stackNav = useCallback(() => {
    return navigation.getParent() as
      | { navigate: (name: keyof MainStackParamList, params?: object) => void }
      | undefined;
  }, [navigation]);

  const openShift = useCallback(
    (postId: string) => {
      stackNav()?.navigate('ShiftPerspective', { postId });
    },
    [stackNav],
  );

  const openRead = useCallback(
    (postId: string, variant: 'standard' | 'shifted' = 'standard') => {
      stackNav()?.navigate('ReadComment', { postId, variant });
    },
    [stackNav],
  );

  const openImage = useCallback(
    (mediaId: MediaId) => {
      stackNav()?.navigate('ImageViewer', { mediaId });
    },
    [stackNav],
  );

  const openCreate = useCallback(() => {
    stackNav()?.navigate('CreatePost');
  }, [stackNav]);

  const onMoodPress = () => {
    setMoodSheetOpen(true);
  };

  const openActions = (postId: string, variant: 'own' | 'other', postHandle?: string) => {
    setActionsPostId(postId);
    setActionsVariant(variant);
    setActionsPostHandle(postHandle ?? '@username');
    setActionsOpen(true);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-4 pb-3 pt-1">
          <Image
            source={Images.logoHeader}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
            accessibilityLabel="CxCix"
          />
          <Pressable onPress={onMoodPress} className="flex-1 items-center px-2">
            <LinearGradient
              colors={['#6366F1', '#FDE047']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                borderRadius: 9999,
                paddingHorizontal: 18,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text className="text-sm font-bold text-slate-900">
                You are in {MOOD_LABELS[currentMood]}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#0f172a" />
            </LinearGradient>
          </Pressable>
          <Pressable
            accessibilityLabel="Settings"
            onPress={() => stackNav()?.navigate('Settings')}
            className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
          >
            <Ionicons name="settings-outline" size={20} color="#334155" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {INCLUDE_SHIFTED_FEED ? (
            <>
              <View className="mb-3 flex-row items-center rounded-2xl bg-sky-100 px-3 py-2.5">
                <Ionicons name="checkmark-circle" size={20} color="#0284c7" />
                <Text className="ml-2 flex-1 text-sm font-semibold text-sky-900">
                  Shifted original post
                </Text>
              </View>
              <ShiftedPostCard
                author="Wade Warren"
                handle="@wade_warren"
                timeLabel="2h"
                avatar={Images.avatarWade}
                perspectiveLabel="Advice"
                bodyLead="If you're finding it hard to reach this state of calm, try setting your"
                bodyAfterLink=" intensity slider to 20% for a few hours — then ease back up as the feed feels lighter."
                nested={{
                  author: 'Elena Fisher',
                  handle: '@elenadesign',
                  timeLabel: '2h',
                  body: 'Taking a moment to breathe today. The world is quiet and everything feels aligned. Sending peace to everyone on the timeline. 🌿',
                  image: Images.feedPost1,
                  avatar: Images.avatarSplit,
                }}
                comments="7.50k"
                likes="24.4k"
                views="900K"
                onPressCard={() => openRead('shifted-wade', 'shifted')}
                onPressNestedImage={() => openImage('dock')}
                onPressAiModerator={() => stackNav()?.navigate('AIModeratorInsights')}
                onShift={() => openShift('shifted-wade')}
                onBookmark={() => setBookmarkOpen(true)}
                onMore={() => openActions('shifted-wade', 'own', CURRENT_USER_HANDLE)}
              />
            </>
          ) : null}

          {FEED_POSTS.map((p) => (
            <PostCard
              key={p.id}
              author={p.author}
              handle={p.handle}
              timeLabel={p.timeLabel}
              body={p.body}
              image={p.image}
              avatar={p.avatar}
              comments={p.comments}
              likes={p.likes}
              views={p.views}
              onShift={() => openShift(p.id)}
              onOpenPost={() => openRead(p.id, 'standard')}
              onPressImage={() => openImage(p.mediaId)}
              onBookmark={() => setBookmarkOpen(true)}
              onMore={() =>
                openActions(
                  p.id,
                  p.handle === CURRENT_USER_HANDLE ? 'own' : 'other',
                  p.handle,
                )
              }
            />
          ))}
        </ScrollView>

        <Pressable
          accessibilityLabel="Create post"
          onPress={openCreate}
          className="absolute"
          style={{ bottom: 100, right: 20 }}
        >
          <LinearGradient
            colors={[...BRAND_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#4c1d95',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Image
              source={Images.addPostFab}
              style={{ width: 85, height: 90 }}
              
              accessibilityLabel="Add post"
            />
          </LinearGradient>
        </Pressable>

        <MoodBridgesSheet
          visible={moodSheetOpen}
          onClose={() => setMoodSheetOpen(false)}
          currentMood={currentMood}
          onSwitchMood={(m) => setMood(m)}
        />
        <SaveBookmarkSheet visible={bookmarkOpen} onClose={() => setBookmarkOpen(false)} />
        <PostActionsSheet
          key={`${actionsPostId}-${actionsVariant}-${actionsPostHandle}`}
          visible={actionsOpen}
          onClose={() => setActionsOpen(false)}
          variant={actionsVariant}
          postHandle={actionsPostHandle}
          onReport={() => {
            setActionsOpen(false);
            stackNav()?.navigate('Report', { postId: actionsPostId });
          }}
          onDelete={() => {
            setActionsOpen(false);
            setDeleteOpen(true);
          }}
        />
        <ConfirmDialog
          visible={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete?"
          message="This can’t be undone."
          primaryLabel="Delete"
          onPrimary={() => setDeleteOpen(false)}
          icon={<Ionicons name="trash-outline" size={22} color="#6366F1" />}
        />
      </View>
    </SafeAreaView>
  );
}
