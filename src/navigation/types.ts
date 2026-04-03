import type { NavigatorScreenParams } from '@react-navigation/native';

import type { MediaId } from '../constants/mediaMap';

/** Avatars for ChatThread (see `ChatThreadScreen` map) */
export type ChatAvatarKey =
  | 'annette'
  | 'alex'
  | 'sarah'
  | 'wade'
  | 'ralph'
  | 'eleanor'
  | 'marvin';

export type MainTabParamList = {
  Home: undefined;
  Messages: undefined;
  Compass: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ShiftPerspective: { postId?: string } | undefined;
  AddCommentary: { postId?: string; perspectiveLabel: string } | undefined;
  Reply: { postId?: string; replyToHandle?: string } | undefined;
  CreatePost: undefined;
  ReadComment: { postId?: string; variant?: 'standard' | 'shifted' } | undefined;
  ImageViewer: { mediaId: MediaId } | undefined;
  Saved: undefined;
  Search: undefined;
  Report: { postId?: string } | undefined;
  AIModeratorInsights: undefined;
  Settings: undefined;
  BlockedAccounts: undefined;
  MutedAccounts: undefined;
  /** DM thread — `avatarKey` maps to bundled avatar in screen */
  ChatThread: {
    peerId: string;
    name: string;
    handle: string;
    avatarKey: ChatAvatarKey;
  };
  ContactSupport: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  WelcomeOnboarding: undefined;
  AIModeratorIntro: undefined;
  AIModerator: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
};
