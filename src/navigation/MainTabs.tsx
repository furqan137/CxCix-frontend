import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, View, Image, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import { BRAND_GRADIENT } from '../constants/brand';
import FeedScreen from '../screens/main/FeedScreen';
import ExploreScreen from '../screens/main/ExploreScreen';
import MessagingScreen from '../screens/main/MessagingScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import type { MainTabParamList } from './types';
import { apiGetUnreadCount } from '../api/notifications';
import { useAuthStore } from '../store/useAuthStore';
import { getMyChatParticipantId, subscribeUnreadDmCount } from '../services/chatService';

const Tab = createBottomTabNavigator<MainTabParamList>();

const INACTIVE = '#94a3b8';

export function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);
  const [unread, setUnread] = useState(0);
  const [unreadDms, setUnreadDms] = useState(0);

  const meChatId = getMyChatParticipantId(user);

  useEffect(() => {
    if (!isLoggedIn) {
      setUnread(0);
      return;
    }
    let alive = true;
    const tick = async () => {
      try {
        const c = await apiGetUnreadCount();
        if (alive) setUnread(c);
      } catch {
        /* ignore */
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !meChatId) {
      setUnreadDms(0);
      return;
    }
    return subscribeUnreadDmCount(meChatId, setUnreadDms);
  }, [isLoggedIn, meChatId]);

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
            <View style={{ width: 28, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={
                  focused
                    ? require('../../assets/icons/message-active.png')
                    : require('../../assets/icons/message.png')
                }
                style={{ width: 24, height: 24 }}
              />
              {unreadDms > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    right: -4,
                    top: -6,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 5,
                    borderRadius: 9,
                    backgroundColor: '#6366F1',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                    {unreadDms > 99 ? '99+' : String(unreadDms)}
                  </Text>
                </View>
              ) : null}
            </View>
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
            <View style={{ width: 28, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={
                  focused
                    ? require('../../assets/icons/bell-active.png')
                    : require('../../assets/icons/bell.png')
                }
                style={{ width: 24, height: 24 }}
              />
              {unread > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    right: -4,
                    top: -6,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 5,
                    borderRadius: 9,
                    backgroundColor: '#EF4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                    {unread > 99 ? '99+' : String(unread)}
                  </Text>
                </View>
              ) : null}
            </View>
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