import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CollectionScreen from '../screens/CollectionScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import EventsScreen from '../screens/EventsScreen';
import ApprovalsScreen from '../screens/ApprovalsScreen';
import ChatScreen from '../screens/ChatScreen';
import MainTabNavigator from './MainTabNavigator';

import { useLanguage } from '../context/LanguageContext';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, mandal, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F6' }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  // Determine what to show after login
  const isSuperAdmin = user?.role === 'superadmin';
  const isPresident = user?.role === 'president';

  if (user && isPresident && user.mandalId && mandal === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F6' }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  const needsOnboarding = Boolean(
    user &&
    isPresident &&
    (!mandal?.name || mandal.name.includes("'s Mandal") || !mandal?.checklist?.profileComplete)
  );

  const hasPlanSelected = !!mandal?.checklist?.planSelected;
  const isPlanActive = mandal?.planStatus === 'Active';
  const hasValidPlan = mandal?.plan && mandal.plan !== 'None';

  const needsSubscription = (
    user &&
    isPresident &&
    !needsOnboarding &&
    !(hasPlanSelected && isPlanActive && hasValidPlan)
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          animation: 'slide_from_right',
          headerStyle: { backgroundColor: '#172554' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800', fontSize: 18 }
        }}
      >
        {!user ? (
          // ── Auth Stack ──────────────────────────────────
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : needsOnboarding ? (
          // ── President & Mandal Setup Form ───────────────
          <>
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : needsSubscription ? (
          // ── Subscription Gate ───────────────────────────
          <>
            <Stack.Screen
              name="SubscriptionGate"
              component={SubscriptionScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // ── Main App Stack ──────────────────────────────
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: t('nav.subscription') }} />
            <Stack.Screen name="Collection" component={CollectionScreen} options={{ title: t('nav.collection') }} />
            <Stack.Screen name="Receipts" component={ReceiptsScreen} options={{ title: t('nav.donationReceipts') }} />
            <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: t('nav.expenses') }} />
            <Stack.Screen name="Approvals" component={ApprovalsScreen} options={{ title: t('nav.approvals') }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="Events" component={EventsScreen} options={{ title: t('nav.events') }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
