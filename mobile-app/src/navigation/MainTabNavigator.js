import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { HomeIcon, ReceiptsIcon, ChatIcon, MandalIcon } from '../components/TabIcons';

import DashboardScreen from '../screens/DashboardScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function renderTabIcon(routeName, isFocused) {
  const color = isFocused ? '#F97316' : '#64748B';
  const size = 20;

  switch (routeName) {
    case 'HomeTab':
      return <HomeIcon size={size} color={color} isFocused={isFocused} />;
    case 'ReceiptsTab':
      return <ReceiptsIcon size={size} color={color} isFocused={isFocused} />;
    case 'ChatTab':
      return <ChatIcon size={size} color={color} isFocused={isFocused} />;
    case 'ProfileTab':
      return <MandalIcon size={size} color={color} isFocused={isFocused} />;
    default:
      return <HomeIcon size={size} color={color} isFocused={isFocused} />;
  }
}

const TAB_CONFIG = {
  HomeTab: { label: 'Home' },
  ReceiptsTab: { label: 'Receipts' },
  ChatTab: { label: 'Committee' },
  ProfileTab: { label: 'Mandal' },
};

function FloatingTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.floatingBarContainer}>
      <View style={styles.floatingBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || { label: route.name };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={[
                styles.tabItem,
                isFocused ? styles.tabItemFocused : styles.tabItemUnfocused
              ]}
              activeOpacity={0.78}
            >
              {renderTabIcon(route.name, isFocused)}
              {isFocused ? (
                <Text style={styles.tabLabelFocused}>{config.label}</Text>
              ) : (
                <Text style={styles.tabLabelUnfocused}>{config.label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(23, 37, 84, 0.05)',
          height: Platform.OS === 'ios' ? 92 : 64,
        },
        headerTintColor: '#172554',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: '#172554',
          letterSpacing: -0.3,
        },
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={DashboardScreen} 
        options={{ 
          title: 'Home',
          headerTitle: 'Apla Mandal 🪔',
        }} 
      />
      <Tab.Screen 
        name="ReceiptsTab" 
        component={ReceiptsScreen} 
        options={{ 
          title: 'Receipts',
          headerTitle: 'Donation Receipts',
        }} 
      />
      <Tab.Screen 
        name="ChatTab" 
        component={ChatScreen} 
        options={{ 
          title: 'Committee',
          headerTitle: 'Committee Chat',
        }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ 
          title: 'Mandal',
          headerTitle: 'Mandal Profile',
        }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  floatingBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 12,
    left: 14,
    right: 14,
    backgroundColor: 'transparent',
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 8,
    paddingVertical: 8,
    height: 66,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.06)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabItemFocused: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  tabItemUnfocused: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 2,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabIconFocused: {
    fontSize: 18,
  },
  tabLabelFocused: {
    color: '#F97316',
    fontWeight: '800',
    fontSize: 12.5,
    letterSpacing: -0.2,
  },
  tabLabelUnfocused: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 10.5,
  },
});
