import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeIcon, CollectionsIcon, ChatIcon, MoreIcon } from '../components/TabIcons';
import { useLanguage } from '../context/LanguageContext';
import AppHeader from '../components/AppHeader';
import QuickActionModal from '../components/QuickActionModal';
import AllSectionsModal from '../components/AllSectionsModal';
import LanguageModal from '../components/LanguageModal';

import DashboardScreen from '../screens/DashboardScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function CustomTabBar({ state, descriptors, navigation, onOpenQuickAction, onOpenMoreSections, showMoreSections }) {
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  // Safe bottom offset to position tabs completely above the system navigation bar
  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 10) + 6;

  // Route keys: 0: HomeTab, 1: CollectionsTab, 2: ChatTab, 3: ProfileTab
  const renderTabItem = (index, label, IconComponent) => {
    const route = state.routes[index];
    if (!route) return null;
    const isFocused = state.index === index;

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
        onPress={onPress}
        style={styles.tabItem}
        activeOpacity={0.75}
      >
        <View style={styles.iconWrap}>
          <IconComponent size={22} isFocused={isFocused} />
        </View>
        <Text
          style={[styles.tabLabel, isFocused ? styles.tabLabelActive : styles.tabLabelInactive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.outerWrapper, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 4) }]}>
      <View style={styles.floatingBar}>
        {/* 1. Home Tab */}
        {renderTabItem(0, language === 'mr' ? 'मुख्यपृष्ठ' : 'Home', HomeIcon)}

        {/* 2. Collections Tab */}
        {renderTabItem(1, language === 'mr' ? 'वर्गणी' : 'Collections', CollectionsIcon)}

        {/* 3. Center Elevated Orange (+) Button */}
        <TouchableOpacity
          style={styles.centerFab}
          onPress={onOpenQuickAction}
          activeOpacity={0.88}
        >
          <Text style={styles.fabPlusText}>+</Text>
        </TouchableOpacity>

        {/* 4. Chat Tab */}
        {renderTabItem(2, language === 'mr' ? 'संवाद' : 'Chat', ChatIcon)}

        {/* 5. More Tab (Opens All Sections bottom sheet modal) */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={showMoreSections ? { selected: true } : {}}
          onPress={onOpenMoreSections}
          style={styles.tabItem}
          activeOpacity={0.75}
        >
          <View style={styles.iconWrap}>
            <MoreIcon size={22} isFocused={showMoreSections} />
          </View>
          <Text
            style={[styles.tabLabel, showMoreSections ? styles.tabLabelActive : styles.tabLabelInactive]}
            numberOfLines={1}
          >
            {language === 'mr' ? 'अधिक' : 'More'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MainTabNavigator({ navigation }) {
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [showMoreSections, setShowMoreSections] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [activeRouteName, setActiveRouteName] = useState('HomeTab');

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => {
          const currentName = props.state.routes[props.state.index]?.name;
          return (
            <CustomTabBar
              {...props}
              onOpenQuickAction={() => setShowQuickAction(true)}
              onOpenMoreSections={() => {
                setActiveRouteName(currentName);
                setShowMoreSections(true);
              }}
              showMoreSections={showMoreSections}
            />
          );
        }}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={DashboardScreen}
          options={{
            headerShown: true,
            header: ({ navigation: nav }) => (
              <AppHeader
                navigation={nav}
                onOpenQuickAction={() => setShowQuickAction(true)}
                onOpenLanguage={() => setShowLanguageModal(true)}
              />
            ),
          }}
        />
        <Tab.Screen
          name="CollectionsTab"
          component={CollectionsScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="ChatTab"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>

      {/* ⚡ Quick Action Bottom Sheet Modal (Image 4) */}
      <QuickActionModal
        visible={showQuickAction}
        onClose={() => setShowQuickAction(false)}
        navigation={navigation}
      />

      {/* ☰ All Sections Bottom Sheet Modal (More Tab) */}
      <AllSectionsModal
        visible={showMoreSections}
        onClose={() => setShowMoreSections(false)}
        navigation={navigation}
        currentRoute={activeRouteName}
      />

      {/* Language Selection Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        canDismiss={true}
      />
    </>
  );
}

const BAR_HEIGHT = 64;

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 90,
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    height: BAR_HEIGHT,
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#F97316',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#64748B',
    fontWeight: '600',
  },

  /* Center Elevated Orange (+) Button */
  centerFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  fabPlusText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginTop: -2,
    lineHeight: 30,
  },
});

