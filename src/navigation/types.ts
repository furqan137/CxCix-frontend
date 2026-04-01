import type { NavigatorScreenParams } from '@react-navigation/native';

import type { MediaId } from '../constants/mediaMap';

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
  ReadComment: { postId?: string } | undefined;
  ImageViewer: { mediaId: MediaId } | undefined;
  Saved: undefined;
  Search: undefined;
  Report: { postId?: string } | undefined;
  AIModeratorInsights: undefined;
  Settings: undefined;
  BlockedAccounts: undefined;
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
