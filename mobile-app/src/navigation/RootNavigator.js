import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
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

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, mandal, loading } = useAuth();

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

  // If user is a president with a mandalId, wait until mandal object is loaded
  // to prevent any frame glitch or screen flicker
  if (user && isPresident && user.mandalId && mandal === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F6' }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  // An existing registered user should NEVER be trapped in mandal setup.
  // Mandal Setup (OnboardingScreen) is ONLY rendered for a brand-new auto-created OTP president
  // who has not yet completed their Mandal Profile details.
  // Setup is considered COMPLETED if any of the following is true:
  // 1. mandal.checklist.profileComplete is true
  // 2. mandal.onboardingComplete is true
  // 3. mandal.name is customized and does not contain placeholder "'s Mandal"
  // 4. The user is a member/collector/treasurer/secretary/superadmin (not president)
  const isSetupCompleted = !isPresident || (
    mandal?.checklist?.profileComplete === true ||
    mandal?.onboardingComplete === true ||
    (mandal?.name && !mandal.name.includes("'s Mandal"))
  );

  const needsOnboarding = Boolean(user && isPresident && !isSetupCompleted);

  // New users see the Subscription Screen after selecting events to pick their plan.
  // Existing users with an active plan (planSelected: true or active subscription) proceed to Dashboard.
  const isPlanExpired = mandal?.planStatus === 'Expired';
  const hasPlanSelected = mandal?.checklist?.planSelected === true;
  const needsSubscription = Boolean(
    user &&
    isPresident &&
    !needsOnboarding &&
    (!hasPlanSelected || isPlanExpired)
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          animation: 'fade',
          headerStyle: { backgroundColor: '#172554' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800', fontSize: 18 }
        }}
      >
        {!user ? (
          // ── Auth Stack ──────────────────────────────────
          <>
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
              name="Subscription"
              component={SubscriptionScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // ── Main App Stack ──────────────────────────────
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscription Plans' }} />
            <Stack.Screen name="Collection" component={CollectionScreen} options={{ title: 'New Collection' }} />
            <Stack.Screen name="Receipts" component={ReceiptsScreen} options={{ title: 'Donation Receipts' }} />
            <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Expenses' }} />
            <Stack.Screen name="Approvals" component={ApprovalsScreen} options={{ title: 'Pending Approvals' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Committee Chat' }} />
            <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Events & Tasks' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}


