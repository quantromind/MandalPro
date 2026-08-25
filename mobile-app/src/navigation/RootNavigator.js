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

  // Check if new President needs to fill in their Profile & Mandal information first
  const needsOnboarding = user && isPresident && (!mandal?.checklist?.profileComplete || !user?.mobile);

  // Only the Mandal President manages the subscription plan for the Mandal.
  // Members / volunteers under the Mandal use the app completely FREE with zero payment barrier.
  const hasPlan = mandal?.checklist?.planSelected === true && mandal?.planStatus !== 'Expired';
  const needsSubscription = user && isPresident && !needsOnboarding && !hasPlan;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#FF6B00' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }}>
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


