import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AddCommentaryScreen from '../screens/main/AddCommentaryScreen';
import BlockedAccountsScreen from '../screens/main/BlockedAccountsScreen';
import ChatThreadScreen from '../screens/main/ChatThreadScreen';
import MutedAccountsScreen from '../screens/main/MutedAccountsScreen';
import ContactSupportScreen from '../screens/main/ContactSupportScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import ImageViewerScreen from '../screens/main/ImageViewerScreen';
import ReadCommentScreen from '../screens/main/ReadCommentScreen';
import ReportScreen from '../screens/main/ReportScreen';
import ReplyScreen from '../screens/main/ReplyScreen';
import SavedScreen from '../screens/main/SavedScreen';
import SearchScreen from '../screens/main/SearchScreen';
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
      <Stack.Screen name="AIModeratorInsights" component={AIModeratorInsightsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="BlockedAccounts" component={BlockedAccountsScreen} />
      <Stack.Screen name="MutedAccounts" component={MutedAccountsScreen} />
      <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
      <Stack.Screen name="ContactSupport" component={ContactSupportScreen} />
      <Stack.Screen
        name="ImageViewer"
        component={ImageViewerScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}
