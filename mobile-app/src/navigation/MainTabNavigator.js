import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { HomeIcon, CollectionsIcon, ExpensesIcon, ReceiptsIcon, MandalIcon } from '../components/TabIcons';

import DashboardScreen from '../screens/DashboardScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function renderTabIcon(routeName, isFocused) {
  const color = isFocused ? '#F97316' : '#64748B';
  const size = 20;

  switch (routeName) {
    case 'HomeTab':
      return <HomeIcon size={size} color={color} isFocused={isFocused} />;
    case 'CollectionsTab':
      return <CollectionsIcon size={size} color={color} isFocused={isFocused} />;
    case 'ExpensesTab':
      return <ExpensesIcon size={size} color={color} isFocused={isFocused} />;
    case 'ReceiptsTab':
      return <ReceiptsIcon size={size} color={color} isFocused={isFocused} />;
    case 'ProfileTab':
      return <MandalIcon size={size} color={color} isFocused={isFocused} />;
    default:
      return <HomeIcon size={size} color={color} isFocused={isFocused} />;
  }
}

import { useLanguage } from '../context/LanguageContext';

function FloatingTabBar({ state, descriptors, navigation }) {
  const { t } = useLanguage();

  const getTabLabel = (routeName) => {
    switch (routeName) {
      case 'HomeTab':
        return t('nav.home');
      case 'CollectionsTab':
        return t('nav.collections');
      case 'ExpensesTab':
        return t('nav.expenses');
      case 'ReceiptsTab':
        return t('nav.receipts');
      case 'ProfileTab':
        return t('nav.mandal');
      default:
        return routeName;
    }
  };

  return (
    <View style={styles.floatingBarContainer}>
      <View style={styles.floatingBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = getTabLabel(route.name);

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
                <Text style={styles.tabLabelFocused} numberOfLines={1}>{label}</Text>
              ) : (
                <Text style={styles.tabLabelUnfocused} numberOfLines={1}>{label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabNavigator() {
  const { t } = useLanguage();

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
          title: t('nav.home'),
          headerTitle: t('nav.appTitle'),
        }} 
      />
      <Tab.Screen 
        name="CollectionsTab" 
        component={CollectionsScreen} 
        options={{ 
          title: t('nav.collections'),
          headerTitle: t('collections.title'),
        }} 
      />
      <Tab.Screen 
        name="ExpensesTab" 
        component={ExpensesScreen} 
        options={{ 
          title: t('nav.expenses'),
          headerTitle: t('expenses.title'),
        }} 
      />
      <Tab.Screen 
        name="ReceiptsTab" 
        component={ReceiptsScreen} 
        options={{ 
          title: t('nav.receipts'),
          headerTitle: t('nav.donationReceipts'),
        }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ 
          title: t('nav.mandal'),
          headerTitle: t('nav.profile'),
        }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  floatingBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 10,
    left: 10,
    right: 10,
    backgroundColor: 'transparent',
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 4,
    paddingVertical: 6,
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
    borderRadius: 18,
    minWidth: 44,
  },
  tabItemFocused: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E7',
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 4,
  },
  tabItemUnfocused: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 5,
    gap: 2,
  },
  tabIcon: {
    fontSize: 17,
  },
  tabIconFocused: {
    fontSize: 17,
  },
  tabLabelFocused: {
    color: '#F97316',
    fontWeight: '800',
    fontSize: 11.5,
    letterSpacing: -0.2,
  },
  tabLabelUnfocused: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 9.5,
  },
});
