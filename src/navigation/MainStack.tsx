import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AddCommentaryScreen from '../screens/main/AddCommentaryScreen';
import BlockedAccountsScreen from '../screens/main/BlockedAccountsScreen';
import CallScreen from '../screens/call/CallScreen';
import IncomingCallScreen from '../screens/call/IncomingCallScreen';
import ChatRequestsScreen from '../screens/main/ChatRequestsScreen';
import ChatThreadScreen from '../screens/main/ChatThreadScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import MutedAccountsScreen from '../screens/main/MutedAccountsScreen';
import ContactSupportScreen from '../screens/main/ContactSupportScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import EditPostScreen from '../screens/main/EditPostScreen';
import PostInsightsScreen from '../screens/main/PostInsightsScreen';
import AccountSecurityScreen from '../screens/main/AccountSecurityScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import LoginActivityScreen from '../screens/main/LoginActivityScreen';
import UpdateEmailScreen from '../screens/main/UpdateEmailScreen';
import UpdatePhoneScreen from '../screens/main/UpdatePhoneScreen';
import TwoFactorScreen from '../screens/main/TwoFactorScreen';
import PrivacySettingsScreen from '../screens/main/PrivacySettingsScreen';
import MentionsSettingsScreen from '../screens/main/MentionsSettingsScreen';
import TaggingPermissionsScreen from '../screens/main/TaggingPermissionsScreen';
import ConnectedAccountsScreen from '../screens/main/ConnectedAccountsScreen';
import DownloadDataScreen from '../screens/main/DownloadDataScreen';
import AccountDeletionScreen from '../screens/main/AccountDeletionScreen';
import AILabelsScreen from '../screens/main/AILabelsScreen';
import HelpFAQScreen from '../screens/main/HelpFAQScreen';
import HelpFAQDetailScreen from '../screens/main/HelpFAQDetailScreen';
import NotificationsSettingsScreen from '../screens/main/NotificationsSettingsScreen';
import QuietModeScreen from '../screens/main/QuietModeScreen';
import TermsOfServiceScreen from '../screens/main/legal/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/main/legal/PrivacyPolicyScreen';
import CommunityGuidelinesScreen from '../screens/main/legal/CommunityGuidelinesScreen';
import ImageViewerScreen from '../screens/main/ImageViewerScreen';
import MediaViewerScreen from '../screens/media/MediaViewerScreen';
import ReadCommentScreen from '../screens/main/ReadCommentScreen';
import ReportScreen from '../screens/main/ReportScreen';
import ReplyScreen from '../screens/main/ReplyScreen';
import SavedScreen from '../screens/main/SavedScreen';
import SearchScreen from '../screens/main/SearchScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import FollowConnectionsScreen from '../screens/main/FollowConnectionsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import ShiftPerspectiveScreen from '../screens/main/ShiftPerspectiveScreen';
import AIModeratorInsightsScreen from '../screens/main/AIModeratorInsightsScreen';
import { MainTabs } from './MainTabs';
import type { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * Post-auth shell: tabs + feed flows (Shift, commentary, compose, read).
 */
export function MainStackNavigator() {
  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="ShiftPerspective"
        component={ShiftPerspectiveScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="AddCommentary"
        component={AddCommentaryScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Reply" component={ReplyScreen} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="ReadComment" component={ReadCommentScreen} />
      <Stack.Screen name="Saved" component={SavedScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="PostInsights" component={PostInsightsScreen} />
      <Stack.Screen
        name="EditPost"
        component={EditPostScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="AIModeratorInsights" component={AIModeratorInsightsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AccountSecurity" component={AccountSecurityScreen} />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="LoginActivity" component={LoginActivityScreen} />
      <Stack.Screen name="UpdateEmail" component={UpdateEmailScreen} />
      <Stack.Screen name="UpdatePhone" component={UpdatePhoneScreen} />
      <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <Stack.Screen name="MentionsSettings" component={MentionsSettingsScreen} />
      <Stack.Screen name="TaggingPermissions" component={TaggingPermissionsScreen} />
      <Stack.Screen name="ConnectedAccounts" component={ConnectedAccountsScreen} />
      <Stack.Screen name="DownloadData" component={DownloadDataScreen} />
      <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
      <Stack.Screen name="AILabels" component={AILabelsScreen} />
      <Stack.Screen name="HelpFAQ" component={HelpFAQScreen} />
      <Stack.Screen name="HelpFAQDetail" component={HelpFAQDetailScreen} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
      <Stack.Screen name="QuietMode" component={QuietModeScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="CommunityGuidelines" component={CommunityGuidelinesScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="FollowConnections" component={FollowConnectionsScreen} />
      <Stack.Screen name="BlockedAccounts" component={BlockedAccountsScreen} />
      <Stack.Screen name="MutedAccounts" component={MutedAccountsScreen} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="ChatRequests" component={ChatRequestsScreen} />
      <Stack.Screen
        name="Call"
        component={CallScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="IncomingCall"
        component={IncomingCallScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
      <Stack.Screen
        name="ImageViewer"
        component={ImageViewerScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <Stack.Screen
        name="MediaViewer"
        component={MediaViewerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </Stack.Navigator>
    </>
  );
}
