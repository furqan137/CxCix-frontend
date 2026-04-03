import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRAND_GRADIENT } from '../constants/brand';
import FeedScreen from '../screens/main/FeedScreen';
import ExploreScreen from '../screens/main/ExploreScreen';
import MessagingScreen from '../screens/main/MessagingScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const INACTIVE = '#94a3b8';

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 64 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: '#ffffff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          elevation: 16,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {/* HOME */}
      <Tab.Screen
        name="Home"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('../../assets/icons/home-active.png')
                  : require('../../assets/icons/home.png')
              }
              style={{ width: 24, height: 24 }}
            />
          ),
        }}
      />

      {/* MESSAGES */}
      <Tab.Screen
        name="Messages"
        component={MessagingScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('../../assets/icons/message-active.png')
                  : require('../../assets/icons/message.png')
              }
              style={{ width: 24, height: 24 }}
            />
          ),
        }}
      />

      {/* CENTER */}
  {/* CENTER */}
<Tab.Screen
  name="Compass"
  component={ExploreScreen}
  options={{
    tabBarLabel: '',
    tabBarIcon: () => (
      <View
        style={{
          marginBottom: Platform.OS === 'ios' ? 30 : 24, // 🔥 FIXED
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LinearGradient
          colors={[...BRAND_GRADIENT]}
          style={{
            width: 60,
            height: 60,
            borderRadius: 32,
            alignItems: 'center',
            justifyContent: 'center',
    
            shadowColor: '#4c1d95',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 12,
          }}
        >
          <Image
            source={require('../../assets/icons/compass.png')}
      
          />
        </LinearGradient>
      </View>
    
    ),
  }}
/>

      {/* NOTIFICATIONS */}
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('../../assets/icons/bell-active.png')
                  : require('../../assets/icons/bell.png')
              }
              style={{ width: 24, height: 24 }}
            />
          ),
        }}
      />

      {/* PROFILE */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('../../assets/icons/profile-active.png')
                  : require('../../assets/icons/profile.png')
              }
              style={{ width: 24, height: 24 }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}