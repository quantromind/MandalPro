import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { HomeIcon, CollectionsIcon, ExpensesIcon, ReceiptsIcon, MandalIcon } from '../components/TabIcons';
import { useLanguage } from '../context/LanguageContext';

import DashboardScreen from '../screens/DashboardScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAB_ROUTES = [
  { name: 'HomeTab',        labelKey: 'nav.home',       Icon: HomeIcon },
  { name: 'CollectionsTab', labelKey: 'nav.collections', Icon: CollectionsIcon },
  { name: 'ExpensesTab',    labelKey: 'nav.expenses',    Icon: ExpensesIcon },
  { name: 'ReceiptsTab',    labelKey: 'nav.receipts',    Icon: ReceiptsIcon },
  { name: 'ProfileTab',     labelKey: 'nav.mandal',      Icon: MandalIcon },
];

function FloatingTabBar({ state, descriptors, navigation }) {
  const { t } = useLanguage();

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.floatingBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tabDef = TAB_ROUTES.find((r) => r.name === route.name);
          const label = t(tabDef?.labelKey || 'nav.home');
          const Icon = tabDef?.Icon || HomeIcon;

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
              accessibilityLabel={options.tabBarAccessibilityLabel || label}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.72}
            >
              {/* Active glow pill behind icon */}
              {isFocused && <View style={styles.activePill} />}

              {/* Icon */}
              <View style={styles.iconWrap}>
                <Icon size={21} color={isFocused ? '#F97316' : '#94A3B8'} isFocused={isFocused} />
              </View>

              {/* Label */}
              <Text
                style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}
                numberOfLines={1}
              >
                {label}
              </Text>

              {/* Active dot indicator */}
              {isFocused && <View style={styles.activeDot} />}
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
        options={{ title: t('nav.home'), headerTitle: t('nav.appTitle') }}
      />
      <Tab.Screen
        name="CollectionsTab"
        component={CollectionsScreen}
        options={{ title: t('nav.collections'), headerTitle: t('collections.title') }}
      />
      <Tab.Screen
        name="ExpensesTab"
        component={ExpensesScreen}
        options={{ title: t('nav.expenses'), headerTitle: t('expenses.title') }}
      />
      <Tab.Screen
        name="ReceiptsTab"
        component={ReceiptsScreen}
        options={{ title: t('nav.receipts'), headerTitle: t('nav.donationReceipts') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: t('nav.mandal'), headerTitle: t('nav.profile') }}
      />
    </Tab.Navigator>
  );
}

const BAR_HEIGHT = 68;
const ITEM_WIDTH = (SCREEN_WIDTH - 32) / 5; // 5 tabs, bar has 16px margin each side

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 12,
    left: 16,
    right: 16,
    backgroundColor: 'transparent',
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: BAR_HEIGHT,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(23, 37, 84, 0.07)',
    shadowColor: '#172554',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 14,
    // subtle top highlight line
    overflow: 'hidden',
  },

  /* ── Each Tab Item ── */
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_HEIGHT,
    position: 'relative',
    paddingBottom: 4,
  },

  /* Orange glow capsule behind active icon */
  activePill: {
    position: 'absolute',
    top: 10,
    width: 42,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(249, 115, 22, 0.10)',
  },

  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    zIndex: 1,
  },

  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
    zIndex: 1,
  },
  tabLabelActive: {
    color: '#F97316',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* Small dot at the bottom of the active tab */
  activeDot: {
    position: 'absolute',
    bottom: 7,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F97316',
  },
});
