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
  /** `postId` = post receiving the comment (same as Read Comment). `replyToHandle` optional; derived from post if omitted. */
  Reply: { postId: string; replyToHandle?: string; inReplyToCommentId?: string } | undefined;
  CreatePost: undefined;
  ReadComment: { postId?: string; variant?: 'standard' | 'shifted'; focusInput?: boolean } | undefined;
  /** `imageUri` for remote feed media; else bundled `mediaId` mock assets. */
  ImageViewer: { mediaId?: MediaId; imageUri?: string } | undefined;
  MediaViewer: {
    items: { url: string; resourceType: 'image' | 'video' | 'raw' }[];
    initialIndex?: number;
  };
  Saved: undefined;
  Search: { initialTab?: 'People' | 'Posts'; initialQuery?: string } | undefined;
  Report: { postId?: string } | undefined;
  PostInsights: { postId: string };
  EditPost: { postId: string };
  /** Your followers or following; following list supports Unfollow. */
  FollowConnections: { mode: 'followers' | 'following' };
  AIModeratorInsights: undefined;
  Settings: undefined;
  AccountSecurity: undefined;
  ChangePassword: undefined;
  LoginActivity: undefined;
  UpdateEmail: undefined;
  UpdatePhone: undefined;
  TwoFactor: undefined;
  PrivacySettings: undefined;
  MentionsSettings: undefined;
  TaggingPermissions: undefined;
  ConnectedAccounts: undefined;
  DownloadData: undefined;
  AccountDeletion: undefined;
  AILabels: undefined;
  HelpFAQ: undefined;
  HelpFAQDetail: { itemId: string } | undefined;
  NotificationsSettings: undefined;
  QuietMode: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  CommunityGuidelines: undefined;
  EditProfile: undefined;
  BlockedAccounts: undefined;
  MutedAccounts: undefined;
  /** DM thread — Firestore chat id uses `peerId` (Mongo user id). */
  ChatThread: {
    peerId: string;
    peerFirebaseUid?: string;
    name: string;
    handle: string;
    avatarUrl?: string;
    /** Fallback bundled avatar when no `avatarUrl`. */
    avatarKey?: ChatAvatarKey;
  };
  /** Another member’s profile — search → open → message request. */
  UserProfile: { userId: string };
  /** Pending message requests (accept → opens chat). */
  ChatRequests: undefined;
  /**
   * Daily.co room — from chat or after accepting an incoming call.
   * Not available in Expo Go; use a dev build.
   */
  Call: {
    roomUrl: string;
    callMode: 'video' | 'audio';
    displayName?: string;
    isCaller?: boolean;
  };
  /** FCM/Expo data payload: `type: incoming_call` → this screen, then `Call` on accept. */
  IncomingCall: {
    roomUrl: string;
    callerName: string;
    callMode: 'video' | 'audio';
    /** Mongo user id of caller (for “declined” / missed follow-up to caller). */
    callerUserId?: string;
  };
  ContactSupport: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  WelcomeOnboarding: undefined;
  AIModeratorIntro: { signupFlow?: boolean } | undefined;
  AIModerator: { signupFlow?: boolean } | undefined;
  Login: undefined;
  ForgotPassword: undefined;
  /** Reset token from email link (or dev API). User can also paste in the screen. */
  ResetPassword: { token?: string } | undefined;
  VerifyEmail: { email: string } | undefined;
  /** Legacy: Firebase email link flow (deprecated) */
  CheckEmail: { email: string; linkOpened?: boolean } | undefined;
  CreateAccount: undefined;
  SignupStepName: undefined;
  SignupSecurity: undefined;
  SignupProfile: undefined;
  AccountCreated: undefined;
  /** Logged-in shell: tabs + modals. */
  Main: NavigatorScreenParams<MainStackParamList> | undefined;
};
